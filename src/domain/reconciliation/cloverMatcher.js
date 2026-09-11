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
      motivo: `La marca de Clover "${match.marcaTarjeta}" no tiene equivalencia configurada. Se conciliaron el resto de los datos, falta validar el nombre.`,
      correccion: 'Ir al paso de emparejamiento (al subir los archivos) o a "Equivalencias guardadas" y asignarle un código de Ventas a esta marca.',
      diferenciaImporte,
      cobro: match,
    }
  }

  // cada problema se registra con su mensaje (para el Motivo) y su corrección
  // concreta y accionable (para la columna de Corrección sugerida)
  const problemas = []

  if (match.terminal !== evento.terminal) {
    problemas.push({
      mensaje: 'Terminal no coincide con Clover',
      correccion: `Corregir Terminal: cargado ${evento.terminal}, según Clover debería ser ${match.terminal}`,
    })
  }
  if (!esQr && match.codigoAutorizacion !== evento.autorizacion) {
    problemas.push({
      mensaje: 'Autorización no coincide con Clover',
      correccion: `Corregir Autorización: cargada "${evento.autorizacion}", según Clover debería ser "${match.codigoAutorizacion}"`,
    })
  }
  if (match.cupon !== evento.cupon) {
    problemas.push({
      mensaje: 'Cupón no coincide con Clover',
      correccion: `Corregir Cupón: cargado ${evento.cupon}, según Clover debería ser ${match.cupon}`,
    })
  }
  if (nombreEsperado !== evento.tarjeta) {
    problemas.push({
      mensaje: `Nombre de tarjeta cargado ("${evento.tarjeta}") no coincide con la marca real ("${match.marcaTarjeta}" → configurado como "${nombreEsperado}")`,
      correccion: `Corregir Tarjeta: cargada "${evento.tarjeta}", debería ser "${nombreEsperado}"`,
    })
  }
  if (diferenciaImporte !== 0) {
    problemas.push({
      mensaje: `Diferencia de importe: Ventas $${evento.importeTotal} vs Clover $${importeCobro}`,
      correccion: `Corregir Importe: cargado $${evento.importeTotal}, el cobro real en Clover es $${importeCobro} (diferencia $${diferenciaImporte})`,
    })
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
