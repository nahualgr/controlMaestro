// Genera el Excel final: hoja "Resumen" (columnas originales de Ventas +
// Estado + Motivo) y hoja "Cobros sin venta".
import * as XLSX from 'xlsx'

const ESTADO_LABEL = {
  OK: '🟢 OK',
  Revisar: '🟡 Revisar',
  Error: '🔴 Error',
  Cancelado: '⚪ Cancelado',
}

export function exportarResultado({ resultados, cobrosSinVenta }) {
  const filasResumen = []
  for (const r of resultados) {
    for (const fila of r.filas) {
      filasResumen.push({
        ...fila._original,
        Estado: ESTADO_LABEL[r.estado] ?? r.estado,
        Motivo: r.motivo ?? '',
      })
    }
  }

  const filasHuerfanos = cobrosSinVenta.map((h) => ({
    Canal: h.canal,
    Terminal: h.terminal,
    Autorización: h.autorizacion,
    Cupón: h.cupon,
    Tarjeta: h.tarjeta,
    Importe: h.importe,
    Fecha: h.fecha ? h.fecha.toLocaleString('es-AR') : '',
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasResumen), 'Resumen')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasHuerfanos), 'Cobros sin venta')

  const fechaHoy = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `conciliacion_${fechaHoy}.xlsx`)
}
