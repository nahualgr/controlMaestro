// Matching del canal Mercado Pago directo. Clave exacta: Autorización de
// Ventas === operation_id de MP. Tolerancia de importe: exacta (sin margen).
export function matchearEventoMp(evento, mpRows) {
  const candidatos = mpRows.filter((m) => !m._consumido)

  const match = candidatos.find((m) => m.operationId === evento.autorizacion)

  if (!match) {
    return { estado: null, motivo: null, cobro: null }
  }

  match._consumido = true

  const problemas = []
  if (match.importe !== evento.importeTotal) {
    problemas.push(`Diferencia de importe: Ventas $${evento.importeTotal} vs Mercado Pago $${match.importe}`)
  }
  if (evento.cupon !== 0) {
    problemas.push(`Cupón cargado como ${evento.cupon}, debería ser 0 para operaciones MPAGO`)
  }

  if (problemas.length === 0) {
    return { estado: 'OK', motivo: 'Conciliación correcta', cobro: match }
  }
  return { estado: 'Error', motivo: problemas.join(' · '), cobro: match }
}
