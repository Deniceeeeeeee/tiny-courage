import { useEffect, useRef, useState } from 'react'
import { Hand, Plus } from 'lucide-react'
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import {
  detectThumbTouch,
  EMPTY_TOUCH_STATE,
  FINGERTIP_IDS,
  type TouchState,
} from '../utils/handGestureDetection'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]

interface Props {
  stream: MediaStream | null
  paused: boolean
  cooldownUntil: number
  onGesture: () => void
  onManual: () => void
}

function drawOverlay(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  glowFinger: number | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)
  const point = (id: number) => ({ x: (1 - landmarks[id].x) * width, y: landmarks[id].y * height })
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, width / 190)
  ctx.strokeStyle = 'rgba(255,255,255,.68)'
  CONNECTIONS.forEach(([a, b]) => {
    const p1 = point(a); const p2 = point(b)
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()
  })
  const tips = [4, ...FINGERTIP_IDS]
  tips.forEach((id) => {
    const p = point(id)
    const thumb = id === 4
    ctx.beginPath()
    ctx.arc(p.x, p.y, thumb ? 12 : 7, 0, Math.PI * 2)
    ctx.fillStyle = thumb ? '#ffd85f' : '#fffdf6'
    ctx.fill()
    ctx.lineWidth = thumb ? 3 : 2
    ctx.strokeStyle = '#191713'
    ctx.stroke()
    if (id === glowFinger) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,216,95,.35)'; ctx.fill()
    }
  })
}

export default function GestureCamera({ stream, paused, cooldownUntil, onGesture, onManual }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const touchRef = useRef<TouchState>({ ...EMPTY_TOUCH_STATE })
  const runningRef = useRef(true)
  const lastVideoTime = useRef(-1)
  const liveProps = useRef({ paused, cooldownUntil, onGesture })
  liveProps.current = { paused, cooldownUntil, onGesture }
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [glow, setGlow] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      void videoRef.current.play().catch(() => {
        // The browser may briefly interrupt playback while replacing the stream.
      })
    }
  }, [stream])

  useEffect(() => {
    runningRef.current = true
    let frame = 0
    const prepare = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.62,
          minHandPresenceConfidence: 0.58,
          minTrackingConfidence: 0.58,
        })
        if (!runningRef.current) return
        setStatus('ready')
        frame = requestAnimationFrame(loop)
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(WASM_URL)
          landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numHands: 1,
          })
          setStatus('ready')
          frame = requestAnimationFrame(loop)
        } catch {
          setStatus('error')
        }
      }
    }
    const loop = () => {
      if (!runningRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current
      if (video && canvas && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        const result = landmarker.detectForVideo(video, performance.now())
        const hand = result.landmarks[0]
        if (hand) {
          const detection = detectThumbTouch(hand, touchRef.current)
          touchRef.current = detection.nextState
          const triggerId = detection.triggered ? FINGERTIP_IDS[['index', 'middle', 'ring', 'little'].indexOf(detection.triggered)] : null
          drawOverlay(canvas, hand, triggerId)
          if (detection.triggered && !liveProps.current.paused && Date.now() >= liveProps.current.cooldownUntil) {
            setGlow(true)
            window.setTimeout(() => setGlow(false), 300)
            navigator.vibrate?.(28)
            liveProps.current.onGesture()
          }
        } else {
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      frame = requestAnimationFrame(loop)
    }
    void prepare()
    return () => {
      runningRef.current = false
      cancelAnimationFrame(frame)
      landmarkerRef.current?.close()
    }
  }, [])

  return (
    <section className={`camera-card ${glow ? 'gesture-success' : ''}`} aria-label="Hand gesture camera">
      <div className="camera-frame">
        <video ref={videoRef} muted playsInline aria-label="Front camera preview" />
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="live-pill"><i /> {status === 'ready' ? 'GESTURE READY' : status === 'loading' ? 'LOADING HAND TRACKING' : 'CAMERA-ONLY MODE'}</div>
        <div className="camera-corners" aria-hidden="true" />
        {status === 'error' && <div className="camera-error">Hand tracking couldn’t start. Manual add is ready below.</div>}
      </div>
      <div className="gesture-instruction">
        <div className="pinch-symbol" aria-hidden="true"><Hand size={27} /><i /></div>
        <p><strong>Touch a fingertip to your thumb</strong><span>Index, middle, ring or little — after meeting someone new.</span></p>
      </div>
      <button className="manual-button" onClick={onManual}><Plus size={17} /> Add Person Manually</button>
    </section>
  )
}
