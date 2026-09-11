import { useReconciliation } from '../../state/ReconciliationContext.jsx'
import { cargarMapeo } from '../../domain/config/cardMappingStore.js'
import { cargarMapeoTerminales } from '../../domain/config/terminalMappingStore.js'
import CardPairingStep from '../CardPairing/CardPairingStep.jsx'
import TerminalPairingStep from '../TerminalPairing/TerminalPairingStep.jsx'

export default function PairingStep() {
  const { deteccion, emparejamientoSesion, emparejamientoTerminalesSesion, confirmarEmparejamientoYConciliar } =
    useReconciliation()
  if (!deteccion) return null

  const mapeoGuardado = cargarMapeo()
  const pendientesTarjetas = deteccion.marcasClover.filter((m) => !(m.toUpperCase() in mapeoGuardado))
  const faltanTarjetas = pendientesTarjetas.some((m) => !emparejamientoSesion[m])

  const mapeoTerminalesGuardado = cargarMapeoTerminales()
  const pendientesTerminales = deteccion.terminalesClover.filter((t) => !(t in mapeoTerminalesGuardado))
  const faltanTerminales = pendientesTerminales.some((t) => !emparejamientoTerminalesSesion[t])

  const faltaAlgo = faltanTarjetas || faltanTerminales

  return (
    <div className="mb-4">
      <h2 className="h5 fw-semibold mb-3">2. Emparejar tarjetas y terminales nuevas</h2>
      <CardPairingStep />
      <TerminalPairingStep />
      <button className="btn btn-brand" disabled={faltaAlgo} onClick={confirmarEmparejamientoYConciliar}>
        Confirmar y conciliar
      </button>
      {faltaAlgo && (
        <span className="text-muted small ms-2">Completá todos los emparejamientos antes de continuar.</span>
      )}
    </div>
  )
}
