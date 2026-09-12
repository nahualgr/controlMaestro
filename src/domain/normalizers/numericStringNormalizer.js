// El sistema de facturación (Ventas) recorta los ceros a la izquierda al
// cargar Autorización y Cupón (ej. "004123" queda guardado como "4123").
// Clover no hace ese recorte, así que hay que normalizar antes de comparar
// como texto — si no, "004123" (Clover) nunca sería igual a "4123" (Ventas)
// aunque sean el mismo número.
//
// Cupón ya se compara como Number en todo el sistema, así que ese caso ya
// queda cubierto naturalmente (Number("004123") === Number("4123")). Esta
// función es para los valores que se comparan como texto, como Autorización.
export function normalizarNumeroTexto(valor) {
  const s = (valor ?? '').toString().trim()
  if (s === '') return s
  // solo recorta ceros a la izquierda si el valor es puramente numérico;
  // si tiene letras u otros caracteres, se deja tal cual (no se asume que
  // sea un número).
  if (!/^\d+$/.test(s)) return s
  const sinCeros = s.replace(/^0+/, '')
  return sinCeros === '' ? '0' : sinCeros
}
