// Parsea el CSV de Clover. El terminal SIEMPRE se toma del campo
// "Dispositivo" (texto libre tipo "Terminal 69322490"), tanto para tarjeta
// como para QR — se dejó de usar "ID del terminal" (que además viene vacío
// para QR) para tener una única fuente confiable en ambos casos.
// El terminal real de Ventas para cada "terminalDispositivo" lo define el
// usuario a mano (ver terminalMappingStore.js / terminalDetector.js): acá
// solo se deja el identificador crudo del dispositivo.
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
 * @property {string} terminalDispositivo - identificador crudo extraído de "Dispositivo"
 * @property {number|null} terminal    - terminal ya traducido a Ventas (se completa después, vía mapeo)
 * @property {string} lote
 * @property {number|null} cupon       - "Núm. de recibo"
 * @property {string} resultado        - "SUCCESS" | "FAIL"
 * @property {Date|null} fecha
 */

export function parseCloverCsv(csvText) {
  const parsed = Papa.parse(csvText, { header: true, delimiter: ';', skipEmptyLines: true })
  return parsed.data.map((r, idx) => normalizeCloverRow(r, idx))
}

function normalizeCloverRow(r, idx) {
  const medioDePago = (r['Medio de pago'] ?? '').trim()
  const nota = r['Nota'] ?? ''
  const notaParsed = parseNota(nota)

  return {
    filaIndice: idx,
    medioDePago,
    marcaTarjeta: (r['Marca de la tarjeta'] ?? '').trim(),
    billetera: notaParsed.billetera ?? null,
    importe: Number(r['Importe'] ?? 0),
    importeExtraCash: Number(r['Importe de retiro en efectivo'] ?? 0) || 0,
    codigoAutorizacion: (r['Código de autorización de la tarjeta'] ?? '').toString().trim(),
    terminalDispositivo: extraerTerminalDeDispositivo(r['Dispositivo']),
    terminal: null, // se completa en el paso de emparejamiento (terminalEnricher.js)
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

// El "Dispositivo" trae un texto libre del tipo "Terminal 69322490" o
// "Terminal C045LQ32740640" (el identificador puede ser numérico o
// alfanumérico según el modelo de terminal).
function extraerTerminalDeDispositivo(dispositivo) {
  const s = (dispositivo ?? '').toString()
  const match = s.match(/Terminal\s+([A-Za-z0-9]+)/i)
  return match ? match[1] : null
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
