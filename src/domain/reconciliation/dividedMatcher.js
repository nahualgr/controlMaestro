// Resuelve operaciones "Dividido". En Ventas, un ticket dividido queda como
// UNA sola fila: importe total, un único medio de pago registrado (el
// "declarado"), que en la práctica cubre solo una parte del ticket. El
// resto del importe se cobró con una operación que Ventas NUNCA registra
// explícitamente, y que puede estar en el mismo canal o en el otro
// (ej. parte con tarjeta por Clover, parte con Mercado Pago directo).
//
// Estrategia:
//   1) Buscar el cobro "declarado" por la clave habitual del canal del
//      evento (terminal+cupón en Clover, o autorización=operation_id en MP).
//   2) Si ese cobro no cubre el importe total, calcular el remanente y
//      buscarlo, por IMPORTE EXACTO, entre los cobros no consumidos de
//      AMBOS canales (Clover y MP), ya que no hay otra clave declarada
//      para identificarlo.
import { CANAL } from '../normalizers/channelResolver.js'

export function resolverDividido(evento, { cloverRows, mpRows }) {
  const declarado =
    evento.canal === CANAL.CLOVER
      ? buscarDeclaradoEnClover(evento, cloverRows)
      : buscarDeclaradoEnMp(evento, mpRows)

  if (!declarado) {
    return {
      estado: 'Error',
      motivo: 'Operación dividida: no se encontró el cobro declarado (terminal/autorización/cupón no coinciden con ningún cobro)',
      cobros: [],
    }
  }

  const importeDeclarado =
    evento.canal === CANAL.CLOVER ? declarado.importe + declarado.importeExtraCash : declarado.importe

  // el declarado ya cubre (o supera) el ticket: no hubo un segundo cobro real
  if (importeDeclarado >= evento.importeTotal) {
    declarado._consumido = true
    if (importeDeclarado > evento.importeTotal) {
      return {
        estado: 'Error',
        motivo: `Operación dividida con exceso: el cobro declarado ($${importeDeclarado}) supera el importe del ticket ($${evento.importeTotal})`,
        cobros: [declarado],
      }
    }
    return {
      estado: 'OK',
      motivo: 'Operación marcada como dividida pero cubierta por un único cobro declarado',
      cobros: [declarado],
    }
  }

  const remanente = redondear(evento.importeTotal - importeDeclarado)
  const complemento = buscarComplementoPorImporte(remanente, { cloverRows, mpRows })

  if (!complemento) {
    return {
      estado: 'Error',
      motivo: `Operación dividida incompleta: cobro declarado $${importeDeclarado} de $${evento.importeTotal}, falta un complemento de $${remanente} que no se encontró en ningún canal`,
      cobros: [declarado],
    }
  }

  declarado._consumido = true
  complemento.cobro._consumido = true

  return {
    // "Revisar" y no "OK": el complemento se infiere solo por importe exacto,
    // sin ninguna clave declarada que lo confirme (podría haber ambigüedad
    // si dos cobros distintos comparten el mismo importe remanente).
    estado: 'Revisar',
    motivo: `Operación dividida: declarado $${importeDeclarado} (${etiquetaCanal(evento.canal)}) + complemento $${remanente} (${etiquetaCanal(complemento.canal)}, no declarado en Ventas) = $${evento.importeTotal}. Verificar manualmente que el complemento asignado sea el correcto.`,
    cobros: [declarado, complemento.cobro],
  }
}

function buscarDeclaradoEnClover(evento, cloverRows) {
  return cloverRows.find(
    (c) => c.resultado === 'SUCCESS' && !c._consumido && c.terminal === evento.terminal && c.cupon === evento.cupon
  )
}

function buscarDeclaradoEnMp(evento, mpRows) {
  return mpRows.find((m) => !m._consumido && m.operationId === evento.autorizacion)
}

function buscarComplementoPorImporte(remanente, { cloverRows, mpRows }) {
  const enClover = cloverRows.find(
    (c) => c.resultado === 'SUCCESS' && !c._consumido && redondear(c.importe + c.importeExtraCash) === remanente
  )
  if (enClover) return { cobro: enClover, canal: CANAL.CLOVER }

  const enMp = mpRows.find((m) => !m._consumido && redondear(m.importe) === remanente)
  if (enMp) return { cobro: enMp, canal: CANAL.MP_DIRECTO }

  return null
}

function etiquetaCanal(canal) {
  return canal === CANAL.CLOVER ? 'Clover' : 'Mercado Pago directo'
}

function redondear(n) {
  return Math.round(n * 100) / 100
}
