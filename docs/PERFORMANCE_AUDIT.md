# PERFORMANCE_AUDIT.md — Auditoría de Rendimiento

> **Versión:** 1.0 · **Fecha:** 2026-07-08 · **Commit del código:** `0098004`
>
> **Rol:** Senior Software Engineer / QA. Alcance: renderizados, consultas repetidas,
> recálculos, funciones costosas, memoria, eventos, listeners y posibles fugas.
>
> **Se documenta, no se optimiza** (restricción de la fase).

---

## Veredicto de rendimiento

**Fluido y correcto en el uso real de hoy** (semanas o pocos meses de datos, un
dispositivo). El diseño de eventos es eficiente y no se detectaron fugas de memoria. El
**único riesgo real es de escalabilidad**: el panel de Progreso **recorre todo el
histórico muchas veces por render** y no cachea agregados, de modo que degradará con
**años** de sesiones. Nada de esto es urgente; se documenta para el Sprint de rendimiento.

Severidad global: **Baja hoy · Media a largo plazo.**

---

## 1. Renderizados

- ✅ **Auto-guardado con `debounce(400 ms)`** (`engine.js:142`): agrupa ráfagas de tecleo
  en una sola escritura. Correcto.
- ✅ **Actualizaciones quirúrgicas en vivo** durante el entreno: al cambiar una serie no se
  re-renderiza el día entero, sino nodos concretos (`updateBestCue`, `updateOneRepMax`,
  `updateVolume`, `updateCoachCues`, `updateProgress`). Buen patrón.
- ✅ **Barra de progreso animada con `transform: scaleX()`**, no con `width` (`ui.js:842`):
  evita reflow, pensado para 120 Hz.
- 🟡 **Re-render por `innerHTML` completo** al abrir paneles (`renderProgress`,
  `renderSettings`) y al cambiar de día (`render`). Para el día es barato (≤~10 ejercicios);
  para **Progreso es caro** (≈20 secciones, ver §3).
- 🟡 **`autoGrow`** fuerza `scrollHeight` (lectura de layout) por cada `textarea` al
  renderizar (`ui.js:114`). Con pocas notas es imperceptible; es un *layout thrash* menor.

## 2. Consultas repetidas sobre el histórico (el punto caliente)

`renderProgress()` (`ui.js:1489`) dispara, en una sola pasada, múltiples funciones que
**iteran `sessions` de forma independiente**, sin compartir resultados ni cachear:

| Función | Recorre | Nº de pasadas por render |
|---|---|---|
| `consistencyStats` | `sessions` + `weeklyVolumes` | varias |
| `globalRecords` | `sessions` (2 bucles: récords + meses) + `weeklyVolumes` | ≥3 |
| `buildInsights` | `weeklyVolumes` + `weeklyMetrics` + `muscleLastTrained` | ≥3 |
| `weeklyMetrics` | `setsMap` | 1 |
| `trendData` / `currentPeriodStat` | `weeklyVolumes`/`monthlyVolumes`/`yearlyVolumes` | 2–3 |
| `progressComparisonHtml` | `progressionComparison` → `weeklyVolumes` | 1 |
| `consistencyHeatmap` | `weeklyVolumes` | 1 |
| `trendForecastHtml` | `recentWeekVolumes` + `exerciseHistory` (por cada ejercicio del plan) | muchas |
| `patternsHtml` | `detectPatterns` → `sessions` | 1 |
| `progressByExerciseHtml` | `exerciseHistory` por **cada** ejercicio del plan | O(plan × sessions) |
| `timelineHtml` | `sessions` + `bests` | 1 |
| `muscleFreqHtml` | `muscleSetsThisWeek` + `muscleLastTrained` (`sessions`) | 2 |
| `svgBars`/`hBars` (día, músculo, récords) | `setsMap`/`bests` | varias |

Y funciones como `weeklyVolumes()` **se recalculan desde cero cada vez que se invocan**
(no memoizan): recorren todo `sessions` y, dentro, `sessionVolume` recorre cada celda.

**Complejidad efectiva de abrir Progreso:** del orden de **O(S × E)** repetido ~10–15
veces, donde S = nº de sesiones y E = ejercicios/serie por sesión. Con S pequeño (hoy) es
milisegundos. Con **años de datos** (S en cientos/miles) será perceptible al abrir el panel.

## 3. Recálculos y funciones costosas

- 🟡 **`weeklyVolumes` / `monthlyVolumes` / `yearlyVolumes`** se reconstruyen en cada
  llamada y se llaman varias veces por render. Candidatas #1 a memoización con
  invalidación en `Store.save`.
