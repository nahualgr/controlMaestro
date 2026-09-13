// Cuando una venta se carga con un dato clave equivocado (terminal, cupón o
// autorización), el sistema no logra unirla con su cobro real: la venta
// queda "sin cobro" y el cobro real que le correspondía queda "sin venta".
// Son las dos caras del mismo error de carga. Esta función cruza ambas
// listas por IMPORTE EXACTO para sugerir qué pares probablemente son la
// misma operación, así el usuario los revisa y corrige la clave a mano.

// cloverRows/mpRows ya procesados (post-matching). Devuelve los cobros que
// quedaron sin ninguna venta asignada, sea de Clover o de Mercado Pago.
export function encontrarCobrosSinVentaCrudos(cloverRows, mpRows) {
  const cloverSinVenta = cloverRows
    .filter((c) => c.resultado === 'SUCCESS' && !c._consumido)
    .map((c) => ({ row: c, canal: 'Clover', importe: c.importe + c.importeExtraCash }))
  const mpSinVenta = mpRows
    .filter((m) => m.estado === 'approved' && !m._consumido)
    .map((m) => ({ row: m, canal: 'Mercado Pago', importe: m.importe }))
  return [...cloverSinVenta, ...mpSinVenta]
}

export function sugerirCoincidenciasPorImporte(ventasSinCobro, cobrosSinVentaCrudos) {
  const sugerenciasPorVenta = new Map() // id de evento -> [{ row, canal, importe }]
  const sugerenciasPorCobro = new Map() // referencia de fila cruda -> [ventas]

  for (const venta of ventasSinCobro) {
    const candidatos = cobrosSinVentaCrudos.filter((c) => redondear(c.importe) === redondear(venta.importeTotal))
    if (candidatos.length === 0) continue
    sugerenciasPorVenta.set(venta.id, candidatos)
    for (const c of candidatos) {
      const lista = sugerenciasPorCobro.get(c.row) ?? []
      lista.push(venta)
      sugerenciasPorCobro.set(c.row, lista)
    }
  }

  return { sugerenciasPorVenta, sugerenciasPorCobro }
}

export function describirSugerenciaParaVenta(candidatos) {
  if (!candidatos || candidatos.length === 0) return ''
  if (candidatos.length > 1) {
    return `Hay ${candidatos.length} cobros sin venta con este mismo importe, revisar manualmente`
  }
  const { row, canal } = candidatos[0]
  if (canal === 'Clover') {
    return `Posible cobro en Clover, terminal ${row.terminal}, autorización ${row.codigoAutorizacion}, cupón ${row.cupon}`
  }
  return `Posible cobro en Mercado Pago, operación ${row.operationId}`
}

export function describirSugerenciaParaCobro(ventas) {
  if (!ventas || ventas.length === 0) return ''
  if (ventas.length > 1) {
    return `Hay ${ventas.length} ventas sin cobro con este mismo importe, revisar manualmente`
  }
  const v = ventas[0]
  const comprobantes = v.filas.map((f) => f.comprobante).join(', ')
  return `Posible venta sin cobro: comprobante ${comprobantes}`
}

function redondear(n) {
  return Math.round(n * 100) / 100
}
