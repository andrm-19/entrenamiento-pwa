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
├── js/app.js           # Toda la lógica
└── assets/icon.svg     # Icono
```

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
