import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { parseVentasWorkbook } from '../domain/parsers/ventasParser.js'
import { parseCloverCsv } from '../domain/parsers/cloverParser.js'
import { parseMpWorkbook } from '../domain/parsers/mpParser.js'
import { ejecutarConciliacion } from '../domain/runReconciliation.js'
import { cargarMapeo, guardarMapeo, agregarOEditarEntrada } from '../domain/config/cardMappingStore.js'
import { detectarMarcasClover, detectarCodigosVentas, detectarPendientes } from '../domain/config/cardNameDetector.js'
import { cargarMapeoTerminales, guardarMapeoTerminales, agregarOEditarTerminal } from '../domain/config/terminalMappingStore.js'
import { detectarTerminalesClover, detectarTerminalesVentas, detectarTerminalesPendientes } from '../domain/config/terminalDetector.js'

const ReconciliationContext = createContext(null)

// Estados del flujo:
// cargando -> detectando -> emparejando (si hay tarjetas o terminales sin mapear) -> procesando -> listo
export function ReconciliationProvider({ children }) {
  const [archivos, setArchivos] = useState({ ventas: null, clover: null, mp: null })
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState(null)
  const [deteccion, setDeteccion] = useState(null) // { marcasClover, codigosVentas, terminalesClover, terminalesVentas }
  const [emparejamientoSesion, setEmparejamientoSesion] = useState({}) // marca Clover -> código Ventas
  const [emparejamientoTerminalesSesion, setEmparejamientoTerminalesSesion] = useState({}) // dispositivo -> terminal Ventas
  const [resultado, setResultado] = useState(null)

  // filas ya parseadas, para no volver a leer los archivos al confirmar el emparejamiento
  const filasParsedRef = useRef(null)

  const cargarArchivo = useCallback((tipo, file) => {
    setArchivos((prev) => ({ ...prev, [tipo]: file }))
    setResultado(null)
    setDeteccion(null)
    setEstado('cargando')
  }, [])

  const detectarTarjetas = useCallback(async () => {
    if (!archivos.ventas || !archivos.clover || !archivos.mp) {
      setError('Faltan uno o más archivos por cargar.')
      return
    }
    setEstado('detectando')
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
      filasParsedRef.current = { ventaRows, cloverRows, mpRows }

      const marcasClover = detectarMarcasClover(cloverRows)
      const codigosVentas = detectarCodigosVentas(ventaRows)
      const mapeoGuardado = cargarMapeo()
      const pendientesTarjetas = detectarPendientes(marcasClover, mapeoGuardado)

      const terminalesClover = detectarTerminalesClover(cloverRows)
      const terminalesVentas = detectarTerminalesVentas(ventaRows)
      const mapeoTerminalesGuardado = cargarMapeoTerminales()
      const pendientesTerminales = detectarTerminalesPendientes(terminalesClover, mapeoTerminalesGuardado)

      setDeteccion({ marcasClover, codigosVentas, terminalesClover, terminalesVentas })
      setEmparejamientoSesion({})
      setEmparejamientoTerminalesSesion({})

      if (pendientesTarjetas.length === 0 && pendientesTerminales.length === 0) {
        await ejecutarConMapeosGuardados(mapeoGuardado, mapeoTerminalesGuardado)
      } else {
        setEstado('emparejando')
      }
    } catch (e) {
      setError(e.message ?? 'Ocurrió un error al leer los archivos.')
      setEstado('error')
    }
  }, [archivos])

  const emparejar = useCallback((marcaClover, codigoVentas) => {
    setEmparejamientoSesion((prev) => ({ ...prev, [marcaClover]: codigoVentas }))
  }, [])

  const emparejarTerminal = useCallback((terminalDispositivo, terminalVentas) => {
    setEmparejamientoTerminalesSesion((prev) => ({ ...prev, [terminalDispositivo]: terminalVentas }))
  }, [])

  const ejecutarConMapeosGuardados = async (mapeo, mapeoTerminales) => {
    setEstado('procesando')
    const { ventaRows, cloverRows, mpRows } = filasParsedRef.current
    const salida = ejecutarConciliacion({ ventaRows, cloverRows, mpRows, mapeo, mapeoTerminales })
    setResultado(salida)
    setEstado('listo')
  }

  const confirmarEmparejamientoYConciliar = useCallback(() => {
    let mapeo = cargarMapeo()
    for (const [marcaClover, codigoVentas] of Object.entries(emparejamientoSesion)) {
      if (!codigoVentas || codigoVentas === '__otro__') continue
      mapeo = agregarOEditarEntrada(mapeo, marcaClover, codigoVentas)
    }
    guardarMapeo(mapeo)

    let mapeoTerminales = cargarMapeoTerminales()
    for (const [dispositivo, terminalVentas] of Object.entries(emparejamientoTerminalesSesion)) {
      if (!terminalVentas || terminalVentas === '__otro__') continue
      mapeoTerminales = agregarOEditarTerminal(mapeoTerminales, dispositivo, terminalVentas)
    }
    guardarMapeoTerminales(mapeoTerminales)

    ejecutarConMapeosGuardados(mapeo, mapeoTerminales)
  }, [emparejamientoSesion, emparejamientoTerminalesSesion])

  const reiniciar = useCallback(() => {
    setArchivos({ ventas: null, clover: null, mp: null })
    setResultado(null)
    setDeteccion(null)
    setEmparejamientoSesion({})
    setEmparejamientoTerminalesSesion({})
    setError(null)
    setEstado('cargando')
    filasParsedRef.current = null
  }, [])

  const value = {
    archivos,
    cargarArchivo,
    detectarTarjetas,
    emparejar,
    emparejamientoSesion,
    emparejarTerminal,
    emparejamientoTerminalesSesion,
    confirmarEmparejamientoYConciliar,
    reiniciar,
    estado,
    error,
    deteccion,
    resultado,
  }
  return <ReconciliationContext.Provider value={value}>{children}</ReconciliationContext.Provider>
}

export function useReconciliation() {
  const ctx = useContext(ReconciliationContext)
  if (!ctx) throw new Error('useReconciliation debe usarse dentro de ReconciliationProvider')
  return ctx
}
