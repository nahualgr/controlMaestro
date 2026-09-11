import { useReconciliation } from '../../state/ReconciliationContext.jsx'
import { cargarMapeo } from '../../domain/config/cardMappingStore.js'

export default function CardPairingStep() {
  const { deteccion, emparejamientoSesion, emparejar } = useReconciliation()
  if (!deteccion) return null

  const mapeoGuardado = cargarMapeo()
  const pendientes = deteccion.marcasClover.filter((m) => !(m.toUpperCase() in mapeoGuardado))
  const yaResueltas = deteccion.marcasClover.filter((m) => m.toUpperCase() in mapeoGuardado)

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body p-4">
        <h3 className="h6 fw-semibold mb-2">Tarjetas nuevas</h3>
        <p className="text-muted small">
          Encontramos marcas de tarjeta en el archivo de Clover que todavía no tienen equivalencia
          en Ventas. Elegí a qué código de Ventas corresponde cada una.
        </p>

        {pendientes.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th>Marca en Clover</th>
                  <th>Código en Ventas</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((marca) => (
                  <tr key={marca}>
                    <td className="font-monospace">{marca}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={emparejamientoSesion[marca] ?? ''}
                        onChange={(e) => emparejar(marca, e.target.value)}
                      >
                        <option value="">Elegir…</option>
                        {deteccion.codigosVentas.map((codigo) => (
                          <option key={codigo} value={codigo}>
                            {codigo}
                          </option>
                        ))}
                        <option value="__otro__">Otro (escribir)…</option>
                      </select>
                      {emparejamientoSesion[marca] === '__otro__' && (
                        <input
                          className="form-control form-control-sm mt-1"
                          placeholder="Escribí el código de Ventas"
                          onChange={(e) => emparejar(marca, e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {yaResueltas.length > 0 && (
          <p className="text-muted small mb-0">
            Ya emparejadas de una sesión anterior: {yaResueltas.map((m) => `${m} → ${mapeoGuardado[m.toUpperCase()]}`).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
