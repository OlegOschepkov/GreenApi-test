import { LoginScreen } from '@/components/LoginScreen/LoginScreen'
import { SessionStatus } from '@/components/SessionStatus/SessionStatus'
import { SessionProvider } from '@/services/SessionProvider'
import { useSession } from '@/services/session-context'
import '@/styles/main.scss'

function AppContent() {
  const { status } = useSession()

  return status === 'connected' ? <SessionStatus /> : <LoginScreen />
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}

export default App
