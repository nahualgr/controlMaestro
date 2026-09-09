// Orquesta el pipeline completo: separar canal -> reconstruir eventos ->
// clasificar -> detectar huérfanos. Punto de entrada único del dominio.
import { separarVentasPorCanal } from './normalizers/channelResolver.js'
import { construirTodosLosEventos } from './reconciliation/eventBuilder.js'
import { clasificarTodos } from './reconciliation/classifier.js'
import { encontrarCobrosSinVenta } from './reconciliation/orphanFinder.js'

export function ejecutarConciliacion({ ventaRows, cloverRows, mpRows }) {
  const { clover, mpDirecto } = separarVentasPorCanal(ventaRows)
  const eventos = construirTodosLosEventos({ clover, mpDirecto })
  const resultados = clasificarTodos(eventos, { cloverRows, mpRows })
  const cobrosSinVenta = encontrarCobrosSinVenta({ cloverRows, mpRows })

  const resumen = {
    total: resultados.length,
    ok: resultados.filter((r) => r.estado === 'OK').length,
    revisar: resultados.filter((r) => r.estado === 'Revisar').length,
    error: resultados.filter((r) => r.estado === 'Error').length,
    cancelado: resultados.filter((r) => r.estado === 'Cancelado').length,
    cobrosSinVenta: cobrosSinVenta.length,
  }

  return { resultados, cobrosSinVenta, resumen }
}
