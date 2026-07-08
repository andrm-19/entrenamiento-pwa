# ARCHITECTURE_AUDIT.md — Auditoría exclusiva de Arquitectura

> **Versión:** 1.0 · **Fecha:** 2026-07-08 · **Commit:** `25e3d42` (código de la app en `0098004`)
>
> **Alcance:** SOLO arquitectura. No se evalúan funcionalidades (eso está en
> [`PRODUCT_STATUS.md`](./PRODUCT_STATUS.md)) ni seguridad/performance/UX (documentos propios).
>
> **Rol:** Principal Software Architect. No se implementa nada; solo se analiza.

---

## Veredicto de arquitectura

**Arquitectura correcta para su tamaño actual, con una capa de abstracción de
persistencia notablemente buena, pero con dos violaciones estructurales que impiden
escalar con seguridad: (1) la comunicación entre módulos es por *scope global mutable*,
no por interfaces, y (2) `ui.js` mezcla presentación con lógica de negocio.** Sin una
suite de pruebas, estas dos deudas convierten cualquier crecimiento en riesgo.

Nivel de madurez arquitectónica: **2.5 / 5** (modular por archivos, pero acoplada por globals y sin tests).

---

## 1. Separación de responsabilidades

Los ENGINEERING_PRINCIPLES definen capas `UI → Application → Engines → Repositories →
Persistence`, con la regla dura **"la UI nunca calcula, interpreta ni decide"**.

| Capa esperada | ¿Existe? | Realidad |
|---|---|---|
| UI | 🟡 | `ui.js` renderiza **y** calcula (viola la regla). No hay capa de Aplicación separada |
| Application Layer | 🔴 | No existe como capa; la orquestación vive mezclada en `ui.js` y `boot.js` |
| Engines | 🟡 | `dashboard.js`, `gamification.js`, `coach.js`, parte de `engine.js`. Otros motores viven en `ui.js` |
| Repositories | 🟡 | `RoutineRepository` (bueno) para rutinas; **no hay repositorio de sesiones** |
| Persistence | 🟢 | Adaptadores `DB` (localStorage) e `IDB` (IndexedDB) bien aislados |

**Conclusión:** la separación es **parcial**. La frontera UI↔lógica está rota; la
frontera dominio↔persistencia está bien para rutinas pero ausente para sesiones.

## 2. Modularidad

- ✅ El código está dividido en 8 archivos por responsabilidad temática, cargados en
  orden. Es un avance real frente al monolito `app.js` original (commit `7feef72`).
- 🟡 Pero **no son módulos** en sentido técnico: no hay `import`/`export`, ni IIFEs, ni
  namespaces. Todo cuelga del objeto global `window`. La "modularidad" es organizativa
  (archivos), no de encapsulamiento.
- 🔴 **La frontera de un módulo no está protegida.** Cualquier archivo puede leer y
  **mutar** el estado de cualquier otro (`sessions`, `setsMap`, `goals`, `SCHEDULE`…).

## 3. Acoplamiento

**Alto acoplamiento por estado global compartido.** Ejemplos verificados:

- `dashboard.js:progressScore()` llama a `weekSessionsCount()` que vive en `ui.js`;
  `dashboard.js:progressionRatio()` llama a `stagnationCount()` que vive en `ui.js`.
- `coach.js:coachCue()` usa `setsMap`, `exKey`, `dateOfDay`, `lastSessionTopSet` (esta
  última en `ui.js`).
- `gamification.js` depende de `weekSessionsCount`, `weekVolume`, `consistencyStats`
  (en `ui.js`).

→ Los "motores" no son independientes: **dependen circularmente de funciones de la UI**.
Esto invierte la dirección de dependencia que exigen los principios (los motores deberían
ser la capa inferior, la UI la superior). Hoy la UI es, de hecho, una capa de servicios.

**Acoplamiento temporal:** el orden de `<script>` en `index.html` es un contrato
implícito. Reordenarlo rompe la app en runtime sin aviso (sin build/tipos).

## 4. Cohesión

