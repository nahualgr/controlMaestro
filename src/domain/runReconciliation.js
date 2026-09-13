// Orquesta el pipeline completo: enriquecer terminal -> separar canal ->
// reconstruir eventos -> clasificar -> etiquetar cobros -> sugerir cruces.
import { separarVentasPorCanal } from './normalizers/channelResolver.js'
import { construirTodosLosEventos } from './reconciliation/eventBuilder.js'
import { clasificarTodos } from './reconciliation/classifier.js'
import { enriquecerTerminalesClover } from './config/terminalEnricher.js'
import { encontrarCobrosSinVentaCrudos, sugerirCoincidenciasPorImporte } from './reconciliation/orphanCrossMatcher.js'

export function ejecutarConciliacion({ ventaRows, cloverRows: cloverRowsCrudo, mpRows, mapeo, mapeoTerminales }) {
  const cloverRows = enriquecerTerminalesClover(cloverRowsCrudo, mapeoTerminales)
  const { clover, mpDirecto } = separarVentasPorCanal(ventaRows)
  const eventos = construirTodosLosEventos({ clover, mpDirecto })
  const resultados = clasificarTodos(eventos, { cloverRows, mpRows, mapeo })

  // se etiqueta cada cobro consumido con el resultado de la venta que lo
  // reclamó, para poder mostrar el estado de conciliación fila por fila en
  // los reportes de Clover y Mercado Pago.
  for (const r of resultados) {
    const cobros = r.cobrosDivididos ?? (r.cobro ? [r.cobro] : [])
    for (const cobro of cobros) {
      cobro._resultadoVenta = {
        estado: r.estado,
        motivo: r.motivo,
        correccion: r.correccion,
        comprobante: r.filas.map((f) => f.comprobante).join(', '),
      }
    }
  }

  const ventasSinCobro = resultados.filter((r) => r.sinCobro)
  const cobrosSinVentaCrudos = encontrarCobrosSinVentaCrudos(cloverRows, mpRows)
  const { sugerenciasPorVenta, sugerenciasPorCobro } = sugerirCoincidenciasPorImporte(ventasSinCobro, cobrosSinVentaCrudos)

  const resumen = {
    total: resultados.length,
    ok: resultados.filter((r) => r.estado === 'OK').length,
    revisar: resultados.filter((r) => r.estado === 'Revisar').length,
    error: resultados.filter((r) => r.estado === 'Error').length,
    cancelado: resultados.filter((r) => r.estado === 'Cancelado').length,
    cobrosSinVenta: cobrosSinVentaCrudos.length,
    ventasSinCobro: ventasSinCobro.length,
  }

  return { resultados, cloverRows, mpRows, ventasSinCobro, sugerenciasPorVenta, sugerenciasPorCobro, resumen }
}
