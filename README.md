# 🎲 Dados Scorer

Marcador de puntuaciones para juego de dados. Diseñado para usar en el móvil.

## ¿Cómo funciona?

La tabla tiene una fila por cada cara del dado y una columna por cada jugador (dividida en **Opcional** y **Obligado**).

En cada celda introduces el **número de dados** que has sacado — la app multiplica sola por el valor de esa cara y muestra el resultado.

> Ejemplo: sacas 4 ases → escribes `4` → la app muestra `24` (4 × 6)

Al hacer clic en una celda vuelves a ver los dados para editar.

Los datos se guardan automáticamente en el navegador, así que no pierdes nada si recargas la página.

## Caras del dado

| Icono | Cara | Valor |
|-------|------|-------|
| 🔴    | AS   | 6 pts |
| K     | K    | 5 pts |
| Q     | Q    | 4 pts |
| J     | J    | 3 pts |
| ⚅     | VI   | 2 pts |
| ⚄     | V    | 1 pt  |

## Estructura del código

```
src/
├── App.jsx          # Componente principal — estado global y tabla
├── config.js        # Configuración: caras del dado y jugadores por defecto
├── storage.js       # Guardar y cargar el estado en localStorage
├── helpers.js       # Funciones: crear marcador vacío, calcular total
├── DiceIcons.jsx    # Iconos SVG de cada cara del dado
├── ScoreCell.jsx    # Celda de puntuación (muestra resultado, edita dados)
├── PlayersModal.jsx # Modal para añadir/renombrar/eliminar jugadores
└── ResetModal.jsx   # Modal de confirmación de reset
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Netlify

El archivo `netlify.toml` ya está configurado. Solo conecta el repo en Netlify y listo.

- **Build command:** `npm run build`
- **Publish dir:** `dist`

## Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
