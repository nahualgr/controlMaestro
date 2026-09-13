// Parsea el Excel de Mercado Pago (4 columnas, formato de export directo de MP).
import * as XLSX from 'xlsx'

/**
 * @typedef {Object} MpRow
 * @property {number} filaIndice
 * @property {Date|null} fecha
 * @property {string} operationId
 * @property {number} importe
 * @property {string} estado - normalmente "approved"
 */

const COL_FECHA = 'Fecha de compra (date_created)'
const COL_OPERATION_ID = 'Número de operación de Mercado Pago (operation_id)'
const COL_IMPORTE = 'Valor del producto (transaction_amount)'
const COL_ESTADO = 'Estado de la operación (status)'

export function parseMpWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const firstSheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  return rows
    // se descarta la fila de total y cualquier fila sin fecha de compra (ej. totales)
    .filter((r) => r[COL_FECHA] !== null && r[COL_FECHA] !== undefined)
    .map((r, idx) => ({
      filaIndice: idx,
      fecha: r[COL_FECHA] instanceof Date ? r[COL_FECHA] : new Date(r[COL_FECHA]),
      operationId: (r[COL_OPERATION_ID] ?? '').toString().trim(),
      importe: Number(r[COL_IMPORTE] ?? 0),
      estado: (r[COL_ESTADO] ?? '').toString().trim().toLowerCase(),
      _original: r,
    }))
  // Nota: ya no se descartan acá las no-aprobadas — se necesitan todas para
  // el reporte completo de Mercado Pago. El matching sigue usando solo
  // "approved" (ver mpMatcher.js).
}
