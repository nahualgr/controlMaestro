// Detecta cobros de Clover/Mercado Pago que no fueron consumidos por ningún
// evento de Ventas durante el matching (especificación §12).
export function encontrarCobrosSinVenta({ cloverRows, mpRows }) {
  const cloverHuerfanos = cloverRows
    .filter((c) => c.resultado === 'SUCCESS' && !c._consumido)
    .map((c) => ({
      canal: 'Clover',
      terminal: c.terminal,
      autorizacion: c.codigoAutorizacion,
      cupon: c.cupon,
      importe: c.importe + c.importeExtraCash,
      fecha: c.fecha,
      tarjeta: c.marcaTarjeta,
    }))

  const mpHuerfanos = mpRows
    .filter((m) => !m._consumido)
    .map((m) => ({
      canal: 'Mercado Pago',
      terminal: 1,
      autorizacion: m.operationId,
      cupon: 0,
      importe: m.importe,
      fecha: m.fecha,
      tarjeta: 'MPAGO',
    }))

  return [...cloverHuerfanos, ...mpHuerfanos]
}
