// Equivalencias de nombre de tarjeta entre Clover y Ventas (especificación §4).
// Todo lo que Clover reporta como QR (cualquier billetera) se normaliza a
// "QR" en Ventas, ya que el vendedor nunca carga la billetera específica.
const MAPEO_TARJETAS = {
  'VISA DEBITO': 'Visa Débito',
  'VISA CREDITO': 'Visa Crédito',
  'MC DEBIT': 'Mastercard Débito',
  'MASTERCARD DEBITO': 'Mastercard Débito',
  'MC PREPAGA': 'Mastercard Débito',
  'MASTERCARD PREPAGA': 'Mastercard Débito',
  'MC CREDIT': 'Mastercard Crédito',
  'MASTERCARD CREDITO': 'Mastercard Crédito',
}

export function normalizarNombreTarjetaClover(marcaTarjetaClover, esQr) {
  if (esQr) return 'QR'
  const clave = (marcaTarjetaClover ?? '').toUpperCase().trim()
  return MAPEO_TARJETAS[clave] ?? marcaTarjetaClover
}

export function esOperacionQr(medioDePagoClover) {
  return (medioDePagoClover ?? '').toLowerCase().includes('qr')
}
