# CLAUDE.md

Notas para futuras sesiones de Claude Code en este repositorio.

## Resumen

PWA en React (Vite + Tailwind 4) para llevar puntuaciones de dos juegos de dados:
- **🃏 Dados (clásico)**: tabla cara × jugador (Opcional / Obligado), introduces nº de dados, app multiplica por el valor.
- **🎲 Dice Party (estilo Yahtzee)**: 5 dados, 3 tiradas, 13 combinaciones (upper + lower) con regla joker propia (+100 acumulable al sacar 5 iguales tras haber jugado fiveKind=50).

Funciona offline (service worker), instalable como PWA, con tema claro/oscuro y multijugador P2P por WebRTC.

## Comandos

```bash
npm install         # primera vez en el entorno
npm run dev         # arranca Vite en desarrollo
npm run lint        # ESLint (debe pasar sin warnings)
npm run build       # build a dist/
npm run preview     # sirve dist/
npm test            # Vitest en watch
npm run test:run    # Vitest una sola pasada
```

Antes de commitear, **siempre** correr `npx eslint .`, `npm run test:run` y `npm run build` — el repo no tiene CI propio, sólo el deploy de Netlify, y queremos detectar fallos antes.

## Estructura

```
src/
├── App.jsx                       # orquestador (routing modos + UI compartida)
├── main.jsx, ErrorBoundary.jsx
├── config.js                     # filas/subtipos modo Dados
├── theme.js                      # dark/light
├── DiceIcons.jsx                 # SVGs de las caras del modo Dados (JSX inline)
├── ScoreCell.jsx                 # input + display de una celda en modo Dados
├── boards/
│   ├── DadosBoard.jsx
│   └── DicePartyBoard.jsx
├── dice/
│   ├── DicePanel.jsx             # 5 dados + Lanzar/JUGAR
│   └── faces.js
├── diceParty/
│   ├── Die.jsx                   # SVG de un dado (uso rollKey, no setState-in-effect)
│   ├── dieStyles.js              # FACE_COLORS, LOCKED_COLORS, PIP_POSITIONS
│   ├── combinations.js
│   └── scoring.js                # scoreCombo, detectJoker, calcPotential, calcTotal
├── game/
│   ├── useDice.js                # 5 dados, 3 tiradas, lock — expone rollCount
│   └── useGameState.js           # storage por modo (clave `dados-scorer-v5-${mode}`)
├── multiplayer/
│   ├── rtc.js                    # WebRTC + base64
│   ├── useMultiplayer.js         # sync simétrico (sin host autoritativo)
│   └── MultiplayerModal.jsx
└── ui/
    ├── PlayersModal.jsx          # acepta maxPlayers (Infinity offline, 2 online)
    └── ResetModal.jsx
```

## Modo online: cómo funciona

**Sync simétrico** (sin autoridad). Ambos peers son iguales:
- Cada peer aplica cambios localmente y emite el state completo al otro.
- El receptor reemplaza su state.
- Quien crea sala → slot 0. Quien se une → slot 1.
- Limitado a **2 jugadores en online** (el modal lo enforza con `maxPlayers={2}`).

Claves técnicas en `App.jsx`:
- `skipEmitRef` evita re-emitir state recién recibido (anti-eco).
- `hasReceivedStateRef` hace que el segundo peer espere al state inicial antes de emitir el suyo (evita pisar la partida).
- `onRemoteState` detecta cambios de `turn`/`mode`/`currentPlayer` y resetea UI volátil (selectedCell, selectedCombo, pendingNormalRef).
- `dice/locked/rollsLeft` van dentro del state común → al conectarse a media partida se sincronizan.
- `handleToggleLock` chequea `isMyTurn` (el espectador no manipula locks del peer).

## Convenciones del repo

- **Idioma**: comentarios y mensajes de commit en **español**.
- **Estilo de commits**: tipo en minúscula (`fix:`, `feat:`, `refactor:`, `chore:`) + descripción breve.
- **Tests**: Vitest. Solo `src/diceParty/scoring.test.js` (funciones puras de scoring). No añadir tests de UI ni de hooks sin pedirlo.
- **Comentarios**: minimalistas — explicar el *por qué* cuando no es obvio, nunca el *qué* (los nombres ya lo dicen).
- **Sin emojis** salvo donde ya están (en UI: títulos, labels). No añadir a código, commits ni docs nuevos.

## Cosas que evitar

- **No mergear nunca a `main` directamente** sin permiso del usuario. Trabaja en una rama y abre PR.
- **No añadir TURN servers, librerías de WebRTC ni servidores de señalización** — el flujo manual por base64 es intencional.
- **No añadir features no pedidas** ni refactorizar más allá del scope.
- **No tocar `package-lock.json`** salvo cuando un cambio de dependencias lo requiera.
- **No introducir backwards-compatibility shims** para el storage — basta con bumpear `KEY_PREFIX` en `useGameState.js` (actual: `v5`) si se cambia el formato.

## Bugs/decisiones recurrentes (para no re-descubrir)

- **`alreadyPlayed` en `DadosBoard`**: usa `!!scores[pi]?.[row.id]?.[sub.id]` (truthy check). El check anterior `!== ''` rompía la previsualización cuando `scores={}` inicial.
- **`useDice`**: expone `rollCount = MAX_ROLLS - rollsLeft`. El contador 1-2-3 del panel depende de él.
- **`react-refresh/only-export-components`**: si un archivo exporta un componente React, no exportes constantes desde él. Mover constantes a otro archivo (ver `dieStyles.js`).
- **`set-state-in-effect`** (rule nueva de `eslint-plugin-react-hooks`): preferir derivados puros (`useMemo`) o `rollKey` prop pasada desde el padre, no `useEffect` con `setState`. Solo se permite con `// eslint-disable-next-line` cuando es sincronización con sistema externo (eg `mp.isConnected` → `setMyPlayerIndex`).
- **Refs en render**: actualizar refs **dentro de `useEffect`**, no durante render (lint rule `react-hooks/refs`).

## Despliegue

- Netlify auto-deploya `main` y cada PR (deploy previews en `deploy-preview-<n>--dados-scorer.netlify.app`).
- `netlify.toml`: build `npm run build`, publish `dist`, SPA redirect a `/index.html`.
