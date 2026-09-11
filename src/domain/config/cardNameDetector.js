// Detecta, a partir de los archivos reales subidos, qué nombres de tarjeta
// aparecen de cada lado, para que el usuario los empareje antes de conciliar
// (en vez de tipear equivalencias a ciegas).
import { esOperacionQr } from '../normalizers/cardMapping.js'

// Marcas de Clover a emparejar (se excluye QR: esa equivalencia es fija).
export function detectarMarcasClover(cloverRows) {
  const set = new Set()
  for (const c of cloverRows) {
    if (esOperacionQr(c.medioDePago)) continue
    const marca = (c.marcaTarjeta ?? '').trim()
    if (marca) set.add(marca)
  }
  return [...set].sort()
}

// Códigos de tarjeta en Ventas a emparejar (se excluye MPAGO: es el canal
// Mercado Pago directo, no tiene equivalencia con Clover).
export function detectarCodigosVentas(ventaRows) {
  const set = new Set()
  for (const v of ventaRows) {
    if (v.tarjeta === 'MPAGO') continue
    const codigo = (v.tarjeta ?? '').trim()
    if (codigo) set.add(codigo)
  }
  return [...set].sort()
}

// Devuelve las marcas de Clover que todavía no tienen equivalencia en el
// mapeo guardado.
export function detectarPendientes(marcasClover, mapeoGuardado) {
  return marcasClover.filter((m) => !(m.toUpperCase() in mapeoGuardado))
}
