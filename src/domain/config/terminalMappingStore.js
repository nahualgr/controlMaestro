// Persistencia del mapeo terminal-de-Clover -> terminal-de-Ventas en
// localStorage. Misma lógica que cardMappingStore.js, pero para terminales.
const STORAGE_KEY = 'controlMaestro:terminalMapping'

export function cargarMapeoTerminales() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function guardarMapeoTerminales(mapeo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapeo))
}

export function agregarOEditarTerminal(mapeo, terminalDispositivo, terminalVentas) {
  const clave = (terminalDispositivo ?? '').toString().trim()
  if (!clave) return mapeo
  return { ...mapeo, [clave]: (terminalVentas ?? '').toString().trim() }
}

export function eliminarTerminal(mapeo, terminalDispositivo) {
  const copia = { ...mapeo }
  delete copia[terminalDispositivo]
  return copia
}

export function exportarMapeoTerminalesJson(mapeo) {
  const blob = new Blob([JSON.stringify(mapeo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'controlMaestro_mapeo_terminales.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importarMapeoTerminalesJson(file) {
  const texto = await file.text()
  const parsed = JSON.parse(texto)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('El archivo no tiene el formato esperado (debe ser un objeto dispositivo -> terminal).')
  }
  return parsed
}
