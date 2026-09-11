// Detecta, a partir de los archivos reales subidos, qué terminales de
// dispositivo aparecen en Clover y qué números de terminal aparecen en
// Ventas, para que el usuario los empareje antes de conciliar.
export function detectarTerminalesClover(cloverRows) {
  const set = new Set()
  for (const c of cloverRows) {
    if (c.terminalDispositivo) set.add(c.terminalDispositivo)
  }
  return [...set].sort()
}

// Se excluye Terminal=1: es el marcador del canal Mercado Pago directo, no
// corresponde a ningún dispositivo físico de Clover.
export function detectarTerminalesVentas(ventaRows) {
  const set = new Set()
  for (const v of ventaRows) {
    if (v.terminal === null || v.terminal === undefined) continue
    if (v.terminal === 1) continue
    set.add(String(v.terminal))
  }
  return [...set].sort()
}

export function detectarTerminalesPendientes(terminalesClover, mapeoGuardado) {
  return terminalesClover.filter((t) => !(t in mapeoGuardado))
}
