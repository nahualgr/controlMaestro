// Orquesta el pipeline completo: enriquecer terminal -> separar canal ->
// reconstruir eventos -> clasificar -> detectar huérfanos.
import { separarVentasPorCanal } from './normalizers/channelResolver.js'
import { construirTodosLosEventos } from './reconciliation/eventBuilder.js'
import { clasificarTodos } from './reconciliation/classifier.js'
import { encontrarCobrosSinVenta } from './reconciliation/orphanFinder.js'
import { enriquecerTerminalesClover } from './config/terminalEnricher.js'

export function ejecutarConciliacion({ ventaRows, cloverRows: cloverRowsCrudo, mpRows, mapeo, mapeoTerminales }) {
  const cloverRows = enriquecerTerminalesClover(cloverRowsCrudo, mapeoTerminales)
  const { clover, mpDirecto } = separarVentasPorCanal(ventaRows)
  const eventos = construirTodosLosEventos({ clover, mpDirecto })
  const resultados = clasificarTodos(eventos, { cloverRows, mpRows, mapeo })
  const cobrosSinVenta = encontrarCobrosSinVenta({ cloverRows, mpRows })
  const ventasSinCobro = resultados.filter((r) => r.sinCobro)

  const resumen = {
    total: resultados.length,
    ok: resultados.filter((r) => r.estado === 'OK').length,
    revisar: resultados.filter((r) => r.estado === 'Revisar').length,
    error: resultados.filter((r) => r.estado === 'Error').length,
    cancelado: resultados.filter((r) => r.estado === 'Cancelado').length,
    cobrosSinVenta: cobrosSinVenta.length,
    ventasSinCobro: ventasSinCobro.length,
  }

  return { resultados, cobrosSinVenta, ventasSinCobro, resumen }
}
