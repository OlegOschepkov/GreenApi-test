import { ThemeProvider } from 'styled-components'

import { AppStyles } from '@/styles'
import { theme } from '@/styles/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppStyles />
      <p>styled-components wired</p>
    </ThemeProvider>
  )
}

export default App
