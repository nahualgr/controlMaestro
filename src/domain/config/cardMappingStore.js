// Persistencia del mapeo Clover -> Ventas en localStorage (no hay backend).
// Incluye exportar/importar como JSON para poder llevar la configuración
// de una computadora a otra o guardarla como respaldo.
const STORAGE_KEY = 'controlMaestro:cardMapping'

export function cargarMapeo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function guardarMapeo(mapeo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapeo))
}

export function agregarOEditarEntrada(mapeo, nombreClover, nombreVentas) {
  const clave = (nombreClover ?? '').toUpperCase().trim()
  if (!clave) return mapeo
  return { ...mapeo, [clave]: (nombreVentas ?? '').trim() }
}

export function eliminarEntrada(mapeo, nombreClover) {
  const copia = { ...mapeo }
  delete copia[nombreClover]
  return copia
}

export function exportarMapeoJson(mapeo) {
  const blob = new Blob([JSON.stringify(mapeo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'controlMaestro_mapeo_tarjetas.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importarMapeoJson(file) {
  const texto = await file.text()
  const parsed = JSON.parse(texto)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('El archivo no tiene el formato esperado (debe ser un objeto Clover -> Ventas).')
  }
  return parsed
}
