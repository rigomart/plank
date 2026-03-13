import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Workbench } from './components/Workbench'
import { trpc } from './trpc'

interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
}

export interface Session {
  token: string
  user: GitHubUser
}

function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trpc.auth.session
      .query()
      .then((s) => setSession(s))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = useCallback(() => {
    trpc.auth.logout.mutate().then(() => setSession(null))
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} />
  }

  return <Workbench session={session} onLogout={handleLogout} />
}

export default App