| Archivo | Cohesión | Observación |
|---|---|---|
| `data.js` | 🟢 Alta | Solo plan + fechas |
| `store.js` | 🟢 Alta | Persistencia, migraciones, consultas de histórico. Coherente |
| `engine.js` | 🔴 Baja | Mezcla **3 dominios**: cálculo de fuerza (volumen/1RM), formato (`fmtKg`, `escapeHtml`) y **generación de SVG anatómico** |
| `dashboard.js` | 🟢 Alta | Analítica |
| `gamification.js` | 🟢 Alta | Gamificación |
| `coach.js` | 🟢 Alta | Coach |
| `ui.js` | 🔴 Baja | Render + eventos + editor + ajustes + export + **lógica de negocio** (records, métricas, insights, progresión) |
| `boot.js` | 🟢 Alta | Solo arranque |

## 5. Archivos demasiado grandes

| Archivo | Líneas | Diagnóstico |
|---|---|---|
| **`ui.js`** | **1 629** | **Demasiado grande y con demasiadas responsabilidades.** Es el mayor riesgo estructural |
| `css/styles.css` | 916 | Grande pero es un único stylesheet coherente; aceptable |
| `store.js` | 500 | En el límite; podría separarse "migraciones" de "consultas de histórico" |
| `engine.js` | 435 | Debería dividirse por cohesión (dominio vs. formato vs. SVG) |

## 6. Módulos que hacen demasiadas cosas

- **`ui.js`** hace: render del día, render de paneles (progreso/ajustes/resumen), editor
  de rutinas, cronómetro de descanso, confeti, ciclo de vida de sesión, export CSV/PDF/JSON,
  import, **y** cálculo de récords globales, métricas semanales, constancia, insights y
  progresión. Son ≥6 responsabilidades.
- **`engine.js`** hace: dominio de fuerza + utilidades de formato/escape + dibujo SVG.

## 7. Motores existentes vs. motores faltantes

| Motor | ¿Existe? | Dónde |
|---|---|---|
| Statistics/Volume | 🟢 | `engine.js` (primitiva `setsVolume`) |
| Dashboard/Analytics | 🟢 | `dashboard.js` |
| Gamification | 🟢 | `gamification.js` |
| Coach | 🟡 | `coach.js` (solo pistas; sin decisiones) |
| **Progression** | 🔴 disperso | `progressionSuggest`/`stagnationCount` en `ui.js`; `progressionRatio` en `dashboard.js`; `bestExerciseVolume` en `coach.js` |
| **Records** | 🔴 disperso | Mapa `bests` (en vivo) + `globalRecords` en `ui.js` |
| **Insights** | 🔴 disperso | `buildInsights`/`sessionInsights` en `ui.js` |
| **Sync** | 🔴 inexistente | Solo campos "sync-ready" (`updatedAt`, `state`) |
| **Social** | 🔴 inexistente | — |
| **Session Repository** | 🔴 inexistente | `Store` accede directo; sin frontera de repositorio |

**Motor mejor construido:** la capa de **persistencia** (`DB`/`IDB` + reconciliación) y la
**primitiva única de volumen**. Son el modelo a seguir para el resto.

## 8. Flujo de datos

```
Usuario → evento (input/change/click) → onFieldChange/onViewClick (ui.js)
        → muta mapas de trabajo en memoria (done/setsMap/notes)
        → debouncedSave → Store.save → syncSessionsFromWorking → sessions[fecha]
        → DB.write(localStorage) + IDB.set(IndexedDB, si reconciliado)
Render:  Store.load → applyState → hydrateWorkingMaps → render() lee mapas + sessions
```

- ✅ **Un único punto de guardado** (`Store.save`) y un único listener delegado
  (`bindObservers`, una sola vez). Buen diseño: el re-render por `innerHTML` no reengancha
  listeners porque cuelgan del padre `#view` persistente.
- 🟡 **Doble representación** del estado de la semana en curso: "mapas de trabajo" por
  posición **y** `sessions` por fecha/slug. La traducción bidireccional
  (`syncSessionsFromWorking`/`hydrateWorkingMaps`) es correcta pero frágil ante edición de
  rutina a mitad de semana (posición↔slug).
- 🔴 **Inconsistencia de derivación:** hay **dos formas distintas** de contar "sesiones de
  la semana" (ver `PERFORMANCE_AUDIT` y `PROJECT_AUDIT` N-2): por *checkbox done* (full
  mode) en `renderProgress` y por *volumen* en `weekSessionsCount`. Pueden discrepar.

## 9. Persistencia y Offline First (arquitectura)

- ✅ **Excelente:** inversión de dependencias real. Migrar a stores relacionales
  (`workouts`/`sets`) es reimplementar `DB`/`IDB` sin tocar dominio.
