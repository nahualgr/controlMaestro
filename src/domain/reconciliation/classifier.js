// Asigna Estado + Motivo a cada evento de Ventas (especificación §7).
import { CANAL } from '../normalizers/channelResolver.js'
import { matchearEventoClover } from './cloverMatcher.js'
import { matchearEventoMp } from './mpMatcher.js'
import { resolverDividido } from './dividedMatcher.js'

export function clasificarEvento(evento, { cloverRows, mpRows, mapeo }) {
  if (evento.tipoOperacion === 'Anulado') {
    return { ...evento, estado: 'Cancelado', motivo: 'Operación anulada, excluida del control', cobro: null }
  }

  if (evento.tipoOperacion === 'Dividido') {
    const r = resolverDividido(evento, { cloverRows, mpRows })
    return { ...evento, estado: r.estado, motivo: r.motivo, cobro: r.cobros[0] ?? null, cobrosDivididos: r.cobros }
  }

  const resultado =
    evento.canal === CANAL.CLOVER
      ? matchearEventoClover(evento, cloverRows, mapeo)
      : matchearEventoMp(evento, mpRows)

  if (resultado.estado === null) {
    return { ...evento, estado: 'Error', motivo: 'Venta sin cobro correspondiente', cobro: null }
  }

  return { ...evento, estado: resultado.estado, motivo: resultado.motivo, cobro: resultado.cobro }
}

export function clasificarTodos(eventos, contexto) {
  return eventos.map((e) => clasificarEvento(e, contexto))
}
