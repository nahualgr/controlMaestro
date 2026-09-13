import { useMemo, useState } from 'react'
import { describirSugerenciaParaCobro } from '../../domain/reconciliation/orphanCrossMatcher.js'

const ESTADO_BADGE = {
  OK: 'bg-success-subtle text-success-emphasis',
  Revisar: 'bg-warning-subtle text-warning-emphasis',
  Error: 'bg-danger-subtle text-danger-emphasis',
}

function estadoDeFila(m) {
  if (m.estado !== 'approved') return { texto: 'Ignorada (no aprobada)', clase: 'bg-secondary-subtle text-secondary-emphasis' }
  if (m._resultadoVenta) return { texto: m._resultadoVenta.estado, clase: ESTADO_BADGE[m._resultadoVenta.estado] }
  return { texto: 'Sin venta', clase: 'bg-danger-subtle text-danger-emphasis' }
}

export default function MpStatusTable({ mpRows, sugerenciasPorCobro }) {
  const [filtro, setFiltro] = useState('Todos')

  const filtrados = useMemo(() => {
    if (filtro === 'Todos') return mpRows
    return mpRows.filter((m) => estadoDeFila(m).texto === filtro)
  }, [mpRows, filtro])

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-semibold mb-0">Mercado Pago — todas las operaciones ({mpRows.length})</h2>
          <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {['Todos', 'OK', 'Revisar', 'Error', 'Sin venta', 'Ignorada (no aprobada)'].map((op) => (
              <option key={op}>{op}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive" style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table className="table table-sm align-middle">
            <thead>
              <tr className="text-muted small text-uppercase">
                <th>Estado</th>
                <th>Fecha</th>
                <th>Operación (operation_id)</th>
                <th>Importe</th>
                <th>Estado MP</th>
                <th>Venta asociada / Sugerencia</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m, i) => {
                const estado = estadoDeFila(m)
                return (
                  <tr key={i}>
                    <td><span className={`badge ${estado.clase}`}>{estado.texto}</span></td>
                    <td>{m.fecha ? m.fecha.toLocaleString('es-AR') : ''}</td>
                    <td>{m.operationId}</td>
                    <td>${m.importe.toLocaleString('es-AR')}</td>
                    <td>{m.estado}</td>
                    <td className="small text-muted">
                      {m._resultadoVenta ? m._resultadoVenta.comprobante : describirSugerenciaParaCobro(sugerenciasPorCobro?.get(m))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
