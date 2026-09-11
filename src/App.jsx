import { useState } from 'react'
import { ReconciliationProvider } from './state/ReconciliationContext.jsx'
import HomePage from './pages/HomePage.jsx'
import CardMappingConfig from './components/CardMappingConfig/CardMappingConfig.jsx'

export default function App() {
  const [vista, setVista] = useState('conciliar') // 'conciliar' | 'configuracion'

  return (
    <ReconciliationProvider>
      <nav className="navbar navbar-expand bg-white border-bottom">
        <div className="container" style={{ maxWidth: 1100 }}>
          <span className="navbar-brand fw-bold">controlMaestro</span>
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${vista === 'conciliar' ? 'btn-brand' : 'btn-outline-secondary'}`}
              onClick={() => setVista('conciliar')}
            >
              Conciliar
            </button>
            <button
              className={`btn btn-sm ${vista === 'configuracion' ? 'btn-brand' : 'btn-outline-secondary'}`}
              onClick={() => setVista('configuracion')}
            >
              Equivalencias guardadas
            </button>
          </div>
        </div>
      </nav>

      {vista === 'conciliar' ? <HomePage /> : <CardMappingConfig />}
    </ReconciliationProvider>
  )
}
