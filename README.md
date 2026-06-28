# Entreno V 💪

PWA (aplicación web progresiva) de entrenamiento personal: rutina semanal, mapas
musculares, seguimiento de cargas y progreso. **Funciona sin conexión** y guarda
todo en tu propio dispositivo (`localStorage`) — sin servidores ni cuentas.

## Características

- 🗓️ **Rutina semanal** con date-strip dinámico (resalta el día de hoy).
- 💪 **Mapas musculares** por ejercicio (qué músculos trabajas, con degradado y brillo).
- ✅ **Auto-guardado silencioso** de checks, pesos, reps y notas (sin botón de "guardar").
- 🏋️ **Seguimiento de cargas** con volumen total levantado.
- 🏆 **Récords por ejercicio** para medir la sobrecarga progresiva.
- 📈 **Panel de progreso** con gráficas de volumen y tendencia semanal.
- ⏱️ **Cronómetro de descanso** entre series (con aviso háptico).
- 🎓 **Modo estudio** que cambia a una rutina exprés de alta intensidad.
- 📅 **Exportar a calendario** (.ics) los días de entrenamiento.
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

Todo se guarda **solo en tu navegador**. Si borras los datos del sitio, se pierden
(más adelante se puede añadir exportar/importar respaldo).
