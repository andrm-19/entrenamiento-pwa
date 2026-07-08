# DECISIONS_LOG.md — Registro de Decisiones de Arquitectura (ADR)

> **Versión:** 1.1 (ampliado por Auditoría #2 con ADR-015…017)
>
> **Fecha:** 2026-07-08
>
> **Propósito:** Documentar las decisiones técnicas **ya tomadas** en Entreno V (leídas
> del código y del historial), para que cualquier desarrollador o IA entienda **por qué**
> el proyecto es como es antes de cambiarlo. No propone cambios; describe el estado.

Cada decisión: contexto → decisión → consecuencias. Las marcadas con ⚠️ tienen deuda
técnica asociada (ver [`PROJECT_AUDIT.md` §3.8](./PROJECT_AUDIT.md#38-deuda-técnica-registro)).

---

## ADR-001 · JavaScript vanilla sin build

- **Contexto:** app personal, offline-first, desplegable en GitHub Pages sin tooling.
- **Decisión:** cero dependencias, sin bundler, sin transpilación. Scripts clásicos con
  `defer` cargados en orden, compartiendo **scope global**.
- **Consecuencias:** ✅ despliegue trivial, arranque instantáneo, nada que auditar en
  supply-chain. ⚠️ sin imports/tipos: el orden de carga es un contrato implícito y frágil;
  dificulta el testing y hace los refactors delicados (ADR-011).

## ADR-002 · Offline First como requisito duro

- **Contexto:** "entrenar nunca dependerá de Internet" (MANIFESTO / ENGINEERING_PRINCIPLES).
- **Decisión:** toda función crítica opera sin red; Service Worker con **network-first**
  para código (para que los despliegues lleguen) y **cache-first** para estáticos.
- **Consecuencias:** ✅ la app funciona sin conexión e incluso bajo `file://` (sin SW).
  La red-first evita fijar versiones rotas.

## ADR-003 · Persistencia local, propiedad del usuario

- **Contexto:** "los datos pertenecen al usuario" (MANIFESTO).
- **Decisión:** todo se guarda **en el dispositivo**. Sin cuentas ni servidor. El servidor
  (futuro) solo tocaría auth/sync/social, nunca el progreso.
- **Consecuencias:** ✅ privacidad por diseño. ⬜ multi-dispositivo y nube quedan como
  trabajo futuro (pilar Sincronización).

## ADR-004 · Doble durabilidad: localStorage (espejo) + IndexedDB (fuente durable)

- **Contexto:** localStorage puede borrarse por limpieza ligera del navegador o desalojo.
- **Decisión:** IndexedDB como **fuente durable** (almacén clave-valor), localStorage como
  **espejo síncrono** para arranque sin parpadeo, respaldo y export. Reconciliación al
  arrancar (`Store.reconcileDurable`): si localStorage se limpió, IndexedDB restaura.
- **Consecuencias:** ✅ resistencia real a pérdida de datos. Adaptadores `DB`/`IDB`
  aíslan la persistencia (inversión de dependencias): migrar a stores relacionales es
  reimplementar ahí sin tocar dominio.

## ADR-005 · Modelo "archivador por fecha" (esquema evolutivo v1→v4)

- **Contexto:** la v1 borraba la semana al cambiar (solo dejaba un resumen).
- **Decisión:** `sessions` indexado por `YYYY-MM-DD` que **nunca se borra**; migración en
  cadena v1→v2→v3→v4 preservando siempre las versiones anteriores como respaldo silencioso.
- **Consecuencias:** ✅ historial real, récords con fecha, tendencias. La migración "no
  inventa datos": lo que la v1 no guardó queda sin fecha, no se fabrica.

## ADR-006 · Ids estables por slug + mapas de trabajo por posición

- **Contexto:** renombrar un ejercicio no debe romper su historial.
- **Decisión:** cada ejercicio tiene un `id` (slug congelado). El histórico se indexa por
  `id`. La **semana en curso** se edita en "mapas de trabajo" por **posición**
  (`${x?}${dia}-${idx}`), que se hidratan desde/hacia `sessions`.
- **Consecuencias:** ✅ el rename no rompe el historial. ⚠️ editar la rutina a mitad de
  semana (reordenar/eliminar) puede reasignar series por índice durante la hidratación
  (DT — riesgo de integridad sutil).

## ADR-007 · Una única primitiva de volumen (SSOT)

- **Contexto:** "nunca dos implementaciones para la misma métrica" (ENGINEERING_PRINCIPLES §5).
- **Decisión:** `setsVolume(arr)` es la **única** fuente del volumen (Σ peso×reps de series
  efectivas). Todas las agregaciones (día/semana/mes/año/músculo) la reutilizan.
- **Consecuencias:** ✅ el número base es consistente en toda la app. ⚠️ las **agregaciones**
  sí se solapan y recalculan sin caché (DT-6); y hay funciones de racha/récords duplicadas
  con criterios ligeramente distintos (DT-9).

## ADR-008 · El Coach nunca es un chatbot

- **Contexto:** "no habrá chat de IA" (MANIFESTO); el Coach es reactivo y contextual.
- **Decisión:** el Coach se expresa **solo** con pistas, tarjetas, banners, toasts y bottom
  sheets. No hay caja de texto ni pantalla de conversación. Todo el procesamiento es local.
- **Consecuencias:** ✅ fiel al manifiesto. 🟡 aún faltan las **decisiones** del Coach
  (ejercicio ocupado, cansancio, dolor, sustitución): hoy solo hay pistas pasivas.

## ADR-009 · Gamificación por constancia, no por adicción

- **Contexto:** "no premiará conductas poco saludables", "no castigará el descanso".
- **Decisión:** XP **solo** por acciones con valor (entrenar, récord, meta, racha), nunca
  por abrir la app. Rachas medidas **por semana**: los descansos programados no las rompen.
- **Consecuencias:** ✅ refuerzo positivo alineado con la salud, sin patrones de retención.

## ADR-010 · Peso siempre almacenado en kg; unidad solo de visualización

- **Contexto:** soportar kg/lb sin corromper datos.
- **Decisión:** los datos se guardan **siempre en kg**; `toDisp`/`toKg` convierten solo en
  la entrada/salida. Un único punto de conversión.
- **Consecuencias:** ✅ cambiar de unidad nunca altera los datos ni los récords.

## ADR-011 · ⚠️ Lógica de negocio dentro de `ui.js`

- **Contexto:** los principios dicen "la UI nunca calcula". La modularización (commit
  `13173d0`) extrajo Dashboard/Gamificación/Coach a motores, **pero** Progression,
  récords globales, métricas semanales, constancia e insights quedaron en `ui.js`.
- **Decisión (de facto):** convivir con render + lógica en el mismo archivo (1 629 líneas).
- **Consecuencias:** ⚠️ viola el principio de capas (DT-3); dificulta test y evolución.
  **Pendiente de corregir** (Sprint 3): mover —no reescribir— esa lógica a motores.

## ADR-012 · ⚠️ Cache-busting manual por versión

- **Contexto:** garantizar que cada despliegue llegue al dispositivo.
- **Decisión:** versión hardcodeada (`v46`) en `index.html` (`?v=`), `service-worker.js`
  (`CACHE_VERSION` + `APP_SHELL`) y el `?v=` del CSS; el SW autorecarga las pestañas al activar.
- **Consecuencias:** ✅ funciona y rompió el problema de "caché envenenada". ⚠️ el número
  vive en 3 sitios: fácil de desincronizar (DT-4). **Pendiente:** una sola constante `APP_VERSION`.

## ADR-013 · Render por `innerHTML` + auto-guardado por event delegation

- **Contexto:** sin framework; se busca simplicidad y "guardar invisible".
- **Decisión:** el día y los paneles se pintan reconstruyendo `innerHTML`. Un único listener
  sobre `#view` captura `input`/`change`/`click` y guarda con `debounce(400ms)`; los
  controles se autodescriben con `data-*`.
- **Consecuencias:** ✅ cero botones "guardar", código de eventos compacto. ⚠️ los campos
  editables se insertan sin escapar en el render → **self-XSS latente** (DT-5); y el
  re-render completo recorre el histórico varias veces (DT-6).

## ADR-014 · Gráficas en SVG hecho a mano

- **Contexto:** offline, sin dependencias.
- **Decisión:** barras, área, curvas por ejercicio y heatmap se generan como strings SVG.
- **Consecuencias:** ✅ cero peso de librerías, control total del estilo. 🟡 más código a
  mantener; sin tests de estas funciones de dibujo.

---

## ADR-015 · ⚠️ El respaldo cubre solo `state.v4`, no el plan de rutinas

- **Contexto (hallazgo N-1, Auditoría #2):** `exportJSON`/`importJSON` operan solo sobre
  `entrenoV.state.v4`. Las rutinas personalizadas viven en `entrenoV.plan.v1`
  (`RoutineRepository`) y quedan **fuera** del respaldo.
- **Decisión (de facto, no intencional):** el respaldo es parcial.
- **Consecuencias:** ⚠️ **pérdida de datos**: restaurar en otro dispositivo (o tras limpiar
  datos) devuelve el plan por defecto y deja el historial de ejercicios personalizados
  huérfano (S-4). Contradice el propósito del respaldo y el MANIFESTO. **Pendiente
  (Sprint 1):** un `StateRepository`/paquete de export que incluya ambas claves.

## ADR-016 · ⚠️ Dos derivaciones distintas de "sesiones de la semana"

- **Contexto (hallazgo N-2):** conviven `weekSessionsCount()` (por volumen, cualquier modo)
  y el `sessCount` de `renderProgress` (por *checkbox done*, solo modo completo).
- **Consecuencias:** ⚠️ dos pantallas pueden mostrar cifras distintas del mismo concepto
  (viola "una única fuente de verdad", ENGINEERING_PRINCIPLES §5). **Pendiente:** unificar
  en una sola función de dominio.

## ADR-017 · ⚠️ Código muerto de banner conservado

- **Contexto (hallazgo N-5):** `#banner` no existe en `index.html`, pero permanecen
  `renderBanner`, `dismissBanner` y el estado `bannerHidden` (persistido).
- **Consecuencias:** ruido y confusión para quien lee. Sin impacto funcional. **Pendiente:**
  eliminar en el refactor (no en la fase de auditoría).

---

## Decisiones pendientes (a resolver por el equipo)

- **PD-1:** ¿Dónde viven MANIFESTO/MPS/PED como fuente canónica? Hoy MPS (`ENTRENO V.md`)
  y PED (`ENTRENO V NEXT.md`) **no están en el repo** pese a ser citados por `§`. Sin ellos
  la trazabilidad es no verificable (DT-2).
- **PD-2:** ¿Qué runner de pruebas se adopta sin introducir build pesado? (Sprint 1)
- **PD-3:** Modelo de backend para Sincronización/Social respetando ADR-003 (privacidad).
