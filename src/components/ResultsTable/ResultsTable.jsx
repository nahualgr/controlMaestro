import { useMemo, useState } from 'react'

const ESTADO_BADGE = {
  OK: 'bg-success-subtle text-success-emphasis',
  Revisar: 'bg-warning-subtle text-warning-emphasis',
  Error: 'bg-danger-subtle text-danger-emphasis',
  Cancelado: 'bg-secondary-subtle text-secondary-emphasis',
}

export default function ResultsTable({ resultados }) {
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    return resultados.filter((r) => {
      if (filtroEstado !== 'Todos' && r.estado !== filtroEstado) return false
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return (
        r.autorizacion?.toString().toLowerCase().includes(q) ||
        r.cupon?.toString().toLowerCase().includes(q) ||
        r.terminal?.toString().toLowerCase().includes(q) ||
        r.filas.some((f) => f.comprobante?.toLowerCase().includes(q))
      )
    })
  }, [resultados, filtroEstado, busqueda])

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-semibold mb-0">Detalle de conciliación</h2>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {['Todos', 'OK', 'Revisar', 'Error', 'Cancelado'].map((op) => (
                <option key={op}>{op}</option>
              ))}
            </select>
            <input
              className="form-control form-control-sm"
              placeholder="Buscar por comprobante, cupón, terminal…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr className="text-muted small text-uppercase">
                <th>Estado</th>
                <th>Canal</th>
                <th>Terminal</th>
                <th>Tarjeta</th>
                <th>Autorización</th>
                <th>Cupón</th>
                <th>Importe</th>
                <th>Diferencia</th>
                <th>Comprobante</th>
                <th>Motivo</th>
                <th>Corrección sugerida</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className={`badge ${ESTADO_BADGE[r.estado]}`}>{r.estado}</span>
                  </td>
                  <td className="text-capitalize">{r.canal.replace('_', ' ')}</td>
                  <td>{r.terminal}</td>
                  <td>{r.tarjeta}</td>
                  <td>{r.autorizacion}</td>
                  <td>{r.cupon}</td>
                  <td>${r.importeTotal.toLocaleString('es-AR')}</td>
                  <td className={r.diferenciaImporte ? 'text-danger fw-semibold' : 'text-muted'}>
                    {r.diferenciaImporte === null || r.diferenciaImporte === undefined
                      ? '—'
                      : `$${r.diferenciaImporte.toLocaleString('es-AR')}`}
                  </td>
                  <td>{r.filas.map((f) => f.comprobante).join(', ')}</td>
                  <td className="small text-muted">{r.motivo}</td>
                  <td className="small text-muted">{r.correccion}</td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">
                    No hay resultados para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