- 🟡 **`globalRecords`** hace dos recorridos completos de `sessions` más `weeklyVolumes`.
- 🟡 **`trendForecasts` / `progressByExerciseHtml`** llaman `exerciseHistory(d, id)` **por
  cada ejercicio del plan**, y cada llamada recorre todo `sessions`. Es el patrón más caro
  (producto plan × histórico).
- ✅ Las **primitivas** (`setsVolume`, `epley1RM`, `linearTrend`) son puras y baratas
  individualmente; el coste está en **cuántas veces** se las llama, no en cada una.

**Nota:** no hay cálculos pesados **durante el render del día de entreno** (lo crítico para
la sensación de inmediatez). El coste se concentra en abrir **Progreso**, una acción
puntual y no bloqueante del flujo de entrenar. Por eso la severidad es Media y no Alta.

## 4. Memoria

- ✅ **Sin acumulación de estado**: los mapas de trabajo se limpian y rehidratan
  (`hydrateWorkingMaps` borra antes de llenar). `confettiBurst` crea y elimina nodos
  (`setTimeout` de limpieza).
- ✅ El histórico crece linealmente con el uso real (sesiones fechadas); no hay
  estructuras que crezcan sin control por interacción.
- 🟢 Huella de memoria pequeña y acotada por el volumen de datos del propio usuario.

## 5. Eventos y listeners (fugas)

- ✅ **`bindObservers` se ejecuta UNA sola vez** (desde `boot.js`), con 3 listeners
  delegados sobre `#view` (`input`/`change`/`click`). Como cuelgan del **padre persistente**,
  los re-render por `innerHTML` **no** reenganchan ni acumulan listeners. **No hay fuga.**
- ✅ **`confirmDialog`** asigna `onclick`/`onclick`/`onclick` y los **anula** al cerrar
  (`ui.js:1061`). Sin acumulación.
- ✅ **Timers** (`restTimerId`, `restEndId`, `restHideId`, `toastTimer`) se `clearInterval`/
  `clearTimeout` antes de reasignar. `startRest` cancela los pendientes. Correcto.
- ✅ `window.addEventListener('load')` (registro del SW) se registra una vez.
- 🟡 **31 `onclick` inline** en HTML regenerado: no son una fuga (se descartan con el nodo),
  pero re-parsear atributos en cada render tiene un coste marginal y bloquea CSP (ver
  `SECURITY_AUDIT` S-2).

**Conclusión de fugas:** **no se detectaron fugas de memoria ni de listeners.** Es uno de
los puntos más sólidos del proyecto.

## 6. Service Worker / carga

- ✅ **Network-first para código**: cada despliegue llega; la caché es red de seguridad
  offline. No fija versiones rotas (solo cachea `200/OK`).
- 🟡 **Autorecarga de pestañas al activar** (`service-worker.js:53`): rompe la caché
  envenenada, pero provoca una **recarga visible** tras cada actualización del SW. Es un
  coste de UX/percepción, no de CPU. Documentado.
- ✅ App Shell precacheado tolerante a fallos (`Promise.allSettled`).

## 7. Micro-observaciones

- 🟡 `updateVolume` recalcula `weekVolume`, `monthlyVolumes`, `yearlyVolumes`,
  `weeklyVolumes`, `dayMuscleVolume` **tras cada serie** durante el entreno. Con histórico
  grande, teclear una serie dispara varios recorridos del histórico. Hoy imperceptible;
  vigilar a largo plazo (misma raíz que §2: falta de caché de agregados).
- ✅ Las gráficas SVG se generan como strings (sin librería): coste de render bajo y sin
  dependencias.

---

## Registro priorizado (para el Sprint de rendimiento)

| # | Observación | Severidad hoy | Severidad a largo plazo | Raíz |
|---|---|---|---|---|
| P-1 | Agregados del histórico recalculados N veces por render, sin caché | Baja | **Media** | Falta de memoización |
| P-2 | `exerciseHistory` por ejercicio del plan (plan × histórico) en Progreso | Baja | Media | Consultas no compartidas |
| P-3 | `updateVolume` recorre el histórico tras cada serie | Muy baja | Media | Misma raíz que P-1 |
| P-4 | Re-render `innerHTML` completo del panel Progreso | Baja | Media | Sin render incremental |
| P-5 | Autorecarga del SW = recarga visible tras update | Baja (UX) | Baja | Estrategia de caché |
| P-6 | `onclick` inline re-parseados por render | Muy baja | Baja | Manejadores inline |

**Recomendación (no implementar aún):** una capa de **agregados memoizados**
(`weeklyVolumes`, `monthlyVolumes`, `globalRecords`) invalidada en `Store.save`, más
recalcular fecha/semana si cambia el día. Detalle en `PROJECT_AUDIT.md` (Sprint de
rendimiento). **Nada es urgente**: el flujo de entrenar es inmediato; el coste se limita a
abrir Progreso con mucho historial.
