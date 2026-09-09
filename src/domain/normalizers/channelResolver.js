// Separa las filas de Ventas en los dos canales de cobro independientes:
// Clover (tarjetas + QR vía posnet Clover) y Mercado Pago directo
// (Terminal=1, Tarjeta=MPAGO). Verificado 1 a 1 contra datos reales.
export const CANAL = { CLOVER: 'clover', MP_DIRECTO: 'mp_directo' }

export function resolverCanal(ventaRow) {
  if (ventaRow.terminal === 1 && ventaRow.tarjeta === 'MPAGO') {
    return CANAL.MP_DIRECTO
  }
  return CANAL.CLOVER
}

export function separarVentasPorCanal(ventaRows) {
  const clover = []
  const mpDirecto = []
  for (const v of ventaRows) {
    if (resolverCanal(v) === CANAL.MP_DIRECTO) mpDirecto.push(v)
    else clover.push(v)
  }
  return { clover, mpDirecto }
}
