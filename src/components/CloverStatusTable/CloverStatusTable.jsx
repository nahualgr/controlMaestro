import { useMemo, useState } from 'react'
import { describirSugerenciaParaCobro } from '../../domain/reconciliation/orphanCrossMatcher.js'

const ESTADO_BADGE = {
  OK: 'bg-success-subtle text-success-emphasis',
  Revisar: 'bg-warning-subtle text-warning-emphasis',
  Error: 'bg-danger-subtle text-danger-emphasis',
}

function estadoDeFila(c) {
  if (c.resultado !== 'SUCCESS') return { texto: 'Ignorada (FAIL)', clase: 'bg-secondary-subtle text-secondary-emphasis' }
  if (c._resultadoVenta) return { texto: c._resultadoVenta.estado, clase: ESTADO_BADGE[c._resultadoVenta.estado] }
  return { texto: 'Sin venta', clase: 'bg-danger-subtle text-danger-emphasis' }
}

export default function CloverStatusTable({ cloverRows, sugerenciasPorCobro }) {
  const [filtro, setFiltro] = useState('Todos')

  const filtrados = useMemo(() => {
    if (filtro === 'Todos') return cloverRows
    return cloverRows.filter((c) => estadoDeFila(c).texto === filtro)
  }, [cloverRows, filtro])

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-semibold mb-0">Clover — todas las operaciones ({cloverRows.length})</h2>
          <select className="form-select form-select-sm" style={{ maxWidth: 220 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {['Todos', 'OK', 'Revisar', 'Error', 'Sin venta', 'Ignorada (FAIL)'].map((op) => (
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
                <th>Medio</th>
                <th>Marca</th>
                <th>Terminal</th>
                <th>Autorización</th>
                <th>Cupón</th>
                <th>Importe</th>
                <th>Venta asociada / Sugerencia</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c, i) => {
                const estado = estadoDeFila(c)
                return (
                  <tr key={i}>
                    <td><span className={`badge ${estado.clase}`}>{estado.texto}</span></td>
                    <td>{c.fecha ? c.fecha.toLocaleString('es-AR') : ''}</td>
                    <td>{c.medioDePago}</td>
                    <td>{c.marcaTarjeta}</td>
                    <td>{c.terminal}</td>
                    <td>{c.codigoAutorizacion}</td>
                    <td>{c.cupon}</td>
                    <td>${(c.importe + c.importeExtraCash).toLocaleString('es-AR')}</td>
                    <td className="small text-muted">
                      {c._resultadoVenta ? c._resultadoVenta.comprobante : describirSugerenciaParaCobro(sugerenciasPorCobro?.get(c))}
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
