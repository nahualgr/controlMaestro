// Traduce terminalDispositivo -> terminal (número de Ventas) en las filas de
// Clover, usando el mapeo armado por el usuario. Debe correr antes de
// cualquier matching. Las filas cuyo dispositivo no esté mapeado quedan con
// terminal = null (no deberían llegar acá: el flujo exige emparejar todo
// antes de habilitar "Confirmar y conciliar").
export function enriquecerTerminalesClover(cloverRows, mapeoTerminales) {
  return cloverRows.map((c) => {
    const terminalVentas = mapeoTerminales[c.terminalDispositivo]
    return {
      ...c,
      terminal: terminalVentas !== undefined && terminalVentas !== '' ? Number(terminalVentas) : null,
    }
  })
}
