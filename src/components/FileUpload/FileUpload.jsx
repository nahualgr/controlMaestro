import { useReconciliation } from '../../state/ReconciliationContext.jsx'

const CAMPOS = [
  { tipo: 'ventas', label: 'Ventas', ayuda: 'Excel (.xlsx) con la hoja "Resumen"', accept: '.xlsx' },
  { tipo: 'clover', label: 'Clover', ayuda: 'Export de pagos (.csv)', accept: '.csv' },
  { tipo: 'mp', label: 'Mercado Pago', ayuda: 'Export de operaciones (.xlsx)', accept: '.xlsx' },
]

export default function FileUpload() {
  const { archivos, cargarArchivo, detectarTarjetas, estado, error } = useReconciliation()
  const listoParaContinuar = archivos.ventas && archivos.clover && archivos.mp

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body p-4">
        <h2 className="h5 mb-4 fw-semibold">1. Cargar archivos</h2>
        <div className="row g-3">
          {CAMPOS.map(({ tipo, label, ayuda, accept }) => (
            <div className="col-md-4" key={tipo}>
              <label className="form-label fw-medium">{label}</label>
              <input
                type="file"
                className="form-control"
                accept={accept}
                onChange={(e) => cargarArchivo(tipo, e.target.files[0] ?? null)}
              />
              <div className="form-text">{ayuda}</div>
              {archivos[tipo] && (
                <div className="small text-success mt-1">✓ {archivos[tipo].name}</div>
              )}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        <button
          className="btn btn-brand mt-4"
          disabled={!listoParaContinuar || estado === 'detectando' || estado === 'procesando'}
          onClick={detectarTarjetas}
        >
          {estado === 'detectando'
            ? 'Analizando archivos…'
            : estado === 'procesando'
            ? 'Conciliando…'
            : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
