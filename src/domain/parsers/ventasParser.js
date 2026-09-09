// Parsea la hoja "Resumen" del Excel de Ventas a un modelo interno uniforme.
// No se tocan las hojas "Resumen Agrupado" ni "Resumen por Cupón": se descartan
// por decisión funcional (ver especificación §12).
import * as XLSX from 'xlsx'

/**
 * @typedef {Object} VentaRow
 * @property {number} filaIndice   - índice de fila original (para trazabilidad)
 * @property {string} tipoOperacion - "Normal" | "Anulado" | "Dividido" | "Total"
 * @property {number|null} terminal
 * @property {string} tarjeta
 * @property {number} cuotas
 * @property {string} presentacion  - "0" | "Sin número" | número de lote (texto tal cual)
 * @property {Date|null} fecha
 * @property {string} hora
 * @property {number} importe
 * @property {string} autorizacion  - se preserva como string para no perder ceros/longitud
 * @property {number|null} cupon
 * @property {string} comprobante
 * @property {string} numeroVendedor
 */

export function parseVentasWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets['Resumen']
  if (!sheet) {
    throw new Error('No se encontró la hoja "Resumen" en el archivo de Ventas.')
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  return rows
    // la fila "Total" es un renglón de suma, se descarta del procesamiento
    .filter((r) => r['Tipo de Operación'] !== 'Total')
    .map((r, idx) => normalizeVentaRow(r, idx))
}

function normalizeVentaRow(r, idx) {
  return {
    filaIndice: idx,
    tipoOperacion: r['Tipo de Operación'] ?? 'Normal',
    terminal: r['Terminal'] === null || r['Terminal'] === undefined ? null : Number(r['Terminal']),
    tarjeta: (r['Tarjeta'] ?? '').toString().trim(),
    cuotas: Number(r['Cuotas'] ?? 0),
    presentacion: r['Presentación'] === null || r['Presentación'] === undefined
      ? null
      : r['Presentación'].toString().trim(),
    fecha: r['Fecha'] instanceof Date ? r['Fecha'] : r['Fecha'] ? new Date(r['Fecha']) : null,
    hora: (r['Hora'] ?? '').toString().trim(),
    importe: Number(r['Importe'] ?? 0),
    autorizacion: (r['Autorización'] ?? '').toString().trim(),
    cupon: r['Cupón'] === null || r['Cupón'] === undefined ? null : Number(r['Cupón']),
    comprobante: (r['Comprobante'] ?? '').toString().trim(),
    numeroVendedor: (r['Número de Vendedor'] ?? '').toString().trim(),
    // se preservan los datos originales de la fila para reconstruir el Excel de salida sin perder columnas
    _original: r,
  }
}
