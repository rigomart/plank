import { Github, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Session } from '../App'
import { trpc } from '../trpc'
import { Button } from './ui/button'

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
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex w-[320px] flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-card-foreground">Plank</span>
          <span className="text-xs text-muted-foreground">
            Connect your GitHub account to get started
          </span>
        </div>

        {state === 'idle' && (
          <Button variant="outline" className="w-full gap-2" onClick={handleLogin}>
            <Github className="size-4" />
            Sign in with GitHub
          </Button>
        )}

        {state === 'waiting' && (
          <div className="flex w-full flex-col items-center gap-4 border border-border bg-card p-5">
            <span className="text-xs text-muted-foreground">Enter this code on GitHub</span>
            <div className="select-all font-mono text-2xl font-bold tracking-[0.2em] text-card-foreground">
              {userCode}
            </div>
            <a
              className="text-[11px] text-muted-foreground transition-colors hover:text-card-foreground"
              href={verificationUri}
              target="_blank"
              rel="noreferrer"
            >
              {verificationUri}
            </a>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Waiting for authorization...
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex w-full flex-col items-center gap-3 border border-destructive/30 bg-card p-5">
            <p className="text-center text-xs text-destructive">{error}</p>
            <Button variant="outline" className="gap-2" onClick={handleLogin}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
