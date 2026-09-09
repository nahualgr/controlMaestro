// Parsea el CSV de Clover. Maneja el caso especial de QR PosNet, donde
// "ID del terminal" viene vacío y el terminal solo está en el texto libre
// del campo "Dispositivo" (ej. "Terminal 69322490").
import Papa from 'papaparse'

/**
 * @typedef {Object} CloverRow
 * @property {number} filaIndice
 * @property {string} medioDePago      - ej. "Tarjeta de débito" | "QR PosNet"
 * @property {string} marcaTarjeta     - ej. "VISA DEBITO" | "MERCADO PAGO Transferencia"
 * @property {string} billetera        - solo para QR: valor parseado desde "Nota" (Billetera)
 * @property {number} importe
 * @property {number} importeExtraCash - "Importe de retiro en efectivo", 0 si no aplica
 * @property {string} codigoAutorizacion
 * @property {string} terminal         - últimos 3 dígitos, como string
 * @property {string} lote
 * @property {string} cupon            - "Núm. de recibo"
 * @property {string} resultado        - "SUCCESS" | "FAIL"
 * @property {Date|null} fecha
 */

export function parseCloverCsv(csvText) {
  const parsed = Papa.parse(csvText, { header: true, delimiter: ';', skipEmptyLines: true })
  return parsed.data.map((r, idx) => normalizeCloverRow(r, idx))
}

function normalizeCloverRow(r, idx) {
  const medioDePago = (r['Medio de pago'] ?? '').trim()
  const esQr = medioDePago.toLowerCase().includes('qr')

  const nota = r['Nota'] ?? ''
  const notaParsed = parseNota(nota)

  const terminal = esQr
    ? extraerTerminalDeDispositivo(r['Dispositivo'])
    : last3(r['ID del terminal'])

  return {
    filaIndice: idx,
    medioDePago,
    marcaTarjeta: (r['Marca de la tarjeta'] ?? '').trim(),
    billetera: notaParsed.billetera ?? null,
    importe: Number(r['Importe'] ?? 0),
    importeExtraCash: Number(r['Importe de retiro en efectivo'] ?? 0) || 0,
    codigoAutorizacion: (r['Código de autorización de la tarjeta'] ?? '').toString().trim(),
    terminal: terminal === null ? null : Number(terminal),
    lote: (notaParsed.lote ?? r['Núm. de lote'] ?? '').toString().trim(),
    cupon: numOrNull(notaParsed.cupon ?? r['Núm. de recibo']),
    resultado: (r['Resultado'] ?? '').trim(),
    fecha: parseFechaClover(r['Fecha del pago']),
    _original: r,
  }
}

function numOrNull(v) {
  const s = (v ?? '').toString().trim()
  if (s === '') return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

function last3(idTerminal) {
  const s = (idTerminal ?? '').toString().trim()
  if (!s) return null
  return s.slice(-3)
}

// El "Dispositivo" trae un texto libre del tipo "Terminal 69322490".
function extraerTerminalDeDispositivo(dispositivo) {
  const s = (dispositivo ?? '').toString()
  const match = s.match(/Terminal\s+(\d+)/i)
  if (!match) return null
  return match[1].slice(-3)
}

// El campo Nota trae, para QR: "ID QR: ..., ID Autorización: ..., Lote: ...,
// Cupón: ..., Billetera: ..., Medio: ...". Se parsea de forma tolerante.
function parseNota(nota) {
  const result = {}
  const texto = (nota ?? '').toString()
  const campos = { lote: /Lote:\s*([^,]+)/i, cupon: /Cupón:\s*([^,]+)/i, billetera: /Billetera:\s*([^,]+)/i, idAutorizacion: /ID Autorización:\s*([^,]+)/i }
  for (const [key, regex] of Object.entries(campos)) {
    const m = texto.match(regex)
    if (m) result[key] = m[1].trim()
  }
  return result
}

function parseFechaClover(fechaStr) {
  // formato observado: "06-Sep-2026 11:54 PM ART"
  if (!fechaStr) return null
  const limpio = fechaStr.toString().replace(/\s*ART\s*$/i, '').trim()
  const d = new Date(limpio)
  return isNaN(d.getTime()) ? null : d
}
