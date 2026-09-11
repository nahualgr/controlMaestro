import FileUpload from '../components/FileUpload/FileUpload.jsx'
import PairingStep from '../components/PairingStep/PairingStep.jsx'
import SummaryPanel from '../components/SummaryPanel/SummaryPanel.jsx'
import ResultsTable from '../components/ResultsTable/ResultsTable.jsx'
import OrphanPaymentsTable from '../components/OrphanPaymentsTable/OrphanPaymentsTable.jsx'
import ExportButton from '../components/ExportButton/ExportButton.jsx'
import { useReconciliation } from '../state/ReconciliationContext.jsx'

export default function HomePage() {
  const { resultado, estado, reiniciar } = useReconciliation()

  return (
    <div className="container py-5" style={{ maxWidth: 1100 }}>
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-1">Conciliación</h1>
        <p className="text-muted mb-0">
          Ventas contra Clover y Mercado Pago — todo se procesa en tu navegador, ningún archivo se
          envía a un servidor.
        </p>
      </header>

      <FileUpload />

      {estado === 'emparejando' && <PairingStep />}

      {estado === 'listo' && resultado && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 fw-semibold mb-0">Resultado</h2>
            <div className="d-flex gap-2">
              <ExportButton resultado={resultado} />
              <button className="btn btn-outline-secondary" onClick={reiniciar}>
                Empezar de nuevo
              </button>
            </div>
          </div>
          <SummaryPanel resumen={resultado.resumen} />
          <ResultsTable resultados={resultado.resultados} />
          <OrphanPaymentsTable cobrosSinVenta={resultado.cobrosSinVenta} />
        </>
      )}
    </div>
  )
}
