# 🎲 Dados Scorer

Marcador de puntuaciones para juego de dados. PWA pensada para usar en el móvil — instalable, funciona offline, y los datos se guardan automáticamente en el navegador.

## Modos de juego

La app tiene dos modos, seleccionables desde el header:

### 🃏 Dados (clásico)

Tabla con una fila por cara del dado y, por jugador, dos columnas: **Opcional** y **Obligado**. En cada celda introduces el **número de dados** que sacaste — la app multiplica por el valor de la cara.

> Ejemplo: sacas 4 ases → escribes `4` → la app muestra `24` (4 × 6)

Si activas el panel de dados (botón 🎲) y los lanzas, la app sugiere automáticamente cuántos hay de cada cara (el AS hace de comodín salvo en su propia fila). Al pulsar la celda sugerida y luego **JUGAR**, se anota el resultado y se avanza el turno.

**Caras del dado:**

| Icono | Cara | Valor |
|-------|------|-------|
| 🔴    | AS   | 6 pts |
| K     | K    | 5 pts |
| Q     | Q    | 4 pts |
| J     | J    | 3 pts |
| ⚅     | VI   | 2 pts |
| ⚄     | V    | 1 pt  |

### 🎲 Dice Party (estilo Yahtzee)

5 dados, 3 tiradas por turno (puedes bloquear dados entre tiradas). 13 combinaciones:

- **Sección superior:** Ases, Doses, Treses, Cuatros, Cincos, Seises (suma de los dados de ese valor). Si la suma supera 62, **bonus +35**.
- **Sección inferior:** 3 Iguales, 4 Iguales, Full (25), Esc. Pequeña (30), Esc. Grande (40), 5 Iguales (50), Azar.
- **Regla Joker:** si ya jugaste 5 Iguales con 50 pts y vuelves a sacar 5 iguales, **+100 acumulables**.

Cada combinación tiene un botón ⓘ con su requisito, puntuación y ejemplo.

## Multijugador online (P2P)

Conexión directa entre dos dispositivos por WebRTC, sin servidor. Flujo:

1. Un jugador crea sala → recibe un código de oferta → lo manda por WhatsApp.
2. El otro pega ese código, genera un código de respuesta y lo manda de vuelta.
3. El primero pega la respuesta y ya están conectados.

**Sync simétrico**: ambos peers son iguales. Cualquier cambio local (jugada, cambio de turno, modo, reset, jugadores) se aplica al instante y se emite el state completo al otro, que lo aplica. Sin autoridad host/guest. El que crea la sala se asigna al slot 0; el que se une, al slot 1. Cuando se conecta a media partida, el iniciador emite su state actual para sincronizar.

> ⚠️ Usa STUN públicos (sin TURN). Algunas redes móviles o corporativas con NAT simétrico pueden bloquear la conexión — si pasa, prueba con WiFi.

## Otras funcionalidades

- **Tema claro/oscuro** (☀️/🌙)
- **Persistencia local** — cada modo guarda su propio estado en `localStorage`, así no se mezclan formatos al cambiar de modo
- **PWA instalable** — manifest + service worker con cache network-first
- **Error boundary** que detecta corrupción de `localStorage` y se autorrepara

## Estructura del código

```
src/
├── App.jsx                       # Orquestador: routing entre modos + UI compartida
├── main.jsx
├── ErrorBoundary.jsx
├── config.js                     # Filas/subtipos del modo Dados
├── theme.js                      # Temas claro/oscuro
├── DiceIcons.jsx                 # SVGs de las caras del modo Dados
├── ScoreCell.jsx                 # Input/display de una celda en modo Dados
├── boards/
│   ├── DadosBoard.jsx            # Tablero del modo clásico
│   └── DicePartyBoard.jsx        # Tablero estilo Yahtzee
├── dice/
│   ├── DicePanel.jsx             # 5 dados + botón Lanzar/JUGAR
│   └── faces.js
├── diceParty/
│   ├── Die.jsx                   # SVG de un dado de Dice Party
│   ├── dieStyles.js              # Colores y posiciones de pips
│   ├── combinations.js           # Las 13 combinaciones
│   └── scoring.js                # scoreCombo, detectJoker, calcPotential, calcTotal
├── game/
│   ├── useDice.js                # 5 dados, 3 tiradas, lock
│   └── useGameState.js           # players/scores/turno con persistencia por modo
├── multiplayer/
│   ├── rtc.js                    # GameRTC: WebRTC + base64
│   ├── useMultiplayer.js
│   └── MultiplayerModal.jsx
└── ui/
    ├── PlayersModal.jsx
    └── ResetModal.jsx
```

## Desarrollo local

```bash
npm install
npm run dev      # arranca Vite en modo desarrollo
npm run lint     # ESLint
npm run build    # build de producción a dist/
npm run preview  # sirve dist/
```

## Deploy en Netlify

El archivo `netlify.toml` ya está configurado:

- **Build command:** `npm run build`
- **Publish dir:** `dist`

## Stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (vía `@tailwindcss/vite`)
- WebRTC nativo del navegador (DataChannel sobre STUN)
