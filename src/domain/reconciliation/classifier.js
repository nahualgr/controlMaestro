// Asigna Estado + Motivo (+ Corrección sugerida + Diferencia de importe) a
// cada evento de Ventas (especificación §7).
import { CANAL } from '../normalizers/channelResolver.js'
import { matchearEventoClover } from './cloverMatcher.js'
import { matchearEventoMp } from './mpMatcher.js'
import { resolverDividido } from './dividedMatcher.js'

export function clasificarEvento(evento, { cloverRows, mpRows, mapeo }) {
  if (evento.tipoOperacion === 'Anulado') {
    return {
      ...evento,
      estado: 'Cancelado',
      motivo: 'Anulada, excluida',
      correccion: null,
      diferenciaImporte: null,
      cobro: null,
      sinCobro: false,
    }
  }

  if (evento.tipoOperacion === 'Dividido') {
    const r = resolverDividido(evento, { cloverRows, mpRows })
    return {
      ...evento,
      estado: r.estado,
      motivo: r.motivo,
      correccion: r.correccion,
      diferenciaImporte: r.diferenciaImporte,
      cobro: r.cobros[0] ?? null,
      cobrosDivididos: r.cobros,
      sinCobro: r.cobros.length === 0,
    }
  }

  const resultado =
    evento.canal === CANAL.CLOVER
      ? matchearEventoClover(evento, cloverRows, mapeo)
      : matchearEventoMp(evento, mpRows)

  if (resultado.estado === null) {
    return {
      ...evento,
      estado: 'Error',
      motivo: 'Sin cobro correspondiente',
      correccion: 'Buscar cobro por importe/fecha',
      diferenciaImporte: null,
      cobro: null,
      sinCobro: true,
    }
  }

  return {
    ...evento,
    estado: resultado.estado,
    motivo: resultado.motivo,
    correccion: resultado.correccion,
    diferenciaImporte: resultado.diferenciaImporte,
    cobro: resultado.cobro,
    sinCobro: false,
  }
}

export function clasificarTodos(eventos, contexto) {
  return eventos.map((e) => clasificarEvento(e, contexto))
}
