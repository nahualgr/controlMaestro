const TARJETAS = [
  { key: 'ok', label: 'OK', clase: 'text-success', icono: '🟢' },
  { key: 'revisar', label: 'Revisar', clase: 'text-warning-emphasis', icono: '🟡' },
  { key: 'error', label: 'Error', clase: 'text-danger', icono: '🔴' },
  { key: 'cancelado', label: 'Cancelado', clase: 'text-secondary', icono: '⚪' },
]

export default function SummaryPanel({ resumen }) {
  return (
    <div className="row g-3 mb-4">
      {TARJETAS.map((t) => (
        <div className="col-6 col-md-3" key={t.key}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-4">
              <div className="fs-2">{t.icono}</div>
              <div className={`fs-3 fw-bold ${t.clase}`}>{resumen[t.key]}</div>
              <div className="text-muted small text-uppercase">{t.label}</div>
            </div>
          </div>
        </div>
      ))}
      {resumen.cobrosSinVenta > 0 && (
        <div className="col-12">
          <div className="alert alert-warning mb-0">
            Hay <strong>{resumen.cobrosSinVenta}</strong> cobro(s) sin venta correspondiente. Revisá la
            pestaña "Cobros sin venta" más abajo.
          </div>
        </div>
      )}
    </div>
  )
}
