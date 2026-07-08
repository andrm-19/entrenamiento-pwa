# PROJECT_AUDIT.md — Auditoría Integral de Entreno V

> **Versión:** 2.0 (revisada en la Segunda Fase de Auditoría)
>
> **Fecha:** 2026-07-08
>
> **Tipo:** Auditoría de producto + técnica + UX (solo lectura, sin cambios de comportamiento)
>
> **Autor:** Auditoría de arquitectura (Principal Software Architect / Product Auditor / QA / Security)
>
> **Alcance:** Repositorio completo `entrenamiento-pwa` en el commit `0098004`
>
> **Rama:** `claude/entreno-v-audit-ojl63d`
>
> **Documentos especializados (Segunda Fase):**
> [`ARCHITECTURE_AUDIT.md`](./ARCHITECTURE_AUDIT.md) ·
> [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) ·
> [`PERFORMANCE_AUDIT.md`](./PERFORMANCE_AUDIT.md) ·
> [`UX_AUDIT.md`](./UX_AUDIT.md)
>
> ⚠️ **La [Segunda Fase](#segunda-fase-de-auditoría--validación-correcciones-y-preparación)
> corrige varios porcentajes y añade hallazgos que la v1.0 pasó por alto.** Donde haya
> discrepancia, **prevalece la Segunda Fase**.

---

## Cómo leer este documento

Este informe es el resultado de leer **todo** el código, toda la documentación
disponible y toda la estructura del proyecto, sin suponer nada. Está organizado
en las seis fases que pidió el encargo:

1. **[FASE 1 — Comprensión](#fase-1--comprensión-del-proyecto)** — qué existe realmente.
2. **[FASE 2 — Auditoría de Producto](#fase-2--auditoría-de-producto)** — código vs. documentación.
3. **[FASE 3 — Auditoría Técnica](#fase-3--auditoría-técnica)** — arquitectura, deuda, riesgos.
4. **[FASE 4 — Auditoría de UX](#fase-4--auditoría-de-ux)** — fidelidad a la filosofía.
5. **[FASE 5 — Product Breakdown Structure](#fase-5--product-breakdown-structure)** — estado por capacidad.
6. **[FASE 6 — Documentación](#fase-6--actualización-documental)** — qué se creó/actualizó.

Al final: **[Informe Ejecutivo](#informe-ejecutivo)** (5 preguntas) y
**[10 Sprints priorizados](#los-próximos-10-sprints)**.

Los documentos hermanos actualizados son:
[`PRODUCT_STATUS.md`](./PRODUCT_STATUS.md),
[`PRODUCT_BREAKDOWN_STRUCTURE.md`](./PRODUCT_BREAKDOWN_STRUCTURE.md),
[`DECISIONS_LOG.md`](./DECISIONS_LOG.md) y
[`CHANGELOG.md`](./CHANGELOG.md).

---

## Resumen en una página (TL;DR)

Entreno V es una **PWA offline-first de entrenamiento personal, en JavaScript
vanilla sin build**, que hoy **funciona y cubre el núcleo (Core) de forma sólida**:
planificación semanal, registro real de series (peso/reps/RIR/tipo), volumen y 1RM
en vivo, historial fechado durable, dashboard analítico rico, gamificación por datos,
un "Modo Coach" contextual y export/backup local. El producto está **notablemente
más avanzado de lo que reflejan sus propios documentos de estado** (que aún marcan
todo al 0%).

**Lo mejor construido:** el modelo de datos histórico (sesiones fechadas + doble
persistencia localStorage/IndexedDB), el motor de estadísticas/volumen (una única
primitiva `setsVolume`) y el Dashboard analítico.

**Los mayores riesgos:** (1) **cero pruebas automatizadas** pese a que los
Engineering Principles las exigen; (2) **la documentación fuente (MANIFESTO, MPS,
PED) no vive en el repositorio** — el código cita `§` de specs que nadie puede leer;
(3) `ui.js` (1 629 líneas) **mezcla render con lógica de negocio**, violando el
principio "la UI nunca calcula"; (4) el **Coach de "decisiones"** del manifiesto
(ejercicio ocupado, cansancio, sustituciones) **no existe** — solo hay pistas pasivas.

**Qué construir primero:** una **red de seguridad de pruebas** sobre los motores
puros y **anclar la documentación en el repo**, antes de abrir cualquier sprint de
funcionalidad nueva. Ver [10 Sprints](#los-próximos-10-sprints).

**Cercanía a la visión (Core del MANIFESTO):** ~**72 %** _(v1.0 decía 70 %; confirmado)_.
Cercanía a la visión total: ~**56 %** _(v1.0 decía 38 %; **corregido al alza**, ver §
[Segunda Fase](#segunda-fase-de-auditoría--validación-correcciones-y-preparación))_.

---

# Segunda Fase de Auditoría — Validación, correcciones y preparación

> Esta sección es el resultado de **releer críticamente la primera auditoría**, verificar
> afirmaciones contra el código y dejar el proyecto listo (o no) para nuevos Sprints. Es la
> parte con **mayor autoridad** del documento.

## FASE 1 · Correcciones a la primera auditoría

Releí la v1.0 asumiendo que podía haberme equivocado. Encontré y corrijo lo siguiente.

### A) Porcentajes mal justificados o inconsistentes

La v1.0 dio porcentajes sin una fórmula reproducible; además **contradecía su propio PBS**
(incluía Onboarding y Perfil dentro de "Core" pero puntuaba Core al 75 % ignorándolos).
Recalculo todo con un rúbrica explícita (ver [FASE 2](#fase-2--justificación-objetiva-del-product-status)):

| Módulo | v1.0 | v2.0 | Dirección | Motivo de la corrección |
|---|---|---|---|---|
| Core | 75 % | **60 %** | ↓ | Onboarding+Perfil (0 %) sí cuentan en el PBS; el *loop de entrenar* solo es 80 % |
| Dashboard | 85 % | **95 %** | ↑ | Estaba infravalorado; casi todas sus capacidades están implementadas |
| Coach | 45 % | **50 %** | ↑ | Mejor contado; matiz clave: la mitad de *decisiones* está al **10 %** |
| Gamificación | 80 % | **75 %** | ↓ | 6 de 8 capacidades (faltan insignias-sistema y temporadas) |
| Social | 0 % | **0 %** | = | Confirmado |
| Sincronización | 35 % | **40 %** | ↑ | Recontado sobre las 5 capacidades canónicas (2/5). Reclasificación (ver B) |
| Configuración | 75 % | **80 %** | ↑ | 9 de 11 capacidades implementadas |
| Infraestructura | 50 % | **45 %** | ↓ | 4/9; sin testing/CI/auditoría/versionado central |
| **Visión total** | 38 % | **56 %** | ↑ | 38 % era **demasiado pesimista**: Dashboard (95 %) pesa mucho |

### B) Reclasificaciones

- **Durabilidad local** (localStorage+IndexedDB) se contabiliza en **Infraestructura**, no
  en Sincronización (era ambiguo en v1.0).
- **Export CSV/PDF** se contabiliza en **Configuración/Datos**, no en Sincronización.
- Resultado: "Sincronización" mide ahora **solo** la sincronización real (multi-dispositivo/
  nube/conflictos), que es lo que exige la visión.

### C) Hallazgos que la primera auditoría PASÓ POR ALTO

Verificados en el código en esta fase (ver detalle en los documentos especializados):

| ID | Hallazgo nuevo | Severidad | Documento |
|---|---|---|---|
| **N-1** | El **respaldo JSON no incluye las rutinas personalizadas** (`plan.v1`) → pérdida de datos al restaurar en otro dispositivo | **Alta** | [SECURITY](./SECURITY_AUDIT.md#n-1--el-respaldo-no-incluye-las-rutinas-personalizadas--alta) |
| **N-2** | **Dos conteos divergentes** de "sesiones de la semana" (por checkbox *done* vs. por volumen) → cifras que pueden contradecirse | Media | [ARCHITECTURE §8](./ARCHITECTURE_AUDIT.md) |
| **N-3** | La superficie **XSS es más amplia** de lo reportado: también informe **PDF** (`ui.js:1216`), tabla de Progreso (`ui.js:1603`) y nota de récord (`ui.js:1597`) | Media→Crítica | [SECURITY S-1](./SECURITY_AUDIT.md#s-1--xss-almacenado-self-xss-en-el-render--media--crítica-con-syncsocial) |
| **N-4** | **Inyección de fórmulas CSV** en la exportación | Media | [SECURITY N-4](./SECURITY_AUDIT.md#n-4--inyección-de-fórmulas-en-csv--media) |
| **N-5** | **Código muerto**: `#banner` no existe en `index.html`; `renderBanner`/`dismissBanner`/`bannerHidden` son vestigiales | Baja | [ARCHITECTURE §10](./ARCHITECTURE_AUDIT.md) |
| **N-6** | Sin CSP + 31 `onclick` inline → impide endurecer con CSP estricta | Media | [SECURITY S-2](./SECURITY_AUDIT.md#s-2--sin-content-security-policy--manejadores-inline--media) |

### D) Lo que confirmo (la v1.0 acertó)

- "La UI calcula" (violación de capas), `ui.js` sobredimensionado, cero tests, MPS/PED
  fuera del repo, cache-busting manual, self-XSS base, SSOT de volumen correcto, excelente
  capa de persistencia, Coach sin decisiones. Todo **verificado y sostenido**.

---

## FASE 2 · Justificación objetiva del PRODUCT STATUS

**Rúbrica reproducible** (cualquier auditor puede recontar):

- Se enumeran las **capacidades hoja** de cada pilar (según el PBS actualizado).
- Cada capacidad puntúa por su estado: **⬜ = 0 · 🟡 = 0.5 · 🟢 = 1.0**.
- **Madurez de Implementación %** = `round( Σ puntos / nº capacidades × 100 )`.
- Mide **cuánto del alcance previsto está construido**, NO cuán lista para producción está.
  *(Producción es otro eje: todo el proyecto está topado en **Nivel 2 (Implementado)** por
  tener 0 pruebas — ver `PRODUCT_STATUS.md`.)*

| Pilar | Cálculo (Σ / N) | % |
|---|---|---|
| Core | 21.5 / 36 | **60 %** |
| — *sub: loop de entrenar (Rutinas+Ejercicios+Entreno+Historial)* | 21.5 / 27 | *80 %* |
| — *sub: Onboarding + Perfil* | 0 / 9 | *0 %* |
| Dashboard | 16.5 / 17 | **95 %** |
| Coach | 8.5 / 16 | **50 %** |
| — *sub: decisiones del Coach (ocupado/cansado/dolor/sustituir)* | 0.5 / 5 | *10 %* |
| Gamificación | 6 / 8 | **75 %** |
| Social | 0 / 12 | **0 %** |
| Sincronización (canónica: backup, restauración, multi, conflictos, auto) | 2 / 5 | **40 %** |
| Configuración | 9 / 11 | **80 %** |
| Infraestructura | 4 / 9 | **45 %** |

El desglose capacidad-por-capacidad (qué existe, qué falta, con qué estado) está en
[`PRODUCT_STATUS.md`](./PRODUCT_STATUS.md) y [`PRODUCT_BREAKDOWN_STRUCTURE.md`](./PRODUCT_BREAKDOWN_STRUCTURE.md),
ambos actualizados a esta rúbrica.

**Media no ponderada de los 8 pilares:** `(60+95+50+75+0+40+80+45)/8 = 56 %` → *visión total*.
**Media del núcleo** (Core, Dashboard, Coach, Gamificación, Configuración):
`(60+95+50+75+80)/5 = 72 %` → *cercanía al núcleo del MANIFESTO*.

---

## FASE 8 · Preparación para el desarrollo

### ¿Está Entreno V preparado para seguir desarrollándose? — **NO (todavía).**

**Justificación.** El producto **funciona y tiene una base valiosa**, pero **no es seguro
construir encima hoy** por tres condiciones simultáneas: (1) **0 pruebas**, (2) **lógica de
negocio mezclada en la UI y acoplada por globals**, y (3) un **fallo de pérdida de datos**
(N-1) y **XSS latente** (N-3) sin resolver. Añadir features sobre esta base multiplicaría la
deuda y el riesgo de regresión invisible. Se convierte en **SÍ** en cuanto se cierren S1–S3.

### ¿Qué problemas deben resolverse antes de crear nuevas funcionalidades? (orden de prioridad)

1. **Cero pruebas (A-3 / DT-1)** — sin red de seguridad, todo lo demás es a ciegas. *Bloqueante.*
2. **N-1: respaldo no incluye rutinas** — pérdida de datos real; erosiona la confianza. *Bloqueante.*
3. **N-3/S-1: XSS en render/PDF/tabla** — escapar campos editables antes de cualquier compartición. *Bloqueante para sync/social.*
4. **Documentación fuente (MPS/PED) fuera del repo (DT-2)** — sin ella no hay "código vs. intención".
5. **A-1/A-2: UI que calcula + acoplamiento por globals** — mover lógica a motores (con tests).
6. **N-2: conteos de sesión divergentes** — una sola fuente de verdad.
7. **DT-4/A-7: versionado disperso** — una constante `APP_VERSION`.

### ¿Cuál debería ser el Sprint 1 real?

**Sprint 1 = "Base segura para construir": red de pruebas + tapar las dos fugas de
confianza (N-1 y N-3), sin añadir ninguna funcionalidad nueva.**

- **Alcance:** (a) suite de pruebas unitarias sobre las funciones puras/motores
  (`setsVolume`, `epley1RM`, `linearTrend`, `progressScore`, `progressHealth`,
  `stagnationCount`, migraciones v1→v4, `weekVolume`); (b) **respaldo completo** que
  incluya `state.v4` **y** `plan.v1`; (c) **escapar** los campos editables en render, PDF y
  tabla. Todo respaldado por las pruebas de (a).
- **Por qué este y no una feature:** N-1 y N-3 son fallos que **ya afectan al usuario** y
  que empeoran con cada dato nuevo; y sin (a) no se puede refactorizar después con seguridad.
- **Encaje con la doc previa:** esto sustituye al "Sprint 1/2" de la v1.0 fusionando su
  parte crítica (pruebas + fix XSS) y **elevando N-1** al mismo nivel por ser pérdida de datos.

> Nota: los Sprints 2–10 de la v1.0 siguen vigentes, corridos una posición: tras esta base
> vienen *anclar MPS/PED + CI*, *extracción de motores*, etc. Ver
> [Los próximos 10 Sprints](#los-próximos-10-sprints) (siguen siendo válidos como backlog).

### ¿Cuál sería el mayor riesgo si empezáramos a desarrollar nuevas funciones hoy?

**Regresión silenciosa e irreversible.** Con estado global mutable, sin tests y con lógica
en la UI, un cambio para una feature nueva puede corromper el cálculo de volumen, récords o
las migraciones **sin que nadie lo note** hasta que un usuario pierda o vea mal sus datos.
En una app cuyo activo central es la **confianza** (MANIFESTO), ese es el peor desenlace.

### ¿Qué deuda técnica es imprescindible resolver?

**DT-1 (tests)**, **N-1 (respaldo completo)** y **N-3/S-1 (XSS)**. Sin estas tres, no se
autoriza desarrollo de features. **DT-2 (MPS/PED)** es imprescindible para la trazabilidad,
aunque no bloquea técnicamente.

### ¿Qué partes están mejor diseñadas?

1. **Capa de persistencia** (`DB`/`IDB` + reconciliación durable): inversión de dependencias
   real, tolerante a fallos. Es el patrón a imitar.
2. **Modelo de datos histórico** (sesiones fechadas + migraciones sin pérdida).
3. **Primitiva única de volumen** (`setsVolume`) y **diseño de eventos** (un listener
   delegado, sin fugas).
4. **Dashboard analítico** y **gamificación honesta** (fieles al manifiesto).

### ¿Qué partes deberían refactorizarse antes de crecer?

1. **`ui.js`**: separar render de lógica; mover Progression/Records/Insights/métricas a
   motores. (A-2)
2. **Comunicación entre módulos**: de globals mutables a interfaces explícitas. (A-1)
3. **Export/Import**: unificar en un `StateRepository` que cubra todo el estado (resuelve N-1).
4. **`engine.js`**: dividir por cohesión (fuerza / formato / SVG). (A-6)
5. **Versionado**: constante única `APP_VERSION`. (A-7)

**Todo lo anterior se documenta; nada se implementa en esta fase.**

---

# FASE 1 — Comprensión del proyecto

## 1.1 Qué es Entreno V

Una **aplicación web progresiva (PWA)** de entrenamiento de fuerza para uso
personal. Instalable, funciona **completamente sin conexión**, y **guarda todo
localmente** en el dispositivo del usuario (sin cuentas ni servidores). El plan
por defecto es una rutina semanal de 6 días (Tirón / Empuje / Pierna×2 / Torso +
2 descansos) con mapas musculares anatómicos en SVG.

## 1.2 Stack y forma de construcción

| Aspecto | Realidad observada |
|---|---|
| Lenguaje | JavaScript **vanilla** (ES2015+), sin TypeScript |
| Build | **Ninguno.** Scripts clásicos con `defer`, cargados en orden, **mismo scope global** |
| Framework | Ninguno (sin React/Vue/etc.). Render por plantillas de _template string_ + `innerHTML` |
| Dependencias | **Cero** dependencias de terceros. No hay `package.json`, `node_modules`, ni lockfile |
| Estilos | Un único `css/styles.css` (916 líneas), variables CSS, tema claro/oscuro, AMOLED |
| Persistencia | `localStorage` (espejo síncrono) + **IndexedDB** (fuente durable), clave-valor |
| PWA | `manifest.json` + `service-worker.js` (network-first para código, cache-first para estáticos) |
| Gráficas | **SVG generado a mano** (barras, área, curvas, heatmap). Sin librerías de charting |
| Pruebas | **Ninguna** (ni unitarias, ni E2E, ni framework de test) |
| CI/CD | No hay workflows en el repo. Despliegue manual por GitHub Pages (según README) |

## 1.3 Estructura de archivos (real)

```
entrenamiento-pwa/
├── index.html            # Shell: appbar, paneles (progreso/resumen/ajustes), tabbar, timer, diálogos, defs SVG
├── manifest.json         # Manifiesto PWA
├── service-worker.js     # Caché offline-first (CACHE_VERSION 'entrenoV-v46')
├── README.md             # Único doc en el repo antes de esta auditoría
├── .gitignore
├── assets/icon.svg       # Icono (único asset)
├── css/styles.css        # 916 líneas — toda la presentación
└── js/                   # 8 módulos, ~3 400 líneas, cargados EN ORDEN:
    ├── data.js       (171)  # 1. Datos del plan (SCHEDULE), utilidades de fecha/semana
    ├── store.js      (500)  # 2. Persistencia: DB/IDB, Store, RoutineRepository, migraciones v1→v4, consultas de histórico
    ├── engine.js     (435)  # 3. Dominio/servicios: volumen, 1RM, récords, timing de sesión, mapas SVG
    ├── dashboard.js  (262)  # Motor de analítica: Score, Salud, predicción/tendencias, timeline
    ├── gamification.js(213) # Motor de gamificación: XP, nivel, rachas, logros, objetivos, retos
    ├── coach.js      (141)  # Motor Coach: pistas contextuales, patrones, análisis de sesión
    ├── ui.js        (1629)  # 4. Interfaz: render, tracker, editor, paneles, ajustes, eventos, export + MUCHA lógica
    └── boot.js       (45)   # 5. Arranque: orden de inicialización
```

El orden de carga en `index.html` es **significativo** (no hay imports; todo
depende del scope global compartido): `data → store → engine → dashboard →
gamification → coach → ui → boot`.

## 1.4 Modelo de datos (esquema v4)

Clave principal `entrenoV.state.v4`. Migración en cadena documentada v1→v2→v3→v4
(las versiones antiguas **nunca se borran**: quedan como respaldo silencioso).

```
{
  schemaVersion: 4,
  ui:  { current, studyMode, bannerHidden, theme, restDefault, goals,
         unit, levelSeen, coachMode, objectives },
  sessions: {                        // ARCHIVADOR POR FECHA (nunca se borra)
    "YYYY-MM-DD": {
      dayType,                       // día de rutina (0–6)
      full:    { ex:{ "<slug>": { sets:[{w,reps,rir,type}], done, note } }, note },
      express: { ex:{ ... }, note },
      startedAt, finishedAt, snapshot,
      restMs,                        // descanso medido (Motor 2.0)
      state,                         // máquina de estados: preparado→en_curso→…
      updatedAt                      // base para sync/conflictos (aún sin usar)
    }
  },
  bests:  { "<dia>-<slug>": { w, reps, date } },   // récord con fecha
  legacyHistory: { "<weekId>": { volume, completed } }  // resúmenes v1 preservados
}
```

Además, dos claves auxiliares:
- `entrenoV.plan.v1` — **overrides de rutina** del usuario (editor), en localStorage + IndexedDB.
- En memoria, "mapas de trabajo" de la **semana actual** (`done`, `setsMap`, `notes`)
  con clave por **posición** `${x?}${dia}-${idx}`. Se hidratan desde `sessions` al
  cargar y se vuelcan al guardar. La traducción posición↔slug↔fecha vive en `store.js`.

## 1.5 Motores existentes (lo que hay dentro de la "inteligencia")

| Motor | Archivo | Estado real | Notas |
|---|---|---|---|
| **Statistics/Volume** | `engine.js` | Sólido | `setsVolume` es la única primitiva de volumen (buen SSOT). 1RM Epley, récords, timing |
| **Dashboard/Analytics** | `dashboard.js` | Sólido | Score 0–100 multifactor, Salud explicable, regresión lineal + confianza, timeline |
| **Gamification** | `gamification.js` | Sólido | XP por acciones con valor, nivel multifactor, rachas conscientes de descanso, retos autoadaptados |
| **Coach (pistas)** | `coach.js` | Parcial | Solo pistas pasivas por ejercicio + patrones + análisis. **Sin "decisiones" ni sustituciones** |
| **Progression** | en `ui.js` (¡!) | Parcial | Sobrecarga/estancamiento existe pero vive dentro de `ui.js`, no en un motor propio |
| **Sync** | comentarios/campos | Inexistente | Hay `updatedAt`/`state` "sync-ready" pero **no hay Sync Engine ni servidor** |
| **Social** | — | Inexistente | Ninguna línea de código |

## 1.6 Lo que NO existe (verificado, no supuesto)

- **Onboarding** de ningún tipo (bienvenida, configuración inicial, objetivos, nivel).
- **Perfil** de usuario (peso corporal, altura, edad, sexo, preferencias).
- **Biblioteca de ejercicios** independiente (crear/buscar/clasificar fuera del editor de rutina).
- **Coach de decisiones**: "ejercicio ocupado", "estoy cansado", "no me gusta este
  ejercicio", "dolor", **sustituciones** — nada de esto está implementado.
- **Social** completo (perfil público, entrenar juntos, comunidad).
- **Sincronización** real: multi-dispositivo, backup en la nube, resolución de
  conflictos, sync automático. Solo existe **respaldo/restauración por archivo JSON local**.
- **Notificaciones** (push o locales programadas).
- **Pruebas automatizadas** y **CI**.
- La **documentación fuente**: MANIFESTO, MPS (`ENTRENO V.md`), PED (`ENTRENO V NEXT.md`)
  **no están en el repositorio**, pese a que el código las cita por sección (`§`).

---

# FASE 2 — Auditoría de Producto

Comparación del estado real contra MANIFESTO, ENGINEERING_PRINCIPLES y el PBS.
Leyenda: ⬜ No iniciado · 🟡 Parcial · 🟢 Implementado · 🔵 Probado · ✅ Auditado · 🚀 Producción.

> **Nota sobre "🔵 Probado":** en este proyecto **ninguna** capacidad puede marcarse
> como Probada en el sentido de los Engineering Principles (pruebas automatizadas),
> porque no existen tests. Donde se ve funcionalidad estable y usada, se marca 🟢.

## 2.1 CORE — 🟢 Implementado (el corazón funciona)

| Capacidad | Estado | ¿Completo? | Qué falta / observaciones |
|---|---|---|---|
| Rutina semanal (plan por defecto) | 🟢 | Sí | 6 días con músculos, técnica, vídeo de apoyo |
| Editar rutina (renombrar/añadir/quitar/reordenar) | 🟢 | Casi | **No se editan los músculos `m`** → ejercicios nuevos sin mapa ni reparto muscular |
| Duplicar rutina a otro día | 🟢 | Sí | `routineDuplicateTo` |
| Restaurar plan original del día | 🟢 | Sí | `routineReset` |
| Crear/eliminar/reordenar ejercicios | 🟢 | Sí | Dentro del editor |
| Registrar series (peso/reps/RIR/tipo) | 🟢 | Sí | 9 tipos de serie; efectivas vs. calentamiento |
| Auto-guardado silencioso | 🟢 | Sí | Event delegation + debounce; sin botón "guardar" |
| Sesión con inicio/fin + recuperación | 🟢 | Sí | Máquina de estados; recupera entrenos sin finalizar |
| Historial fechado por ejercicio | 🟢 | Sí | Nunca se borra; curva de progreso por ejercicio |
| Modo Express / Estudio | 🟢 | Sí | Cambia el "schema" a la variante exprés |
| Onboarding | ⬜ | No | Inexistente |
| Perfil de usuario | ⬜ | No | Inexistente |
| Biblioteca de ejercicios (buscar/clasificar) | 🟡 | Parcial | Solo vía editor de rutina; sin búsqueda ni catálogo |

**Veredicto Core:** cumple el MANIFESTO ("el entrenamiento es más importante que la
app", control del usuario, auto-guardado invisible). El editor de rutina es un punto
fuerte. La ausencia de edición de músculos es la fisura funcional más visible.

## 2.2 DASHBOARD — 🟢 Implementado (muy completo)

Score de progreso (0–100, multifactor), estado de Salud explicable, comparativas
(vs. semana/4 sem/12 sem), tendencia por semana/mes/año, proyecciones con nivel de
confianza (regresión lineal + r²), predicción de 1RM, línea de tiempo, heatmap de
constancia, frecuencia muscular, récords históricos, progreso por ejercicio.

- **Cumple** el principio §20/§23 ("nunca un único dato"): Score y Salud combinan
  constancia, frecuencia, volumen, fuerza y objetivos.
- **Riesgo de sobrecarga cognitiva:** el panel Progreso es **muy largo** (≈20 secciones
  en un solo scroll). Ver [FASE 4](#fase-4--auditoría-de-ux).

## 2.3 COACH ENGINE — 🟡 Parcial (la mitad del concepto)

| Sub-capacidad (según docs) | Estado | Observación |
|---|---|---|
| Pistas contextuales durante el entreno | 🟢 | `coachCue`: series que faltan, superar última sesión, mejor volumen |
| Detección de patrones | 🟢 | Mejor día, descanso vs. rendimiento (con umbral de evidencia) |
| Análisis de sesión al cerrar | 🟢 | Mejor/peor que la última, fatiga por RIR |
| Sobrecarga progresiva / estancamiento | 🟢 | Existe, pero **vive en `ui.js`**, no en un motor |
| **Decisión: "ejercicio ocupado"** | ⬜ | No existe |
| **Decisión: "estoy cansado" / fatiga en vivo** | ⬜ | No existe como intervención |
| **Decisión: "no me gusta / dolor"** | ⬜ | No existe |
| **Sustitución de ejercicios** | ⬜ | No existe |
| Alertas (estancamiento/sobrecarga/recuperación) | 🟡 | Se muestran como texto en Dashboard/Salud, no como intervención Coach |
| Celebraciones (récord/objetivo/racha) | 🟢 | Confeti + toasts + subida de nivel |

**Cumple** la regla dura del manifiesto: **el Coach NO es un chatbot** — no hay caja
de texto ni pantalla de conversación; solo tarjetas/pistas/toasts. **No cumple** aún
la promesa del Coach que "propone alternativas" ante fricciones reales (ocupado,
cansancio, dolor). Esa es la mayor brecha producto↔visión.

## 2.4 GAMIFICACIÓN — 🟢 Implementado

Logros por datos reales, rachas conscientes de descanso (no castigan el descanso →
cumple el MANIFESTO "no castigará al usuario por descansar"), objetivos personales
configurables, retos del mes autoadaptados, nivel + XP. XP **solo se gana con
acciones con valor** (no por abrir la app) → cumple §33. Falta: temporadas.

## 2.5 SOCIAL — ⬜ No iniciado

Cero código. Es el pilar más lejano de la visión. Depende de autenticación y
sincronización, que tampoco existen. Riesgo de identidad: **el MANIFESTO prohíbe
feeds infinitos y vender datos**; cualquier construcción social deberá diseñarse con
esos límites por delante.

## 2.6 SINCRONIZACIÓN — 🟡 Parcial (solo local)

- ✅ **Backup/restauración por archivo** (JSON), con validación y confirmación.
- ✅ **Durabilidad local** doble (localStorage + IndexedDB con reconciliación).
- ✅ Export CSV y PDF (vía diálogo de impresión, sin librerías).
- ⬜ **Multi-dispositivo, nube, resolución de conflictos, sync automático:** no existen.
  El esquema está "sync-ready" (`updatedAt`, `state`) pero no hay motor ni servidor.

**Cumple** el principio "los datos pertenecen al usuario" y "entrenar nunca depende
de Internet". La visión multi-dispositivo está pendiente por completo.

## 2.7 CONFIGURACIÓN — 🟢 Implementado

Tema claro/oscuro, unidad kg/lb (datos siempre en kg), descanso por defecto, Modo
Coach on/off, metas semanales, objetivos personales, glosario, export/import. Falta:
notificaciones, privacidad explícita.

## 2.8 INFRAESTRUCTURA — 🟡 Parcial

Base de datos ✅ (kv sobre IDB/localStorage), motores ✅ (parcialmente separados),
caché ✅ (Service Worker). **Falta: logs, auditoría interna y testing.**

---

# FASE 3 — Auditoría Técnica

## 3.1 Arquitectura y separación de responsabilidades

Los Engineering Principles definen capas `UI → Application → Engines → Repositories
→ Persistence`, donde **"la UI nunca calcula, nunca interpreta, nunca decide"**.

**Realidad:**

- ✅ La **persistencia está bien aislada**: `DB` (localStorage) e `IDB` (IndexedDB)
  son adaptadores; migrar a stores relacionales es reimplementar ahí sin tocar el
  dominio (inversión de dependencias real).
- ✅ Existe **un `RoutineRepository`** como único punto de acceso a los overrides de
  rutina. Buen patrón.
- 🟡 Los motores están **parcialmente** separados por archivo (dashboard, gamification,
  coach). Pero se comunican por **scope global mutable**, no por interfaces — cualquier
  archivo puede leer/escribir `sessions`, `setsMap`, `goals`, etc.
- 🔴 **La UI calcula.** `ui.js` contiene lógica de negocio pesada que, por los propios
  principios, debería vivir en motores: `progressionSuggest` / `stagnationCount`
  (Progression Engine), `globalRecords`, `weeklyMetrics`, `consistencyStats`,
  `muscleSetsThisWeek`, `buildInsights`, `sessionInsights`. Esto **viola el principio
  "UI no calcula"** y es la mayor deuda arquitectónica.
- 🟡 **No hay Repository de sesiones.** `Store` accede directamente al estado; el
  histórico se consulta con funciones sueltas en `store.js`. Funciona, pero no hay una
  frontera clara "dominio ↔ persistencia" para las sesiones como sí la hay para rutinas.

## 3.2 Acoplamiento y modularidad

- **Acoplamiento por variables globales:** todos los módulos comparten `sessions`,
  `bests`, `setsMap`, `done`, `notes`, `current`, `goals`, `unit`, `theme`,
  `coachMode`, `objectives`, `levelSeen`, `SCHEDULE`, etc. El orden de carga es un
  contrato implícito y frágil. Un rename descuidado rompe silenciosamente en runtime
  (sin tipos ni build que avisen).
- **Cohesión desigual:** `engine.js` mezcla dominio de fuerza (volumen/1RM) con
  utilidades de formato (`fmtKg`, `escapeHtml`) **y** generación de SVG anatómico.
  Son tres responsabilidades distintas en un archivo.
- **`ui.js` (1 629 líneas)** es el archivo de mayor riesgo: render + eventos + editor +
  ajustes + export + lógica. Debería trocearse.

## 3.3 Rendimiento

- ✅ Interacciones inmediatas: auto-guardado con `debounce(400ms)`; barras de progreso
  animadas con `transform` (no `width`) pensando en 120 Hz.
- 🟡 **Re-render por `innerHTML` completo** del día y del panel Progreso. Para volúmenes
  de datos personales (meses de sesiones) es aceptable, pero el panel Progreso
  reconstruye ≈20 secciones y **recorre todo el histórico varias veces** por render
  (`weeklyVolumes`, `monthlyVolumes`, `globalRecords`, etc. iteran `sessions` de forma
  repetida). A gran escala (años de datos) esto será perceptible. No hay caché de
  agregados.
- 🟡 `now`, `monday`, `todayDow`, `weekId()` se calculan **una vez al cargar**. Una
  sesión abierta que cruza medianoche/cambio de semana queda con fechas desfasadas.

## 3.4 Duplicación de lógica

- 🟡 **Varias familias de "volumen"**: `setsVolume` (primitiva, SSOT ✅) pero encima
  hay `dayVolume`, `dayVolumeAnyMode`, `weekVolume`, `sessionVolume`, `weeklyVolumes`,
  `monthlyVolumes`, `yearlyVolumes`, `muscleVolumeThisWeek`, `dayMuscleVolume`. La
  primitiva es única (bien), pero las agregaciones se solapan y se recalculan sin caché.
- 🟡 **Récords calculados en dos sitios**: el mapa `bests` (en vivo) y `globalRecords`
  (recorrido del histórico). Coexisten con criterios ligeramente distintos.
- 🟡 **Racha (streak)** se calcula en `consistencyStats`, `goalStreakWeeks` y
  `globalRecords` con lógicas parecidas pero no idénticas → riesgo de inconsistencia.
- 🟡 **Parsers de string repetidos** (`parseFirstInt`, `parseRepsRange`,
  `parseRestSeconds`) que interpretan campos de texto libre del plan ("8–12", "2 min").

## 3.5 Persistencia y Offline First

- ✅ **Offline First real:** todo lo crítico funciona sin red; el Service Worker cae a
  caché; la app corre incluso bajo `file://` (sin SW).
- ✅ **Doble durabilidad** con reconciliación (IndexedDB salva si localStorage se limpia).
- 🟡 **Cache-busting manual y disperso:** la versión `46` está hardcodeada en
  `index.html` (`?v=46` ×8), en `service-worker.js` (`CACHE_VERSION` + `APP_SHELL`) y
  el `?v=` de CSS. Es fácil desincronizar y **fijar una versión rota** o servir mezcla
  de versiones. Debería derivarse de una sola constante.
- 🟡 **Fragilidad posición↔slug:** los mapas de trabajo usan índices de posición; si el
  usuario **edita la rutina a mitad de semana** (reordena/elimina), la hidratación por
  índice puede reasignar series a otro ejercicio. Los ids mitigan mucho, pero el camino
  índice→slug en `hydrateWorkingMaps` depende del orden actual del `SCHEDULE`.

## 3.6 Seguridad

Superficie mínima (app local, sin backend, sin datos de terceros). Aun así:

- 🟡 **Self-XSS almacenado (bajo impacto):** en `render()` los campos editables por el
  usuario se insertan en `innerHTML` **sin escapar**: nombre de ejercicio `e.n`
  (`ui.js:61`), `day.type`/`day.sub` (`ui.js:88-89`), énfasis `e.p`. El editor guarda
  con `escapeAttr` (en `value=`), pero el render los pinta crudos. Un nombre como
  `<img src=x onerror=...>` ejecutaría script. Como es un único usuario en su propio
  dispositivo, el impacto es bajo, **pero** se vuelve relevante en cuanto exista
  importación/compartición de rutinas o sincronización. **Debe corregirse** antes de
  cualquier feature social/sync.
- ✅ El resto de inserciones dinámicas de texto libre (notas, feedback) sí usan
  `escapeHtml`.
- ✅ No hay `eval`, ni `innerHTML` con datos de red, ni secretos en el repo.

## 3.7 Mantenibilidad y testing

- 🔴 **Cero pruebas.** Los Engineering Principles exigen: "Todo Engine deberá tener
  pruebas… cálculos, errores, casos límite, rendimiento, regresiones." **Incumplido al
  100 %.** Es el riesgo de mantenibilidad número uno: cualquier refactor (necesario,
  ver 3.2) se hace **a ciegas**.
- 🟡 **Sin tipos** (JS puro). Hay `@typedef` JSDoc en `store.js` (buena intención) pero
  no se aplican ni verifican.
- ✅ **Comentarios excelentes**: el código está muy bien documentado en español,
  explicando el porqué de cada decisión y citando specs. Es su mayor activo de
  mantenibilidad hoy.
- 🔴 **Las specs citadas no existen en el repo.** Un `§56` o `§71` no es verificable:
  no hay documento que leer. La trazabilidad está rota.

## 3.8 Deuda técnica (registro)

| # | Descripción | Impacto | Prioridad | Sprint sugerido |
|---|---|---|---|---|
| DT-1 | **Sin pruebas** de ningún motor | Crítico: refactors a ciegas, regresiones invisibles | Crítica | S1 |
| DT-2 | **Documentación fuente (MANIFESTO/MPS/PED) fuera del repo**; specs `§` no verificables | Alto: trazabilidad rota, onboarding de devs/IA imposible | Crítica | S2 |
| DT-3 | **`ui.js` mezcla render + lógica**; "UI calcula" | Alto: viola principios, dificulta test y evolución | Alta | S3 |
| DT-4 | **Cache-busting manual disperso** (v46 en 3 sitios) | Medio: despliegues rotos / versiones mezcladas | Alta | S3 |
| DT-5 | **Self-XSS** en render de campos editables | Medio (hoy bajo; alto si llega sync/social) | Alta | S1 |
| DT-6 | **Sin caché de agregados**; histórico recorrido N veces por render | Medio: degrada con años de datos | Media | S6 |
| DT-7 | **Editor no edita músculos `m`** de un ejercicio | Medio: ejercicios nuevos sin mapa/reparto | Media | S4 |
| DT-8 | **Fecha/semana congeladas al cargar** (cruce de medianoche) | Bajo | Baja | S6 |
| DT-9 | **Duplicación de streak/récords** en 3 funciones | Bajo/Medio: inconsistencias sutiles | Media | S3 |
| DT-10 | **Sin CI** (lint, test, validación de manifest/SW) | Medio | Alta | S2 |
| **N-1** | **Respaldo no incluye rutinas personalizadas** (`plan.v1`) → pérdida de datos | Alto | **Crítica** | S1 |
| **N-2** | **Dos conteos divergentes** de sesiones/semana (done vs. volumen) | Medio | Media | S3 |
| **N-3** | **XSS más amplio**: render + informe PDF + tabla Progreso | Medio (→Alto con sync) | Alta | S1 |
| **N-4** | **Inyección de fórmulas CSV** en la exportación | Medio | Media | S1 |
| **N-5** | **Código muerto** (`#banner`/`renderBanner`/`dismissBanner`) | Bajo | Baja | S3 |
| **N-6** | **Sin CSP** + 31 `onclick` inline (impide CSP estricta) | Medio | Media | S3 |

> **Nota (Segunda Fase):** DT-5 (self-XSS) se amplía con **N-3** (afecta también al informe
> PDF y a la tabla de Progreso, no solo al render del día). Detalle en
> [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

## 3.9 Riesgos y posibles errores futuros

1. **Regresión silenciosa** por scope global + sin tests: el mayor peligro operativo.
2. **Caché envenenada** por desincronización de versiones (mitigado parcialmente por
   la autorecarga del SW, pero el mecanismo manual es frágil).
3. **Corrupción sutil de datos** al editar rutina a mitad de semana (posición↔slug).
4. **Crecimiento de `ui.js`** hasta hacerse inmanejable si se siguen añadiendo features ahí.
5. **Divergencia doc↔código** que ya ocurrió (PRODUCT_STATUS al 0 % con producto al 70 %).
6. **Deriva de identidad** al construir Social sin los límites del MANIFESTO por delante.

---

# FASE 4 — Auditoría de UX

Evaluación contra la filosofía: simplicidad, fluidez, control del usuario, Coach no
intrusivo, "la app desaparece cuando termina el entrenamiento".

## Lo que cumple muy bien

- ✅ **Una mano / pulgar:** navegación inferior (tabbar), timer flotante, steppers −/+
  grandes. Pensado para usar entrenando.
- ✅ **Auto-guardado invisible:** sin botón "guardar"; refuerza "el entrenamiento es lo
  importante".
- ✅ **El Coach nunca es un chatbot:** cumplido de forma estricta (sin caja de texto).
- ✅ **El usuario tiene el control:** el Coach **propone**, no cambia nada solo; el
  editor permite restaurar el plan; nada se borra.
- ✅ **No castiga el descanso:** rachas por semana, días de descanso no rompen racha.
- ✅ **Accesibilidad de base:** `aria-label` extensos, roles, `aria-live` en timer/toast,
  tema claro/oscuro, respeta `viewport-fit=cover`.
- ✅ **Feedback moderno:** toasts y diálogo propio en vez de `alert/confirm`.

## Fricciones y riesgos de UX

- 🟡 **Sobrecarga cognitiva en Progreso:** ≈20 secciones en un scroll (Score, Salud,
  resumen, insights, metas, objetivos, retos, intensidad, comparativas, gráfica,
  proyección, patrones, progreso por ejercicio, constancia, timeline, nivel, logros,
  volumen día, volumen músculo, frecuencia, récords, tabla). Choca con "simplicidad" y
  "la inteligencia no compite por la atención". **Candidato a jerarquizar/colapsar.**
- 🟡 **"La app desaparece cuando termina el entrenamiento":** parcialmente. Al finalizar
  se abre un buen resumen, pero no hay un cierre que "guarde y salga"; el usuario queda
  en la misma vista densa.
- 🟡 **Sin onboarding:** un usuario nuevo aterriza directamente en la rutina por defecto
  sin explicación ni configuración de objetivos/nivel. El MANIFESTO/PBS lo prevén.
- 🟡 **Densidad de la tarjeta de ejercicio:** última vez + sobrecarga + coach + series +
  récord + 1RM + historial + nota + vídeo. Es potente pero **muy cargada**; verificar
  que no distraiga durante la serie.
- 🟡 **Accesibilidad a validar:** contraste real de los colores musculares sobre AMOLED,
  tamaño de fuente dinámico, y foco de teclado en el editor no están verificados (no hay
  pruebas de accesibilidad).

**Veredicto UX:** la experiencia **respeta la filosofía** en lo esencial (control,
Coach no intrusivo, offline, no adicción). El principal desvío es la **densidad del
Dashboard**, que empuja hacia la sobrecarga que el propio producto dice evitar.

---

# FASE 5 — Product Breakdown Structure

El PBS completo, con el estado real de cada capacidad, se ha volcado al documento
[`PRODUCT_BREAKDOWN_STRUCTURE.md`](./PRODUCT_BREAKDOWN_STRUCTURE.md) (actualizado).
Resumen por pilar:

| Pilar | Estado global | Madurez aprox. |
|---|---|---|
| Core | 🟢 Implementado | 75 % |
| Dashboard | 🟢 Implementado | 85 % |
| Coach | 🟡 Parcial | 45 % |
| Gamificación | 🟢 Implementado | 80 % |
| Social | ⬜ No iniciado | 0 % |
| Sincronización | 🟡 Parcial (solo local) | 35 % |
| Configuración | 🟢 Implementado | 75 % |
| Infraestructura | 🟡 Parcial | 50 % (sin testing/CI) |

**Capacidades nuevas descubiertas (no estaban en el PBS original)** — añadidas al PBS:
Modo Express/Estudio, 1RM estimado (Epley), cronómetro de descanso con pausa/silencio,
mapas musculares SVG, export PDF/CSV, Score de progreso, Salud del progreso,
predicciones con confianza, detección de patrones, heatmap de constancia, línea de
tiempo, retos del mes, nivel/XP, análisis de sesión, recuperación de sesión sin
finalizar, tipos de serie avanzados.

**Capacidades del PBS aún inexistentes:** todo Onboarding, todo Perfil, todo Social,
Sync multi-dispositivo, biblioteca de ejercicios independiente, notificaciones,
temporadas de gamificación, y las **decisiones del Coach** (ocupado/cansado/dolor/sustituir).

**Obsoletas a proponer eliminar:** ninguna. No se detectó código muerto de peso; la
limpieza de selectores CSS y del calendario ya se hizo en commits previos.

---

# FASE 6 — Actualización documental

Esta auditoría crea/actualiza, dentro de `docs/`, la **fuente oficial** del proyecto:

- **`PROJECT_AUDIT.md`** (este documento) — nuevo.
- **`PRODUCT_STATUS.md`** — actualizado con estados y porcentajes **reales**.
- **`PRODUCT_BREAKDOWN_STRUCTURE.md`** — actualizado con el estado real por capacidad y
  las capacidades nuevas descubiertas.
- **`DECISIONS_LOG.md`** — nuevo: registro de las decisiones arquitectónicas observadas.
- **`CHANGELOG.md`** — nuevo: historia reconstruida desde git.
- **`MANIFESTO.md`** y **`ENGINEERING_PRINCIPLES.md`** — anclados en el repo (antes solo
  existían como borradores externos), para que el repositorio sea **auto-contenido**.
- **`README.md`** (índice de `docs/`) — nuevo.

**Pendiente de aportar por el equipo (bloqueante para trazabilidad):** los documentos
**MPS (`ENTRENO V.md`)** y **PED (`ENTRENO V NEXT.md`)** que el código cita por `§`.
Sin ellos, la numeración de specs no es verificable (ver DT-2).

No se modificó **ningún** archivo de código ni el comportamiento de la app, conforme a
las restricciones del encargo.

---

# Informe Ejecutivo

### 1. ¿Qué tan cerca está Entreno V de su visión?

- **Del núcleo del MANIFESTO (entrenar mejor, offline, datos del usuario, Coach no
  intrusivo, no adicción): ~72 %** _(media de los 5 pilares del núcleo; ver rúbrica en la
  Segunda Fase)_. El producto ya cumple su promesa central para un usuario individual.
- **De la visión completa (los 8 pilares, incl. Social, multi-dispositivo, Onboarding,
  Coach de decisiones): ~56 %** _(corregido desde el ~38 % de la v1.0, que era demasiado
  pesimista: el Dashboard al 95 % pesa mucho)_. Faltan pilares enteros.

### 2. ¿Cuáles son los mayores riesgos?

1. **Ausencia total de pruebas** (DT-1): cualquier evolución es a ciegas.
2. **Documentación fuente fuera del repo** (DT-2): sin MPS/PED, la trazabilidad `§` es
   ficticia y no se puede validar "código vs. intención".
3. **`ui.js` como cajón de sastre** (DT-3): render y lógica mezclados; crecerá hasta
   ser inmanejable.
4. **Fragilidad operativa**: cache-busting manual (DT-4) y self-XSS latente (DT-5) que
   se vuelve peligroso en cuanto llegue sync/social.

### 3. ¿Qué partes están mejor construidas?

- El **modelo de datos histórico** (sesiones fechadas + migraciones v1→v4 sin pérdida +
  doble durabilidad con reconciliación).
- El **motor de estadísticas/volumen** (una única primitiva `setsVolume`).
- El **Dashboard analítico** y la **gamificación por datos reales** (rica, honesta,
  fiel al manifiesto).
- La **calidad de los comentarios**: el código se explica a sí mismo.

### 4. ¿Qué partes deberían rehacerse (o reubicarse)?

- **Extraer la lógica de `ui.js`** a motores (`Progression`, `Stats`, `Records`,
  `Insights`) — no reescribir la lógica, **moverla** y darle pruebas.
- **Unificar cálculos duplicados** de streak/récords/agregados detrás de un motor con
  caché (DT-6/DT-9).
- **Centralizar el versionado** de assets/SW en una sola constante (DT-4).
- **Escapar el render** de campos editables (DT-5).

### 5. ¿Qué deberíamos construir primero?

**Nada de funcionalidad nueva todavía.** Primero: (S1) **red de pruebas** sobre los
motores puros + fix del self-XSS; (S2) **anclar la documentación** (traer MPS/PED,
añadir CI). Solo con esa base es seguro abrir (S3) la **extracción de motores** y luego
las features de producto. El orden exacto está en la tabla siguiente.

---

# Los próximos 10 Sprints

Priorizados. Los primeros consolidan la base (la auditoría **no autoriza features
nuevas hasta cerrar S1–S3**); los siguientes retoman producto en orden de valor/riesgo.

### Sprint 1 — Red de seguridad de pruebas + fix self-XSS `[Fundacional · Crítico]`
- **Objetivo:** cubrir con tests unitarios los motores puros (`setsVolume`, `epley1RM`,
  `linearTrend`, `progressScore`, `progressHealth`, `stagnationCount`, migraciones
  v1→v4) y escapar los campos editables en `render()`.
- **Justificación:** Engineering Principles exigen pruebas; hoy hay 0. Sin esta red,
  cualquier refactor posterior es peligroso.
- **Dependencias:** ninguna (elegir runner sin build, p. ej. tests en el navegador o
  Node + módulos exportables mínimos).
- **Riesgos:** el scope global dificulta importar funciones; puede requerir exponerlas
  para test sin romper el runtime.
- **Valor:** protege todo lo demás. Habilita refactors seguros.

### Sprint 2 — Anclar documentación + CI mínima `[Fundacional · Crítico]`
- **Objetivo:** traer al repo MPS (`ENTRENO V.md`) y PED (`ENTRENO V NEXT.md`),
  enlazar la numeración `§`, y añadir un workflow que corra los tests de S1 + validación
  de `manifest.json`/SW y un lint básico.
- **Justificación:** restablece la trazabilidad "código ↔ intención" (DT-2) y evita
  regresiones en cada push (DT-10).
- **Dependencias:** S1 (para que CI tenga tests que correr); requiere que el equipo
  aporte MPS/PED.
- **Riesgos:** MPS/PED podrían no existir aún en forma final.
- **Valor:** un dev o IA nuevo puede entender el proyecto solo con el repo.

### Sprint 3 — Extracción de motores desde `ui.js` + versión única `[Refactor seguro]`
- **Objetivo:** mover `progressionSuggest`/`stagnationCount` → `ProgressionEngine`;
  `globalRecords`/`weeklyMetrics`/`consistencyStats`/`buildInsights` → motores
  correspondientes; unificar cálculo de racha; centralizar `APP_VERSION` en una
  constante que alimente `?v=`, `CACHE_VERSION` y `APP_SHELL`.
- **Justificación:** cumple "la UI no calcula" (DT-3), elimina duplicación (DT-9),
  arregla el cache-busting (DT-4). **Comportamiento idéntico**, respaldado por tests de S1.
- **Dependencias:** S1, S2.
- **Riesgos:** el scope global hace el "mover" delicado; mitigado por tests.
- **Valor:** base mantenible por años (Principio Final del proyecto).

### Sprint 4 — Cerrar el Core: editar músculos + biblioteca mínima `[Producto]`
- **Objetivo:** permitir editar los músculos `m` de un ejercicio en el editor (con
  selector visual del mapa) y un catálogo/búsqueda simple de ejercicios reutilizables.
- **Justificación:** cierra la fisura funcional del Core (DT-7); habilita mapas/reparto
  correctos para ejercicios creados por el usuario.
- **Dependencias:** S3 (editor y dominio limpios).
- **Riesgos:** UX del selector muscular en móvil.
- **Valor:** rutinas personalizadas realmente completas.

### Sprint 5 — Coach de decisiones (intervenciones contextuales) `[Producto · Alto valor]`
- **Objetivo:** implementar las intervenciones del MANIFESTO: "ejercicio ocupado",
  "estoy cansado", "dolor/no me gusta" → **sugerencia de sustitución** (por grupo
  muscular/equipamiento) mediante bottom sheet, sin chat, sin cambiar nada sin permiso.
- **Justificación:** es la mayor brecha producto↔visión del Coach (§2.3).
- **Dependencias:** S3, S4 (catálogo de ejercicios para sustituir).
- **Riesgos:** calidad de las sustituciones; mantener la regla "propone, no impone".
- **Valor:** el Coach por fin "ayuda a decidir" en fricciones reales.

### Sprint 6 — Rendimiento del Dashboard: caché de agregados `[Técnico]`
- **Objetivo:** cachear agregados del histórico (volúmenes por semana/mes/año, récords,
  rachas) e invalidar al guardar; recalcular fecha/semana si cambia el día.
- **Justificación:** DT-6 y DT-8; el panel Progreso escalará a años de datos.
- **Dependencias:** S3.
- **Riesgos:** invalidación de caché correcta.
- **Valor:** fluidez sostenida a largo plazo.

### Sprint 7 — Onboarding + Perfil `[Producto]`
- **Objetivo:** bienvenida breve, configuración inicial (objetivo, nivel, frecuencia) y
  perfil (peso corporal, altura, edad, sexo, preferencias) — todo local y opcional.
- **Justificación:** pilares del PBS hoy inexistentes; personaliza Score/metas/Coach.
- **Dependencias:** S3.
- **Riesgos:** no romper "la app desaparece" con un onboarding pesado; mantenerlo mínimo.
- **Valor:** mejor primera experiencia y recomendaciones más precisas.

### Sprint 8 — Simplificación/jerarquía del Dashboard `[UX]`
- **Objetivo:** reorganizar Progreso en niveles (Nivel 1 visible: Score+Salud+3 datos;
  el resto colapsable/bajo demanda), reduciendo la sobrecarga cognitiva.
- **Justificación:** desvío UX principal (§FASE 4); alinea con "simplicidad" y "la
  inteligencia no compite por la atención".
- **Dependencias:** ninguna dura (mejor tras S3).
- **Riesgos:** decidir qué se oculta sin perder valor percibido.
- **Valor:** experiencia más calmada, fiel al manifiesto.

### Sprint 9 — Sincronización multi-dispositivo (opcional, cifrada) `[Producto · Complejo]`
- **Objetivo:** sync opcional end-to-end (backup en nube + multi-dispositivo +
  resolución de conflictos por `updatedAt`), respetando "los datos son del usuario" y
  "entrenar nunca depende de Internet".
- **Justificación:** completa el pilar Sincronización; el esquema ya está "sync-ready".
- **Dependencias:** S1 (tests de conflictos), S3, y S5 corregido (self-XSS ya no latente).
- **Riesgos:** privacidad, coste de backend, complejidad de conflictos. **Alto.**
- **Valor:** continuidad entre dispositivos sin traicionar la privacidad.

### Sprint 10 — Social mínimo, con límites del MANIFESTO `[Producto · Estratégico]`
- **Objetivo:** perfil público opcional + "entrenar juntos" (disponibilidad/solicitud),
  **sin feeds infinitos, sin venta de datos, sin métricas de vanidad**.
- **Justificación:** último pilar del PBS; máximo riesgo de deriva de identidad → se
  hace al final y con guardarraíles explícitos.
- **Dependencias:** S7 (perfil), S9 (auth/sync).
- **Riesgos:** el más alto en identidad de producto y en privacidad.
- **Valor:** comunidad alineada con la filosofía, no con la retención.

---

## Anexo A — Checklist de cierre de esta auditoría

- [x] Se leyó todo el código y toda la documentación disponible.
- [x] Se identificó lo que existe, lo parcial y lo inexistente (sin suponer).
- [x] Se comparó el estado real contra MANIFESTO / ENGINEERING_PRINCIPLES / PBS.
- [x] Se identificaron deuda técnica, riesgos y errores futuros (sin resolverlos aún).
- [x] Se auditó la UX contra la filosofía.
- [x] Se clasificó cada capacidad en el PBS y se añadieron las nuevas.
- [x] Se actualizó/creó la documentación oficial en `docs/`.
- [x] Se produjeron el informe ejecutivo y los 10 sprints priorizados.
- [x] **No** se implementaron funcionalidades ni se cambió el comportamiento.
- [ ] **Pendiente del equipo:** aportar MPS (`ENTRENO V.md`) y PED (`ENTRENO V NEXT.md`).

## Anexo B — Referencias de código citadas

| Hallazgo | Ubicación |
|---|---|
| Primitiva única de volumen | `js/engine.js:39` (`setsVolume`) |
| 1RM Epley | `js/ui.js:260` (`epley1RM`) |
| Self-XSS en render | `js/ui.js:61`, `js/ui.js:88-89` |
| UI que calcula (Progression) | `js/ui.js:170` (`progressionSuggest`), `js/ui.js:161` (`stagnationCount`) |
| UI que calcula (agregados) | `js/ui.js:1457` (`globalRecords`), `js/ui.js:1391` (`weeklyMetrics`), `js/ui.js:1305` (`consistencyStats`) |
| Cache-busting manual | `index.html:18,117-124`, `service-worker.js:18,19-33` |
| Adaptadores de persistencia | `js/store.js:59` (`DB`), `js/store.js:73` (`IDB`) |
| Reconciliación durable | `js/store.js:150` (`reconcileDurable`) |
| Migraciones de esquema | `js/store.js:123` (`load`), `js/store.js:384` (`migrateV1toV2`) |
| Coach = no chatbot | `js/coach.js` (solo pistas/toasts, sin caja de texto) |
