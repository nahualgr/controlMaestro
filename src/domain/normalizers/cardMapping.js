// Traduce el nombre de tarjeta de Clover al código usado en Ventas.
// El mapeo NO trae valores por defecto adivinados: se arma 100% a mano por
// el usuario desde el paso de emparejamiento al subir los archivos (ver
// cardMappingStore.js y cardNameDetector.js).
// La única regla fija (no configurable) es que toda operación QR PosNet de
// Clover, sea cual sea la billetera real (Mercado Pago, MODO, Naranja X,
// Ualá, etc.), se traduce siempre al código "QRPCT" en Ventas.
export function normalizarNombreTarjetaClover(mapeo, marcaTarjetaClover, esQr) {
  if (esQr) return 'QRPCT'
  const clave = (marcaTarjetaClover ?? '').toUpperCase().trim()
  // null = no hay equivalencia configurada; el llamador debe tratarlo como
  // un caso a revisar, nunca asumir un valor.
  return mapeo[clave] ?? null
}

export function esOperacionQr(medioDePago) {
  return (medioDePago ?? '').toLowerCase().includes('qr')
}
