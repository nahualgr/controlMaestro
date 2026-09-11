import { useReconciliation } from '../../state/ReconciliationContext.jsx'
import { cargarMapeoTerminales } from '../../domain/config/terminalMappingStore.js'

export default function TerminalPairingStep() {
  const { deteccion, emparejamientoTerminalesSesion, emparejarTerminal } = useReconciliation()
  if (!deteccion) return null

  const mapeoGuardado = cargarMapeoTerminales()
  const pendientes = deteccion.terminalesClover.filter((t) => !(t in mapeoGuardado))
  const yaResueltos = deteccion.terminalesClover.filter((t) => t in mapeoGuardado)

  if (pendientes.length === 0 && yaResueltos.length === 0) return null

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h3 className="h6 fw-semibold mb-2">Terminales nuevas</h3>
        <p className="text-muted small">
          Encontramos estos identificadores de terminal en el campo "Dispositivo" del archivo de
          Clover. Elegí a qué número de terminal corresponden en Ventas.
        </p>

        {pendientes.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th>Dispositivo (Clover)</th>
                  <th>Terminal en Ventas</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((dispositivo) => (
                  <tr key={dispositivo}>
                    <td className="font-monospace">{dispositivo}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={emparejamientoTerminalesSesion[dispositivo] ?? ''}
                        onChange={(e) => emparejarTerminal(dispositivo, e.target.value)}
                      >
                        <option value="">Elegir…</option>
                        {deteccion.terminalesVentas.map((terminal) => (
                          <option key={terminal} value={terminal}>
                            {terminal}
                          </option>
                        ))}
                        <option value="__otro__">Otro (escribir)…</option>
                      </select>
                      {emparejamientoTerminalesSesion[dispositivo] === '__otro__' && (
                        <input
                          className="form-control form-control-sm mt-1"
                          placeholder="Escribí el número de terminal"
                          onChange={(e) => emparejarTerminal(dispositivo, e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {yaResueltos.length > 0 && (
          <p className="text-muted small mb-0">
            Ya emparejados de una sesión anterior:{' '}
            {yaResueltos.map((t) => `${t} → ${mapeoGuardado[t]}`).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
