// Matching del canal Mercado Pago directo. Clave exacta: Autorización de
// Ventas === operation_id de MP. Tolerancia de importe: exacta (sin margen).
export function matchearEventoMp(evento, mpRows) {
  const candidatos = mpRows.filter((m) => !m._consumido)

  const match = candidatos.find((m) => m.operationId === evento.autorizacion)

  if (!match) {
    return { estado: null, motivo: null, cobro: null, correccion: null, diferenciaImporte: null }
  }

  match._consumido = true
  const diferenciaImporte = redondear(match.importe - evento.importeTotal)

  const problemas = []
  if (diferenciaImporte !== 0) {
    problemas.push({
      mensaje: `Diferencia de importe: Ventas $${evento.importeTotal} vs Mercado Pago $${match.importe}`,
      correccion: `Corregir Importe: cargado $${evento.importeTotal}, el cobro real en Mercado Pago es $${match.importe} (diferencia $${diferenciaImporte})`,
    })
  }
  if (evento.cupon !== 0) {
    problemas.push({
      mensaje: `Cupón cargado como ${evento.cupon}, debería ser 0 para operaciones MPAGO`,
      correccion: `Corregir Cupón: cargado ${evento.cupon}, debería ser 0`,
    })
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
