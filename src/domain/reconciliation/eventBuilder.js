// Reconstruye "eventos de cobro" reales a partir de filas sueltas de Ventas.
// Nunca se asume que una fila = una operación completa (especificación §9).
import { CANAL } from '../normalizers/channelResolver.js'

/**
 * @typedef {Object} VentaEvento
 * @property {string} id
 * @property {'clover'|'mp_directo'} canal
 * @property {'Normal'|'Anulado'|'Dividido'} tipoOperacion
 * @property {VentaRow[]} filas          - filas de Ventas que componen el evento
 * @property {number} importeTotal       - suma de importes (incluye Extra Cash si aplica)
 * @property {number} importeExtraCash
 * @property {string} terminal
 * @property {string} autorizacion
 * @property {string} cupon
 * @property {string} tarjeta
 */

export function construirEventos(ventaRows, canal) {
  // 1) las filas Anuladas se excluyen del control (nunca generan error) pero
  //    se devuelven aparte para que la clasificación las marque "Cancelado"
  const anuladas = ventaRows.filter((v) => v.tipoOperacion === 'Anulado')
  const activas = ventaRows.filter((v) => v.tipoOperacion !== 'Anulado')

  // 2) agrupar por clave terminal+autorización+cupón: cubre operación simple,
  //    operación múltiple (varios tickets del mismo cobro) y el par
  //    Venta+ExtraCash (misma clave, filas separadas en Ventas)
  const grupos = new Map()
  for (const v of activas) {
    const clave = `${v.terminal}|${v.autorizacion}|${v.cupon}`
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(v)
  }

  const eventos = []
  let contador = 0
  for (const [, filas] of grupos) {
    contador += 1
    const tipoOperacion = filas.some((f) => f.tipoOperacion === 'Dividido') ? 'Dividido' : 'Normal'
    const importeTotal = filas.reduce((acc, f) => acc + f.importe, 0)
    const primera = filas[0]
    eventos.push({
      id: `${canal}-${contador}`,
      canal,
      tipoOperacion,
      filas,
      importeTotal,
      importeExtraCash: 0, // el Extra Cash de Ventas ya queda sumado en importeTotal por compartir clave
      terminal: primera.terminal,
      autorizacion: primera.autorizacion,
      cupon: primera.cupon,
      tarjeta: primera.tarjeta,
    })
  }

  const eventosAnulados = anuladas.map((v, i) => ({
    id: `${canal}-anulado-${i}`,
    canal,
    tipoOperacion: 'Anulado',
    filas: [v],
    importeTotal: v.importe,
    importeExtraCash: 0,
    terminal: v.terminal,
    autorizacion: v.autorizacion,
    cupon: v.cupon,
    tarjeta: v.tarjeta,
  }))

  return [...eventos, ...eventosAnulados]
}

export function construirTodosLosEventos({ clover, mpDirecto }) {
  return [
    ...construirEventos(clover, CANAL.CLOVER),
    ...construirEventos(mpDirecto, CANAL.MP_DIRECTO),
  ]
}
