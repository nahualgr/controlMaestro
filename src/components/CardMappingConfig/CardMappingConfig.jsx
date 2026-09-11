import { useEffect, useState } from 'react'
import {
  cargarMapeo,
  guardarMapeo,
  agregarOEditarEntrada,
  eliminarEntrada,
  exportarMapeoJson,
  importarMapeoJson,
} from '../../domain/config/cardMappingStore.js'
import {
  cargarMapeoTerminales,
  guardarMapeoTerminales,
  agregarOEditarTerminal,
  eliminarTerminal,
  exportarMapeoTerminalesJson,
  importarMapeoTerminalesJson,
} from '../../domain/config/terminalMappingStore.js'

export default function CardMappingConfig() {
  const [mapeo, setMapeo] = useState({})
  const [nuevoClover, setNuevoClover] = useState('')
  const [nuevoVentas, setNuevoVentas] = useState('')
  const [errorImport, setErrorImport] = useState(null)

  const [mapeoTerminales, setMapeoTerminales] = useState({})
  const [nuevoDispositivo, setNuevoDispositivo] = useState('')
  const [nuevoTerminalVentas, setNuevoTerminalVentas] = useState('')
  const [errorImportTerminales, setErrorImportTerminales] = useState(null)

  useEffect(() => {
    setMapeo(cargarMapeo())
    setMapeoTerminales(cargarMapeoTerminales())
  }, [])

  const guardar = (siguiente) => {
    setMapeo(siguiente)
    guardarMapeo(siguiente)
  }
  const agregar = () => {
    if (!nuevoClover.trim() || !nuevoVentas.trim()) return
    guardar(agregarOEditarEntrada(mapeo, nuevoClover, nuevoVentas))
    setNuevoClover('')
    setNuevoVentas('')
  }
  const editarValor = (claveClover, valor) => guardar({ ...mapeo, [claveClover]: valor })
  const eliminar = (claveClover) => guardar(eliminarEntrada(mapeo, claveClover))
  const importar = async (file) => {
    setErrorImport(null)
    try {
      guardar({ ...mapeo, ...(await importarMapeoJson(file)) })
    } catch (e) {
      setErrorImport(e.message)
    }
  }

  const guardarTerminales = (siguiente) => {
    setMapeoTerminales(siguiente)
    guardarMapeoTerminales(siguiente)
  }
  const agregarTerminal = () => {
    if (!nuevoDispositivo.trim() || !nuevoTerminalVentas.trim()) return
    guardarTerminales(agregarOEditarTerminal(mapeoTerminales, nuevoDispositivo, nuevoTerminalVentas))
    setNuevoDispositivo('')
    setNuevoTerminalVentas('')
  }
  const editarValorTerminal = (dispositivo, valor) => guardarTerminales({ ...mapeoTerminales, [dispositivo]: valor })
  const eliminarTerminalEntrada = (dispositivo) => guardarTerminales(eliminarTerminal(mapeoTerminales, dispositivo))
  const importarTerminales = async (file) => {
    setErrorImportTerminales(null)
    try {
      guardarTerminales({ ...mapeoTerminales, ...(await importarMapeoTerminalesJson(file)) })
    } catch (e) {
      setErrorImportTerminales(e.message)
    }
  }

  const entradas = Object.entries(mapeo)
  const entradasTerminales = Object.entries(mapeoTerminales)

  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      <header className="mb-4">
        <h1 className="h3 fw-bold mb-1">Equivalencias guardadas</h1>
        <p className="text-muted mb-0">
          Estas son las equivalencias de tarjetas y terminales que ya emparejaste (al conciliar, o
          acá mismo). El emparejamiento de cosas nuevas ahora se hace directamente en la pantalla
          de Conciliar, después de subir los archivos — acá podés revisar, corregir o eliminar lo
          ya guardado.
        </p>
        <p className="text-muted small mb-0">
          Nota: todas las operaciones QR PosNet (Mercado Pago, MODO, Naranja X, Ualá, etc.) se
          traducen siempre al código "QRPCT" — esa regla es fija y no se configura acá.
        </p>
      </header>

      <h2 className="h5 fw-semibold mb-3">Tarjetas</h2>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Agregar equivalencia</h3>
          <div className="row g-2 align-items-end">
            <div className="col-sm-5">
              <label className="form-label small">Marca en Clover</label>
              <input className="form-control" placeholder='ej. "VISA DEBITO"' value={nuevoClover} onChange={(e) => setNuevoClover(e.target.value)} />
            </div>
            <div className="col-sm-5">
              <label className="form-label small">Código en Ventas</label>
              <input className="form-control" placeholder='ej. "VISADB"' value={nuevoVentas} onChange={(e) => setNuevoVentas(e.target.value)} />
            </div>
            <div className="col-sm-2">
              <button className="btn btn-brand w-100" onClick={agregar}>Agregar</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Equivalencias configuradas ({entradas.length})</h3>
          {entradas.length === 0 ? (
            <p className="text-muted mb-0">Todavía no cargaste ninguna equivalencia.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Marca en Clover</th><th>Código en Ventas</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map(([claveClover, valorVentas]) => (
                    <tr key={claveClover}>
                      <td className="font-monospace">{claveClover}</td>
                      <td><input className="form-control form-control-sm" value={valorVentas} onChange={(e) => editarValor(claveClover, e.target.value)} /></td>
                      <td><button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(claveClover)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-5">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Respaldo de tarjetas</h3>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button className="btn btn-brand-outline" onClick={() => exportarMapeoJson(mapeo)}>Exportar (JSON)</button>
            <label className="btn btn-outline-secondary mb-0">
              Importar (JSON)
              <input type="file" accept=".json" hidden onChange={(e) => e.target.files[0] && importar(e.target.files[0])} />
            </label>
          </div>
          {errorImport && <div className="alert alert-danger mt-3 mb-0">{errorImport}</div>}
        </div>
      </div>

      <h2 className="h5 fw-semibold mb-3">Terminales</h2>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Agregar equivalencia</h3>
          <div className="row g-2 align-items-end">
            <div className="col-sm-5">
              <label className="form-label small">Dispositivo en Clover</label>
              <input className="form-control" placeholder='ej. "69322490"' value={nuevoDispositivo} onChange={(e) => setNuevoDispositivo(e.target.value)} />
            </div>
            <div className="col-sm-5">
              <label className="form-label small">Terminal en Ventas</label>
              <input className="form-control" placeholder='ej. "490"' value={nuevoTerminalVentas} onChange={(e) => setNuevoTerminalVentas(e.target.value)} />
            </div>
            <div className="col-sm-2">
              <button className="btn btn-brand w-100" onClick={agregarTerminal}>Agregar</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Equivalencias configuradas ({entradasTerminales.length})</h3>
          {entradasTerminales.length === 0 ? (
            <p className="text-muted mb-0">Todavía no cargaste ninguna equivalencia de terminal.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr className="text-muted small text-uppercase">
                    <th>Dispositivo en Clover</th><th>Terminal en Ventas</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {entradasTerminales.map(([dispositivo, terminalVentas]) => (
                    <tr key={dispositivo}>
                      <td className="font-monospace">{dispositivo}</td>
                      <td><input className="form-control form-control-sm" value={terminalVentas} onChange={(e) => editarValorTerminal(dispositivo, e.target.value)} /></td>
                      <td><button className="btn btn-sm btn-outline-danger" onClick={() => eliminarTerminalEntrada(dispositivo)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3 className="h6 fw-semibold mb-3">Respaldo de terminales</h3>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button className="btn btn-brand-outline" onClick={() => exportarMapeoTerminalesJson(mapeoTerminales)}>Exportar (JSON)</button>
            <label className="btn btn-outline-secondary mb-0">
              Importar (JSON)
              <input type="file" accept=".json" hidden onChange={(e) => e.target.files[0] && importarTerminales(e.target.files[0])} />
            </label>
          </div>
          {errorImportTerminales && <div className="alert alert-danger mt-3 mb-0">{errorImportTerminales}</div>}
          <p className="text-muted small mt-3 mb-0">
            Esta configuración se guarda en este navegador. Si usás controlMaestro desde otra
            computadora, exportá los archivos acá e importalos allá para no tener que cargar todo
            de nuevo.
          </p>
        </div>
      </div>
    </div>
  )
}
