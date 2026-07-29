import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GoogleLogin() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
    <div className="google-login-area">
      <button
        type="button"
        className="google-login-button"
        disabled={loading}
        onClick={() => void signInWithGoogle()}
      >
        {loading ? 'Opening Google...' : 'Continue with Google'}
      </button>

      {errorMessage && (
        <p className="google-login-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
