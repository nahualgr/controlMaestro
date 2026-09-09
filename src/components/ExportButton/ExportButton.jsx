import { exportarResultado } from '../../domain/export/excelExporter.js'

export default function ExportButton({ resultado }) {
  return (
    <button
      className="btn btn-brand-outline"
      onClick={() => exportarResultado(resultado)}
    >
      Descargar Excel de conciliación
    </button>
  )
}
