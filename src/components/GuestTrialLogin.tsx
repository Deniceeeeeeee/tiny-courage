import { useState } from 'react'
import { supabase } from '../lib/supabase'

type GuestTrialLoginProps = {
  open: boolean
  onClose: () => void
}

export default function GuestTrialLogin({
  open,
  onClose,
}: GuestTrialLoginProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!open) return null

  const signInWithGoogle = async () => {
    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      console.error('Google sign-in failed:', error)
      setErrorMessage(error.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="guest-login-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-login-title"
    >
      <section className="guest-login-card">
        <p className="eyebrow">Your first event is complete</p>
        <h2 id="guest-login-title">Save your little crowd</h2>

        <p>
          Sign in with Google to keep this event, access it across devices,
          and create more Tiny Courage events.
        </p>

        <button
          type="button"
          className="primary-button"
          disabled={loading}
          onClick={() => void signInWithGoogle()}
        >
          {loading ? 'Opening Google...' : 'Save with Google'}
        </button>

        <button
          type="button"
          className="manual-button"
          disabled={loading}
          onClick={onClose}
        >
          Stay on recap
        </button>

        {errorMessage && (
          <p className="google-login-error" role="alert">
            {errorMessage}
          </p>
        )}
      </section>
    </div>
  )
}
