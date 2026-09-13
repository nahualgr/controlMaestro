// Matching del canal Mercado Pago directo. Clave exacta: Autorización de
// Ventas === operation_id de MP (comparados sin ceros a la izquierda, ya
// que Ventas los recorta al cargar). Tolerancia de importe: exacta.
import { normalizarNumeroTexto } from '../normalizers/numericStringNormalizer.js'

export function matchearEventoMp(evento, mpRows) {
  const candidatos = mpRows.filter((m) => m.estado === 'approved' && !m._consumido)

  const match = candidatos.find((m) => normalizarNumeroTexto(m.operationId) === normalizarNumeroTexto(evento.autorizacion))

  if (!match) {
    return { estado: null, motivo: null, cobro: null, correccion: null, diferenciaImporte: null }
  }

  match._consumido = true
  const diferenciaImporte = redondear(match.importe - evento.importeTotal)

  const problemas = []
  if (diferenciaImporte !== 0) {
    problemas.push({ mensaje: `Diferencia importe $${diferenciaImporte}`, correccion: `Importe: $${evento.importeTotal}→$${match.importe}` })
  }
  if (evento.cupon !== 0) {
    problemas.push({ mensaje: 'Cupón debería ser 0', correccion: `Cupón: ${evento.cupon}→0` })
  }

  if (problemas.length === 0) {
    return { estado: 'OK', motivo: 'Conciliación correcta', correccion: null, diferenciaImporte: 0, cobro: match }
  }
  return {
    estado: 'Error',
    motivo: problemas.map((p) => p.mensaje).join(' · '),
    correccion: problemas.map((p) => p.correccion).join(' · '),
    diferenciaImporte,
    cobro: match,
  }
}

function redondear(n) {
  return Math.round(n * 100) / 100
}
