import { describirSugerenciaParaCobro } from '../../domain/reconciliation/orphanCrossMatcher.js'

export default function OrphanPaymentsTable({ cobrosSinVenta, sugerenciasPorCobro }) {
  if (cobrosSinVenta.length === 0) return null

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h2 className="h5 fw-semibold mb-3">Cobros sin venta correspondiente</h2>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr className="text-muted small text-uppercase">
                <th>Canal</th>
                <th>Terminal</th>
                <th>Autorización</th>
                <th>Cupón</th>
                <th>Tarjeta</th>
                <th>Importe</th>
                <th>Fecha</th>
                <th>Posible coincidencia</th>
              </tr>
            </thead>
            <tbody>
              {cobrosSinVenta.map((h, i) => (
                <tr key={i}>
                  <td>{h.canal}</td>
                  <td>{h.terminal}</td>
                  <td>{h.autorizacion}</td>
                  <td>{h.cupon}</td>
                  <td>{h.tarjeta}</td>
                  <td>${h.importe.toLocaleString('es-AR')}</td>
                  <td>{h.fecha ? h.fecha.toLocaleString('es-AR') : ''}</td>
                  <td className="small text-warning-emphasis">
                    {describirSugerenciaParaCobro(sugerenciasPorCobro?.get(h))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
