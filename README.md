# controlMaestro

Aplicación web (React + Vite + Bootstrap) para conciliar las ventas de una
farmacia contra las operaciones cobradas por Clover y por Mercado Pago
directo. Corre 100% en el navegador — no hay backend ni almacenamiento de
los archivos cargados.

## Uso

```bash
npm install
npm run dev
```

## Build y deploy

El deploy a GitHub Pages es automático vía GitHub Actions en cada push a
`main` (ver `.github/workflows/deploy.yml`). Para buildear localmente:

```bash
npm run build
npm run preview
```

## Qué hace

1. Se cargan tres archivos: Ventas (`.xlsx`, hoja "Resumen"), Clover (`.csv`)
   y Mercado Pago (`.xlsx`).
2. Las ventas se separan en dos canales: **Clover** (tarjetas y QR cobrado
   por Clover) y **Mercado Pago directo** (Terminal = 1, Tarjeta = MPAGO).
3. Se reconstruyen los eventos reales de cobro: operaciones múltiples,
   divididas y con Extra Cash.
4. Se concilia cada canal contra su archivo correspondiente (Clover nunca se
   compara contra Mercado Pago, son canales independientes).
5. Se descarga un Excel con la hoja original de Ventas + columnas de Estado
   y Motivo, más una hoja aparte con los cobros que no tienen venta
   asociada.
