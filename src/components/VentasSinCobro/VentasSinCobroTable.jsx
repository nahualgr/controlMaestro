import { describirSugerenciaParaVenta } from '../../domain/reconciliation/orphanCrossMatcher.js'

export default function VentasSinCobroTable({ ventasSinCobro, sugerenciasPorVenta }) {
  if (ventasSinCobro.length === 0) return null

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h2 className="h5 fw-semibold mb-3">Ventas sin cobro correspondiente</h2>
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
                <th>Comprobante</th>
                <th>Posible coincidencia</th>
              </tr>
            </thead>
            <tbody>
              {ventasSinCobro.map((r) => (
                <tr key={r.id}>
                  <td className="text-capitalize">{r.canal.replace('_', ' ')}</td>
                  <td>{r.terminal}</td>
                  <td>{r.autorizacion}</td>
                  <td>{r.cupon}</td>
                  <td>{r.tarjeta}</td>
                  <td>${r.importeTotal.toLocaleString('es-AR')}</td>
                  <td>{r.filas.map((f) => f.comprobante).join(', ')}</td>
                  <td className="small text-warning-emphasis">
                    {describirSugerenciaParaVenta(sugerenciasPorVenta?.get(r.id))}
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
