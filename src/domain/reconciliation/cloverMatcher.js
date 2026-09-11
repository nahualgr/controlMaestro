// Matching del canal Clover contra las filas del CSV de Clover.
// Para QR, la Autorización de Clover no es confiable (se repite entre
// billeteras distintas): se prioriza Cupón + Lote + Importe.
import { esOperacionQr, normalizarNombreTarjetaClover } from '../normalizers/cardMapping.js'

// `mapeo` es la configuración manual Clover -> Ventas armada por el usuario
// (ver src/domain/config/cardMappingStore.js). Sin mapeo cargado, cualquier
// nombre de tarjeta se trata como "no reconocido" y se manda a Revisar.
export function matchearEventoClover(evento, cloverRows, mapeo) {
  // solo se concilia contra operaciones exitosas (las FAIL se ignoran, decisión funcional)
  const candidatos = cloverRows.filter((c) => c.resultado === 'SUCCESS' && !c._consumido)

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
  const esQr = esOperacionQr(match.medioDePago)
  const nombreEsperado = normalizarNombreTarjetaClover(mapeo, match.marcaTarjeta, esQr)

  const problemas = []
  if (match.terminal !== evento.terminal) problemas.push('Terminal no coincide con Clover')
  if (!esQr && match.codigoAutorizacion !== evento.autorizacion) {
    problemas.push('Autorización no coincide con Clover')
  }
  if (match.cupon !== evento.cupon) problemas.push('Cupón no coincide con Clover')

  if (nombreEsperado === null) {
    // no hay equivalencia configurada para esta marca de Clover: no se puede
    // validar el nombre de tarjeta, se manda a Revisar en vez de asumir nada
    return {
      estado: 'Revisar',
      motivo: `La marca de Clover "${match.marcaTarjeta}" no tiene equivalencia configurada. Se conciliaron el resto de los datos, falta validar el nombre (se resuelve en el paso de emparejamiento al subir los archivos, o en "Equivalencias guardadas").`,
      cobro: match,
    }
  }
  if (nombreEsperado !== evento.tarjeta) {
    problemas.push(`Nombre de tarjeta cargado ("${evento.tarjeta}") no coincide con la marca real ("${match.marcaTarjeta}" → configurado como "${nombreEsperado}")`)
  }
  if (match.importe + match.importeExtraCash !== evento.importeTotal) {
    problemas.push(`Diferencia de importe: Ventas $${evento.importeTotal} vs Clover $${match.importe + match.importeExtraCash}`)
  }

  if (problemas.length === 0) {
    return { estado: 'OK', motivo: 'Conciliación correcta', cobro: match }
  }
  return { estado: 'Error', motivo: problemas.join(' · '), cobro: match }
}
