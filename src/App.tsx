import { ChatScreen } from '@/components/ChatScreen/ChatScreen'
import { LoginScreen } from '@/components/LoginScreen/LoginScreen'
import { SessionProvider } from '@/services/SessionProvider'
import { useSession } from '@/services/session-context'
import '@/styles/main.scss'

function AppContent() {
  const { status } = useSession()

  return status === 'connected' ? <ChatScreen /> : <LoginScreen />
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}

export default App
