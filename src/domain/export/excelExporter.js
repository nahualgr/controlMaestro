// Genera el Excel final con tres hojas:
//  - "Resumen": columnas originales de Ventas + Estado + Motivo +
//    Diferencia de Importe + Corrección sugerida.
//  - "Clover": TODAS las operaciones de Clover con su estado de
//    conciliación (Conciliada / Ignorada por FAIL / Sin venta correspondiente).
//  - "Mercado Pago": TODAS las operaciones de Mercado Pago, mismo criterio.
import * as XLSX from 'xlsx'
import { describirSugerenciaParaVenta, describirSugerenciaParaCobro } from '../reconciliation/orphanCrossMatcher.js'

const ESTADO_LABEL = {
  OK: '🟢 OK',
  Revisar: '🟡 Revisar',
  Error: '🔴 Error',
  Cancelado: '⚪ Cancelado',
}

export function exportarResultado({ resultados, cloverRows, mpRows, sugerenciasPorVenta, sugerenciasPorCobro }) {
  const filasResumen = []
  for (const r of resultados) {
    for (const fila of r.filas) {
      filasResumen.push({
        ...fila._original,
        Estado: ESTADO_LABEL[r.estado] ?? r.estado,
        Motivo: r.motivo ?? '',
        'Diferencia de Importe': r.diferenciaImporte ?? '',
        'Corrección sugerida': r.correccion ?? '',
        'Posible coincidencia': r.sinCobro ? describirSugerenciaParaVenta(sugerenciasPorVenta.get(r.id)) : '',
      })
    }
  }

  const filasClover = cloverRows.map((c) => {
    const base = {
      Fecha: c.fecha ? c.fecha.toLocaleString('es-AR') : '',
      'Medio de pago': c.medioDePago,
      Marca: c.marcaTarjeta,
      Terminal: c.terminal,
      Autorización: c.codigoAutorizacion,
      Cupón: c.cupon,
      Importe: c.importe,
      'Extra Cash': c.importeExtraCash || '',
      Resultado: c.resultado,
    }
    if (c.resultado !== 'SUCCESS') {
      return { ...base, Estado: '⚪ Ignorada (FAIL)', Motivo: '', 'Venta asociada': '', 'Posible coincidencia': '' }
    }
    if (c._resultadoVenta) {
      return {
        ...base,
        Estado: ESTADO_LABEL[c._resultadoVenta.estado] ?? c._resultadoVenta.estado,
        Motivo: c._resultadoVenta.motivo,
        'Venta asociada': c._resultadoVenta.comprobante,
        'Posible coincidencia': '',
      }
    }
    return {
      ...base,
      Estado: '🔴 Sin venta correspondiente',
      Motivo: '',
      'Venta asociada': '',
      'Posible coincidencia': describirSugerenciaParaCobro(sugerenciasPorCobro.get(c)),
    }
  })

  const filasMp = mpRows.map((m) => {
    const base = {
      Fecha: m.fecha ? m.fecha.toLocaleString('es-AR') : '',
      'Operación (operation_id)': m.operationId,
      Importe: m.importe,
      'Estado MP': m.estado,
    }
    if (m.estado !== 'approved') {
      return { ...base, Estado: '⚪ Ignorada (no aprobada)', Motivo: '', 'Venta asociada': '', 'Posible coincidencia': '' }
    }
    if (m._resultadoVenta) {
      return {
        ...base,
        Estado: ESTADO_LABEL[m._resultadoVenta.estado] ?? m._resultadoVenta.estado,
        Motivo: m._resultadoVenta.motivo,
        'Venta asociada': m._resultadoVenta.comprobante,
        'Posible coincidencia': '',
      }
    }
    return {
      ...base,
      Estado: '🔴 Sin venta correspondiente',
      Motivo: '',
      'Venta asociada': '',
      'Posible coincidencia': describirSugerenciaParaCobro(sugerenciasPorCobro.get(m)),
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasResumen), 'Resumen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasClover), 'Clover')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasMp), 'Mercado Pago')

  const fechaHoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `conciliacion_${fechaHoy}.xlsx`)
}
