import { createContext, useContext, useState, useCallback } from 'react'
import { parseVentasWorkbook } from '../domain/parsers/ventasParser.js'
import { parseCloverCsv } from '../domain/parsers/cloverParser.js'
import { parseMpWorkbook } from '../domain/parsers/mpParser.js'
import { ejecutarConciliacion } from '../domain/runReconciliation.js'

const ReconciliationContext = createContext(null)

export function ReconciliationProvider({ children }) {
  const [archivos, setArchivos] = useState({ ventas: null, clover: null, mp: null })
  const [estado, setEstado] = useState('inicial') // inicial | procesando | listo | error
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null) // { resultados, cobrosSinVenta, resumen }

  const cargarArchivo = useCallback((tipo, file) => {
    setArchivos((prev) => ({ ...prev, [tipo]: file }))
  }, [])

  const procesar = useCallback(async () => {
    if (!archivos.ventas || !archivos.clover || !archivos.mp) {
      setError('Faltan uno o más archivos por cargar.')
      return
    }
    setEstado('procesando')
    setError(null)
    try {
      const [ventasBuffer, cloverTexto, mpBuffer] = await Promise.all([
        archivos.ventas.arrayBuffer(),
        archivos.clover.text(),
        archivos.mp.arrayBuffer(),
      ])

      const ventaRows = parseVentasWorkbook(ventasBuffer)
      const cloverRows = parseCloverCsv(cloverTexto)
      const mpRows = parseMpWorkbook(mpBuffer)

      const salida = ejecutarConciliacion({ ventaRows, cloverRows, mpRows })
      setResultado(salida)
      setEstado('listo')
    } catch (e) {
      setError(e.message ?? 'Ocurrió un error al procesar los archivos.')
      setEstado('error')
    }
  }, [archivos])

  const reiniciar = useCallback(() => {
    setArchivos({ ventas: null, clover: null, mp: null })
    setResultado(null)
    setError(null)
    setEstado('inicial')
  }, [])

  const value = { archivos, cargarArchivo, procesar, reiniciar, estado, error, resultado }
  return <ReconciliationContext.Provider value={value}>{children}</ReconciliationContext.Provider>
}

export function useReconciliation() {
  const ctx = useContext(ReconciliationContext)
  if (!ctx) throw new Error('useReconciliation debe usarse dentro de ReconciliationProvider')
  return ctx
}