- ✅ Doble durabilidad con reconciliación al arranque.
- ✅ Offline First cumplido a nivel de arquitectura (SW network-first para código).
- 🟡 **Fragmentación de claves:** el estado vive en `entrenoV.state.v4` **y** el plan de
  rutinas en `entrenoV.plan.v1`, gestionados por caminos distintos (`Store` vs.
  `RoutineRepository`). El respaldo solo cubre el primero → **pérdida de datos de rutina**
  (ver `SECURITY_AUDIT` N-1). Falta un punto único de "exportar/importar TODO el estado".

## 10. Organización del proyecto y convenciones

- ✅ Convención de comentarios excelente y consistente (secciones numeradas, `spec §`).
- ✅ Nomenclatura coherente (`fmtKg`, `weekVolume`, `exKey`…).
- 🔴 **Trazabilidad rota:** los `§` apuntan a MPS/PED **ausentes del repo**.
- 🟡 **Versionado disperso:** `v46` hardcodeado en `index.html`, `service-worker.js` y CSS.
- 🟡 **Código muerto:** `#banner`/`renderBanner`/`dismissBanner`/`bannerHidden` — el
  elemento `#banner` **no existe** en `index.html`; son restos vestigiales.

## 11. Dependencias innecesarias

- ✅ **Cero dependencias de terceros.** No hay librerías superfluas. Esto es una fortaleza
  (supply-chain nula, arranque instantáneo). No se recomienda añadir ninguna.

## 12. Deuda técnica arquitectónica (priorizada)

| # | Deuda | Severidad | Efecto en escalabilidad |
|---|---|---|---|
| A-1 | Comunicación por **scope global mutable** (sin interfaces) | Alta | Cada feature aumenta el acoplamiento; refactor cada vez más caro |
| A-2 | **`ui.js` mezcla render + lógica** (UI calcula) | Alta | Imposible testear la lógica sin el DOM; el archivo crece sin límite |
| A-3 | **Sin tests** | Crítica | Cualquier refactor de A-1/A-2 es a ciegas |
| A-4 | **Progression/Records/Insights dispersos** entre 3 archivos | Media | Duplicación y divergencia (N-2) |
| A-5 | **Sin repositorio de sesiones** | Media | La persistencia de sesiones no tiene frontera; difícil migrar a SQL/sync |
| A-6 | `engine.js` con 3 dominios mezclados | Media | Baja cohesión; dificulta reubicar el motor de fuerza |
| A-7 | Versionado de assets disperso (`v46` ×3) | Media | Despliegues rotos / caché mezclada |
| A-8 | Backup no cubre el plan de rutinas | Alta | Pérdida de datos (ver SECURITY N-1) |
| A-9 | Código muerto (`#banner`) | Baja | Ruido; confunde a quien lee |

## 13. Posibles problemas futuros (arquitectónicos)

1. **Techo de escalabilidad de `ui.js`:** cada nueva pantalla/feature se añadirá ahí por
   inercia hasta hacerlo inmanejable.
2. **Sync imposible sin repositorio de sesiones:** el Sprint de Sincronización tropezará
   con la falta de una frontera dominio↔persistencia para sesiones.
3. **Divergencia de métricas:** al haber lógica duplicada (conteos de sesión, récords), dos
   pantallas pueden mostrar cifras distintas del mismo dato — erosiona la confianza (que el
   MANIFESTO pone en el centro).
4. **Migración de esquema a ciegas:** las migraciones v1→v4 no tienen tests; una v5 futura
   podría corromper datos sin que nadie lo note.

## 14. Recomendación arquitectónica (qué preparar, sin implementar aún)

En este orden (detallado en `PROJECT_AUDIT.md` → Sprints):
1. **Red de pruebas** sobre funciones puras (habilita todo lo demás).
2. **Invertir la dependencia UI↔lógica**: mover —sin reescribir— Progression/Records/
   Insights/métricas a motores; la UI solo consume.
3. **Un `StateRepository`** que unifique export/import de `state.v4` **y** `plan.v1`.
4. **Constante única `APP_VERSION`** que alimente `?v=`, `CACHE_VERSION` y `APP_SHELL`.
5. **Dividir `engine.js`** por cohesión (fuerza / formato / SVG) y trocear `ui.js`.

Ninguna de estas cambia el comportamiento observable: son movimientos de código
respaldados por pruebas. **No se autorizan hasta tener la red de pruebas (paso 1).**
