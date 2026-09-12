// Genera el Excel final con tres hojas:
//  - "Resumen": columnas originales de Ventas + Estado + Motivo +
//    Diferencia de Importe + Corrección sugerida.
//  - "Ventas sin cobro": ventas que no encontraron ningún cobro asociado.
//  - "Cobros sin venta": cobros de Clover/MP que no fueron asignados a
//    ninguna venta.
import * as XLSX from 'xlsx'
import { describirSugerenciaParaVenta, describirSugerenciaParaCobro } from '../reconciliation/orphanCrossMatcher.js'

const ESTADO_LABEL = {
  OK: '🟢 OK',
  Revisar: '🟡 Revisar',
  Error: '🔴 Error',
  Cancelado: '⚪ Cancelado',
}

export function exportarResultado({ resultados, cobrosSinVenta, ventasSinCobro, sugerenciasPorVenta, sugerenciasPorCobro }) {
  const filasResumen = []
  for (const r of resultados) {
    for (const fila of r.filas) {
      filasResumen.push({
        ...fila._original,
        Estado: ESTADO_LABEL[r.estado] ?? r.estado,
        Motivo: r.motivo ?? '',
        'Diferencia de Importe': r.diferenciaImporte ?? '',
        'Corrección sugerida': r.correccion ?? '',
      })
    }
  }

  const filasVentasSinCobro = ventasSinCobro.flatMap((r) =>
    r.filas.map((fila) => ({
      Canal: r.canal === 'clover' ? 'Clover' : 'Mercado Pago directo',
      Terminal: r.terminal,
      Autorización: r.autorizacion,
      Cupón: r.cupon,
      Tarjeta: r.tarjeta,
      Importe: r.importeTotal,
      Comprobante: fila.comprobante,
      Fecha: fila.fecha ? fila.fecha.toLocaleDateString('es-AR') : '',
      'Posible coincidencia': describirSugerenciaParaVenta(sugerenciasPorVenta.get(r.id)),
    }))
  )

  const filasCobrosSinVenta = cobrosSinVenta.map((h) => ({
    Canal: h.canal,
    Terminal: h.terminal,
    Autorización: h.autorizacion,
    Cupón: h.cupon,
    Tarjeta: h.tarjeta,
    Importe: h.importe,
    Fecha: h.fecha ? h.fecha.toLocaleString('es-AR') : '',
    'Posible coincidencia': describirSugerenciaParaCobro(sugerenciasPorCobro.get(h)),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasResumen), 'Resumen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasVentasSinCobro), 'Ventas sin cobro')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasCobrosSinVenta), 'Cobros sin venta')

  const fechaHoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `conciliacion_${fechaHoy}.xlsx`)
}
