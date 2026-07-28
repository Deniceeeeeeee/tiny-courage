import { Camera, CameraOff, Plus } from 'lucide-react'

interface Props {
  status: 'idle' | 'requesting' | 'denied' | 'unavailable'
  onOpen: () => void
  onManual: () => void
}

export default function CameraPermission({ status, onOpen, onManual }: Props) {
  const failed = status === 'denied' || status === 'unavailable'
  return (
    <main className="center-screen permission-screen">
      <button className="wordmark" type="button" aria-label="Tiny Courage home">Tiny Courage<span>.</span></button>
      <section className="permission-card">
        <div className="camera-illustration" aria-hidden="true">
          {failed ? <CameraOff size={62} /> : <Camera size={62} />}
          <i className="gesture-dot one" /><i className="gesture-dot two" /><i className="gesture-dot three" />
        </div>
        <p className="eyebrow">One small permission</p>
        <h1>Your camera spots the courage.</h1>
        <p>We use your front camera only to recognise a fingertip touching your thumb. Video never leaves your device, and nothing is recorded.</p>
        {failed && (
          <div className="error-message" role="alert">
            {status === 'denied'
              ? 'Camera access was blocked. Check your browser settings, then try again—or keep going manually.'
              : 'A camera is not available on this device. You can still build your crowd manually.'}
          </div>
        )}
        <button className="primary-button" onClick={onOpen} disabled={status === 'requesting'}>
          <Camera size={20} /> {status === 'requesting' ? 'Opening…' : failed ? 'Try Camera Again' : 'Open Camera'}
        </button>
        <button className="text-button" onClick={onManual}><Plus size={18} /> Add Person Manually</button>
      </section>
      <p className="privacy-note">Camera processing happens entirely on this device.</p>
    </main>
  )
}
