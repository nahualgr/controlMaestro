// Matching del canal Clover contra las filas del CSV de Clover.
// Para QR, la Autorización de Clover no es confiable (se repite entre
// billeteras distintas): se prioriza Cupón + Lote + Importe.
import { esOperacionQr, normalizarNombreTarjetaClover } from '../normalizers/cardMapping.js'

export function matchearEventoClover(evento, cloverRows) {
  // solo se concilia contra operaciones exitosas (las FAIL se ignoran, decisión funcional)
  const candidatos = cloverRows.filter((c) => c.resultado === 'SUCCESS' && !c._consumido)

  const esQr = candidatos.some((c) => esOperacionQr(c.medioDePago)) // heurística inicial, se refina por fila

  // 1) intento por clave fuerte: terminal + cupón + importe (funciona para tarjeta y QR)
  let match = candidatos.find(
    (c) =>
      c.terminal === evento.terminal &&
      c.cupon === evento.cupon &&
      c.importe + c.importeExtraCash === evento.importeTotal
  )

  // 2) fallback para tarjeta: terminal + autorización + cupón exactos
  if (!match) {
    match = candidatos.find(
      (c) =>
        c.terminal === evento.terminal &&
        c.codigoAutorizacion === evento.autorizacion &&
        c.cupon === evento.cupon
    )
  }

  if (!match) {
    return { estado: null, motivo: null, cobro: null }
  }

  match._consumido = true
  const nombreEsperado = normalizarNombreTarjetaClover(match.marcaTarjeta, esOperacionQr(match.medioDePago))

  const problemas = []
  if (match.terminal !== evento.terminal) problemas.push('Terminal no coincide con Clover')
  if (!esOperacionQr(match.medioDePago) && match.codigoAutorizacion !== evento.autorizacion) {
    problemas.push('Autorización no coincide con Clover')
  }
  if (match.cupon !== evento.cupon) problemas.push('Cupón no coincide con Clover')
  if (nombreEsperado !== evento.tarjeta) {
    problemas.push(`Nombre de tarjeta cargado ("${evento.tarjeta}") no coincide con la marca real ("${nombreEsperado}")`)
  }
  if (match.importe + match.importeExtraCash !== evento.importeTotal) {
    problemas.push(`Diferencia de importe: Ventas $${evento.importeTotal} vs Clover $${match.importe + match.importeExtraCash}`)
  }

  if (problemas.length === 0) {
    return { estado: 'OK', motivo: 'Conciliación correcta', cobro: match }
  }
  return { estado: 'Error', motivo: problemas.join(' · '), cobro: match }
}
