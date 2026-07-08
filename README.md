# Entreno V 💪

PWA (aplicación web progresiva) de entrenamiento personal: rutina semanal, mapas
musculares, seguimiento de cargas y progreso. **Funciona sin conexión** y guarda
todo en tu propio dispositivo (`localStorage`) — sin servidores ni cuentas.

## Características

- 🗓️ **Rutina semanal** con tira de días arriba (resalta hoy) y barra de pestañas abajo.
- 💪 **Mapas musculares** por ejercicio (qué músculos trabajas, con degradado y brillo).
- 🔢 **Series reales** con peso, reps, **RIR** y tipo de serie; **volumen real** y **1RM estimado**.
- ✅ **Auto-guardado silencioso** de series y notas (sin botón de "guardar").
- 🏋️ **Sesión con inicio/fin**, resumen del entreno y recuperación de entrenos sin finalizar.
- 🏆 **Récords** por ejercicio y curva de progreso.
- 📊 **Panel de progreso**: volumen, tendencia, frecuencia muscular, insights y logros.
- ⏱️ **Cronómetro de descanso** (con aviso háptico) y descanso por defecto configurable.
- 🌙 **Tema claro/oscuro** y **respaldo/restauración** (JSON) + exportar CSV.
- ⚡ **Modo Express** (rutina exprés de alta intensidad).
- 📲 **Instalable** como app y **offline-first** (Service Worker).

## Estructura

```
.
├── index.html          # Estructura (shell)
├── manifest.json       # Manifiesto PWA
├── service-worker.js   # Caché offline-first
├── css/styles.css      # Estilos
├── js/                 # Lógica modular (scripts en orden, mismo scope global):
│   ├── data.js         #   1. Datos del plan (SCHEDULE) y fechas
│   ├── store.js        #   2. Persistencia (localStorage + IndexedDB), migraciones, histórico
│   ├── engine.js       #   3. Dominio: volumen, 1RM, récords, mapas SVG
│   ├── dashboard.js    #      Motor de analítica (Score, Salud, predicciones)
│   ├── gamification.js #      Motor de gamificación (XP, nivel, rachas, retos)
│   ├── coach.js        #      Motor Coach (pistas, patrones, análisis)
│   ├── ui.js           #   4. Interfaz (render, editor, paneles, eventos, export)
│   └── boot.js         #   5. Arranque
├── docs/               # 📚 Documentación oficial (ver docs/README.md)
└── assets/icon.svg     # Icono
```

## Documentación

La **fuente oficial** del proyecto vive en [`docs/`](./docs/README.md): manifiesto,
principios de ingeniería, auditoría integral (`PROJECT_AUDIT.md`), estado del producto,
Product Breakdown Structure, registro de decisiones y changelog. Empieza por
[`docs/README.md`](./docs/README.md).

## Cómo usarla

- **Rápido:** abre `index.html` en el navegador.
- **Como PWA real (instalable / offline):** sírvela por HTTP. Con Python:
  ```bash
  python -m http.server 8000
  # luego abre http://localhost:8000
  ```
- **En la web:** desplegada con GitHub Pages (ver pestaña *Settings → Pages* del repo).

## Datos y privacidad

Todo se guarda **solo en tu navegador** (`localStorage`). Haz un **Respaldo** (JSON)
desde Ajustes para no perder nada si borras los datos del sitio o cambias de móvil.
