// Matching del canal Clover contra las filas del CSV de Clover.
// Para QR, la Autorización de Clover no es confiable (se repite entre
// billeteras distintas): se prioriza Cupón + Lote + Importe.
import { esOperacionQr, normalizarNombreTarjetaClover } from '../normalizers/cardMapping.js'
import { normalizarNumeroTexto } from '../normalizers/numericStringNormalizer.js'

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
  //    (Autorización se compara sin ceros a la izquierda, ver numericStringNormalizer.js)
  if (!match) {
    match = candidatos.find(
      (c) =>
        c.terminal === evento.terminal &&
        normalizarNumeroTexto(c.codigoAutorizacion) === normalizarNumeroTexto(evento.autorizacion) &&
        c.cupon === evento.cupon
    )
  }

  // 3) fallback: aflojar TERMINAL (puede estar mal cargado) — busca por
  //    cupón + importe exactos. Solo se acepta si es único candidato, para
  //    no adivinar entre varias operaciones con el mismo cupón e importe.
  if (!match) {
    const porCuponEImporte = candidatos.filter(
      (c) => c.cupon === evento.cupon && c.importe + c.importeExtraCash === evento.importeTotal
    )
    if (porCuponEImporte.length === 1) match = porCuponEImporte[0]
  }

  // 4) fallback: aflojar CUPÓN (puede estar mal cargado) — busca por
  //    terminal + importe exactos. Mismo criterio de unicidad.
  if (!match) {
    const porTerminalEImporte = candidatos.filter(
      (c) => c.terminal === evento.terminal && c.importe + c.importeExtraCash === evento.importeTotal
    )
    if (porTerminalEImporte.length === 1) match = porTerminalEImporte[0]
  }

  if (!match) {
    return { estado: null, motivo: null, cobro: null, correccion: null, diferenciaImporte: null }
  }

  match._consumido = true
  const esQr = esOperacionQr(match.medioDePago)
  const nombreEsperado = normalizarNombreTarjetaClover(mapeo, match.marcaTarjeta, esQr)
  const importeCobro = match.importe + match.importeExtraCash
  const diferenciaImporte = redondear(importeCobro - evento.importeTotal)

  if (nombreEsperado === null) {
    // no hay equivalencia configurada para esta marca de Clover: no se puede
    // validar el nombre de tarjeta, se manda a Revisar en vez de asumir nada
    return {
      estado: 'Revisar',
      motivo: `Marca "${match.marcaTarjeta}" sin equivalencia`,
      correccion: 'Emparejar marca en Configuración',
      diferenciaImporte,
      cobro: match,
    }
  }

  // cada problema se registra con su mensaje (para el Motivo) y su corrección
  // concreta y accionable (para la columna de Corrección sugerida)
  const problemas = []

  if (match.terminal !== evento.terminal) {
    problemas.push({ mensaje: 'Terminal no coincide', correccion: `Terminal: ${evento.terminal}→${match.terminal}` })
  }
  if (!esQr && normalizarNumeroTexto(match.codigoAutorizacion) !== normalizarNumeroTexto(evento.autorizacion)) {
    problemas.push({ mensaje: 'Autorización no coincide', correccion: `Autorización: ${evento.autorizacion}→${match.codigoAutorizacion}` })
  }
  if (match.cupon !== evento.cupon) {
    problemas.push({ mensaje: 'Cupón no coincide', correccion: `Cupón: ${evento.cupon}→${match.cupon}` })
  }
  if (nombreEsperado !== evento.tarjeta) {
    problemas.push({ mensaje: 'Tarjeta no coincide', correccion: `Tarjeta: ${evento.tarjeta}→${nombreEsperado}` })
  }
  if (diferenciaImporte !== 0) {
    problemas.push({ mensaje: `Diferencia importe $${diferenciaImporte}`, correccion: `Importe: $${evento.importeTotal}→$${importeCobro}` })
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
