// Cuando una venta se carga con un dato clave equivocado (terminal, cupón o
// autorización), el sistema no logra unirla con su cobro real: la venta
// queda "sin cobro" y el cobro real que le correspondía queda "sin venta".
// Son las dos caras del mismo error de carga. Esta función cruza ambas
// listas por IMPORTE EXACTO para sugerir qué pares probablemente son la
// misma operación, así el usuario los revisa y corrige la clave a mano.
export function sugerirCoincidenciasPorImporte(ventasSinCobro, cobrosSinVenta) {
  const sugerenciasPorVenta = new Map() // id de evento -> candidatos
  const sugerenciasPorCobro = new Map() // referencia de cobro -> ventas candidatas

  for (const venta of ventasSinCobro) {
    const candidatos = cobrosSinVenta.filter((c) => redondear(c.importe) === redondear(venta.importeTotal))
    if (candidatos.length === 0) continue
    sugerenciasPorVenta.set(venta.id, candidatos)
    for (const c of candidatos) {
      const lista = sugerenciasPorCobro.get(c) ?? []
      lista.push(venta)
      sugerenciasPorCobro.set(c, lista)
    }
  }

  return { sugerenciasPorVenta, sugerenciasPorCobro }
}

export function describirSugerenciaParaVenta(candidatos) {
  if (!candidatos || candidatos.length === 0) return ''
  if (candidatos.length > 1) {
    return `Hay ${candidatos.length} cobros sin venta con este mismo importe, revisar manualmente cuál corresponde`
  }
  const c = candidatos[0]
  return `Posible cobro en ${c.canal}, terminal ${c.terminal}, autorización ${c.autorizacion}, cupón ${c.cupon} — revisar si la venta se cargó con datos incorrectos`
}

export function describirSugerenciaParaCobro(ventas) {
  if (!ventas || ventas.length === 0) return ''
  if (ventas.length > 1) {
    return `Hay ${ventas.length} ventas sin cobro con este mismo importe, revisar manualmente cuál corresponde`
  }
  const v = ventas[0]
  const comprobantes = v.filas.map((f) => f.comprobante).join(', ')
  return `Posible venta sin cobro: comprobante ${comprobantes} — revisar si se cargó con datos incorrectos`
}

function redondear(n) {
  return Math.round(n * 100) / 100
}
