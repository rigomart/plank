import { useState } from 'react'
import type { Session } from '../App'
import { trpc } from '../trpc'

interface LoginScreenProps {
  onLogin: (session: Session) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'waiting' | 'error'>('idle')
  const [userCode, setUserCode] = useState('')
  const [verificationUri, setVerificationUri] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (): Promise<void> => {
    setState('waiting')
    setError('')

    try {
      const device = await trpc.auth.startDeviceFlow.mutate()
      setUserCode(device.user_code)
      setVerificationUri(device.verification_uri)

      window.open(device.verification_uri, '_blank')

      trpc.auth.pollForToken.subscribe(
        { deviceCode: device.device_code, interval: device.interval },
        {
          onData(event) {
            if (event.type === 'success') {
              onLogin(event.session)
            } else if (event.type === 'error') {
              setError(event.message)
              setState('error')
            }
          },
          onError(err) {
            setError(err.message)
            setState('error')
          },
          onComplete() {}
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start login')
      setState('error')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">Plank</div>
        <p className="login-subtitle">Connect your GitHub account to get started</p>

        {state === 'idle' && (
          <button type="button" className="login-button" onClick={handleLogin}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              role="img"
              aria-label="GitHub"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </button>
        )}

        {state === 'waiting' && (
          <div className="device-flow">
            <p className="device-instruction">Enter this code on GitHub:</p>
            <div className="device-code">{userCode}</div>
            <a className="device-link" href={verificationUri} target="_blank" rel="noreferrer">
              {verificationUri}
            </a>
            <div className="device-waiting">
              <div className="loading-spinner" />
              <span>Waiting for authorization...</span>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="login-error">
            <p>{error}</p>
            <button
              type="button"
              className="login-button login-button--retry"
              onClick={handleLogin}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
