import { ReconciliationProvider } from './state/ReconciliationContext.jsx'
import HomePage from './pages/HomePage.jsx'

export default function App() {
  return (
    <ReconciliationProvider>
      <HomePage />
    </ReconciliationProvider>
  )
}
