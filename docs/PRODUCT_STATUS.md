# PRODUCT_STATUS.md

> **Versión:** 3.0 (recalculado en la Segunda Fase de Auditoría, con rúbrica reproducible)
>
> **Estado:** Documento Vivo
>
> **Documento superior:** FUNCTIONAL_SPECIFICATION.md
>
> **Última actualización:** 2026-07-08 · commit `0098004`
>
> **Objetivo:** Mostrar el estado **real** del producto, la madurez de cada módulo y
> servir de guía para planificar los siguientes Sprints.

> **Metodología de los porcentajes (reproducible).** Se enumeran las **capacidades hoja**
> de cada pilar (según el PBS). Cada una puntúa por estado: **⬜ = 0 · 🟡 = 0.5 · 🟢 = 1.0**.
> **Madurez % = round(Σ / N × 100)**. Mide *cuánto del alcance está construido*, no cuán
> lista para producción está (eso está topado en Nivel 2 para todo el proyecto por tener 0
> pruebas). Cualquier auditor puede recontar. El desglose por capacidad está en
> [`PRODUCT_BREAKDOWN_STRUCTURE.md`](./PRODUCT_BREAKDOWN_STRUCTURE.md).

---

# Propósito

Responde una única pregunta: **¿Cómo está Entreno V hoy y qué falta para llegar a la
visión del producto?**

> **Cambio v1 → v2:** la versión 1.0 de este documento marcaba **todo al 0 %** (era una
> plantilla sin inicializar). La Auditoría #1 constató que el producto está **muy por
> encima de eso**: el Core, el Dashboard y la Gamificación están implementados. Los
> porcentajes de abajo reflejan el estado **real** verificado leyendo el código.

---

# Arquitectura Funcional (real)

```
Entreno V  (PWA vanilla JS, sin build, offline-first)
│
├── Core                      🟢  Rutinas, editor, ejercicios, series, historial, sesión, Express
├── Dashboard                 🟢  Score, Salud, tendencias, predicciones, timeline, récords
├── Coach Engine              🟡  Pistas + patrones + análisis (SIN decisiones/sustituciones)
├── Gamificación              🟢  Nivel/XP, rachas, logros, objetivos, retos
├── Social                    ⬜  Inexistente
├── Sincronización            🟡  Solo local (backup/restore JSON + IndexedDB). Sin nube/multi-dispositivo
├── Configuración             🟢  Tema, unidad, descanso, Coach, metas, glosario, export
└── Infraestructura           🟡  DB + SW OK; SIN testing ni CI
```

Módulos de código (motores): `data.js`, `store.js`, `engine.js`, `dashboard.js`,
`gamification.js`, `coach.js`, `ui.js`, `boot.js`. Comparten **scope global** (sin
imports); el orden de carga es un contrato implícito.

---

# Estado General del Producto

| Módulo | Estado | Madurez | Σ / N | Prioridad | Nota |
|---|---|---|---|---|---|
| Core | 🟢 | **60 %** | 21.5 / 36 | Crítica | Loop de entrenar 80 %; Onboarding+Perfil 0 % |
| Dashboard | 🟢 | **95 %** | 16.5 / 17 | Alta | Casi completo; riesgo de sobrecarga de UX |
| Coach | 🟡 | **50 %** | 8.5 / 16 | Alta | *Decisiones/sustituciones* solo 10 % (0.5/5) |
| Gamificación | 🟢 | **75 %** | 6 / 8 | Media | Faltan insignias-sistema y temporadas |
| Social | ⬜ | **0 %** | 0 / 12 | Media | Sin código |
| Sincronización | 🟡 | **40 %** | 2 / 5 | Alta | Solo backup/restore local; falta multi-dispositivo/nube/conflictos |
| Configuración | 🟢 | **80 %** | 9 / 11 | Baja | Faltan notificaciones/privacidad |
| Infraestructura | 🟡 | **45 %** | 4 / 9 | Alta | **Sin pruebas ni CI** |

> **Corrección v2→v3 (Segunda Fase):** Core 75→60 (Onboarding/Perfil sí cuentan),
> Dashboard 85→95, Coach 45→50, Gamificación 80→75, Sincronización 35→40 (recontada sobre
> las 5 capacidades canónicas; durabilidad local → Infraestructura, export → Configuración),
> Configuración 75→80, Infraestructura 50→45. Detalle y motivo en
> [`PROJECT_AUDIT.md` · FASE 1/2](./PROJECT_AUDIT.md#segunda-fase-de-auditoría--validación-correcciones-y-preparación).
>
> **Media no ponderada de los 8 pilares: 56 %** (visión total).
> **Media del núcleo (Core, Dashboard, Coach, Gamificación, Configuración): 72 %.**
>
> **Nota:** Ningún módulo puede marcarse "🔵 Probado" porque **no existen pruebas
> automatizadas**. Donde hay funcionalidad estable se marca 🟢 Implementado.

---

# Niveles de Madurez

```
Nivel 0 Idea → Nivel 1 Especificado → Nivel 2 Implementado →
Nivel 3 Probado → Nivel 4 Auditado → Nivel 5 Producción
```

**Techo actual del proyecto: Nivel 2 (Implementado).** No puede superarse a Nivel 3 en
ningún módulo hasta que exista una suite de pruebas (ver Deuda Técnica DT-1).

---

# Estado del Core — 🟢 (60 %) · Σ 21.5/36

## Rutinas — 🟢
- [x] Crear / editar / eliminar / reordenar ejercicios (editor)
- [x] Duplicar rutina a otro día
- [x] Restaurar plan original del día
- [x] Renombrar rutina y subtítulo
- [x] Historial (por fecha, nunca se borra)
- [ ] Plantillas / rutinas sugeridas
- [ ] Importar / exportar rutinas

## Ejercicios — 🟡
- [x] Crear / editar / eliminar (dentro del editor de rutina)
- [x] Clasificación muscular (en el plan por defecto)
- [ ] **Editar los músculos `m` de un ejercicio** (fisura: nuevos ejercicios sin mapa)
- [ ] Biblioteca / búsqueda / catálogo independiente
- [ ] Equipamiento como campo estructurado

## Registro — 🟢
- [x] Peso · Reps · RIR · Tipo de serie (9 tipos)
- [x] Notas por ejercicio y feedback de sesión
- [x] Tiempo activo/descanso medido (Motor 2.0)
- [x] Auto-guardado silencioso (sin botón)
- [x] Sesión inicio/fin + recuperación de entrenos sin finalizar

---

# Dashboard — 🟢 (95 %) · Σ 16.5/17
- [x] Score de progreso 0–100 (multifactor)
- [x] Estado de Salud (explicable)
- [x] Comparativas (vs. semana / 4 sem / 12 sem)
- [x] Tendencia semana/mes/año + proyecciones con nivel de confianza
- [x] Predicción de 1RM
- [x] Récords históricos, progreso por ejercicio, timeline, heatmap, frecuencia muscular
- [ ] Jerarquización para reducir sobrecarga cognitiva (UX)

---

# Coach Engine — 🟡 (50 %) · Σ 8.5/16 · *decisiones 10 %*
- [x] Pistas contextuales por ejercicio (no intrusivas, no chatbot)
- [x] Detección de patrones (con umbral de evidencia)
- [x] Análisis de sesión al cerrar
- [x] Sobrecarga progresiva / estancamiento (hoy dentro de `ui.js`)
- [ ] **Decisión: "ejercicio ocupado"**
- [ ] **Decisión: "estoy cansado" (fatiga en vivo)**
- [ ] **Decisión: "dolor / no me gusta"**
- [ ] **Sustitución de ejercicios**

---

# Gamificación — 🟢 (75 %) · Σ 6/8
- [x] Nivel + XP (solo por acciones con valor)
- [x] Rachas conscientes de descanso (no castigan descansar)
- [x] Logros por datos reales
- [x] Objetivos personales configurables
- [x] Retos del mes autoadaptados
- [ ] Temporadas

---

# Social — ⬜ (0 %) · Σ 0/12
- [ ] Perfil público / foto / biografía
- [ ] Entrenar juntos (disponibilidad, solicitar, confirmar)
- [ ] Comunidad (descubrir, invitaciones, bloquear, reportar)

> Depende de Autenticación y Sincronización (inexistentes). Debe diseñarse con los
> límites del MANIFESTO por delante: **sin feeds infinitos, sin venta de datos**.

---

# Sincronización — 🟡 (40 %) · Σ 2/5 (canónica)

> El % canónico (2/5) cuenta solo: Backup, Restauración, Multi-dispositivo, Conflictos,
> Sync automático. **Durabilidad local** se contabiliza en Infraestructura y **Export
> CSV/PDF** en Configuración (reclasificación de la Segunda Fase). ⚠️ El backup **no
> incluye las rutinas personalizadas** — ver hallazgo **N-1** en
> [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

- [x] Backup / restauración por archivo (JSON, validado) — *pero incompleto (N-1)*
- [x] Durabilidad local doble (localStorage + IndexedDB con reconciliación) — *cuenta en Infraestructura*
- [x] Export CSV / PDF — *cuenta en Configuración*
- [ ] Multi-dispositivo
- [ ] Backup en la nube
- [ ] Resolución de conflictos (esquema `updatedAt`/`state` "sync-ready", sin motor)
- [ ] Sincronización automática

---

# Configuración — 🟢 (80 %) · Σ 9/11
- [x] Tema claro/oscuro · Unidad kg/lb · Descanso por defecto
- [x] Modo Coach on/off · Metas semanales · Objetivos personales · Glosario
- [x] Export/Import de datos
- [ ] Notificaciones · Ajustes de privacidad explícitos

---

# Infraestructura — 🟡 (45 %) · Σ 4/9
- [x] Base de datos (kv sobre IndexedDB + localStorage)
- [x] Motores (parcialmente separados)
- [x] Caché offline (Service Worker network-first para código)
- [ ] **Testing** (0 %)
- [ ] **CI/CD**
- [ ] Logs / auditoría interna

---

# Dependencias

- **Dashboard** ← Statistics Engine, Historial, Registro, Core.
- **Coach** ← Dashboard, Statistics, Historial, Objetivos, Registro. (Decisiones ← futura biblioteca de ejercicios.)
- **Social** ← Perfil, Autenticación, Sincronización.
- **Sincronización multi-dispositivo** ← Autenticación, esquema `updatedAt` (ya presente).

---

# Riesgos Actuales

1. **Sin pruebas** → cualquier cambio es a ciegas (Crítico).
2. **N-1: el respaldo no incluye las rutinas personalizadas** → pérdida de datos al
   restaurar (Alto). *(Nuevo en Segunda Fase.)*
3. **Documentación fuente (MPS/PED) fuera del repo** → trazabilidad `§` rota (Crítico).
4. **`ui.js` mezcla render y lógica** + acoplamiento por globals → deuda que crece (Alto).
5. **N-3: XSS** en render + informe PDF + tabla de Progreso → peligroso al llegar sync/social (Alto).
6. **Cache-busting manual disperso** → despliegues rotos (Alto).
7. **N-2: conteos de sesión divergentes** (done vs. volumen) → cifras contradictorias (Medio).
8. **Sin caché de agregados** → el Dashboard degrada con años de datos (Medio).

---

# Deuda Técnica

Registro completo con impacto/prioridad/sprint en
[`PROJECT_AUDIT.md` §3.8](./PROJECT_AUDIT.md#38-deuda-técnica-registro). Resumen:
DT-1 (sin tests, Crítica), DT-2 (docs fuera del repo, Crítica), DT-3 (`ui.js` mezcla
responsabilidades, Alta), DT-4 (cache-busting, Alta), DT-5 (self-XSS, Alta), DT-6
(sin caché de agregados, Media), DT-7 (no se editan músculos, Media), DT-8 (fecha
congelada, Baja), DT-9 (duplicación de streak/récords, Media), DT-10 (sin CI, Alta).

---

# Próximo Sprint

**Sprint 1 real (Segunda Fase) — "Base segura para construir".** Objetivo: (a) suite de
pruebas unitarias sobre los motores puros; (b) **respaldo completo** que incluya
`state.v4` **y** `plan.v1` (resuelve N-1); (c) **escapar** los campos editables en render,
informe PDF y tabla (resuelve N-3). **Sin funcionalidad nueva.** Resultado esperado: base
segura y confiable para refactorizar y crecer. Detalle en
[`PROJECT_AUDIT.md` · FASE 8](./PROJECT_AUDIT.md#fase-8--preparación-para-el-desarrollo).

---

# Historial de Auditorías

## Auditoría #1 (Primera Fase)
- **Fecha:** 2026-07-08
- **Resultado:** Producto con Core/Dashboard/Gamificación sólidos. Riesgos: sin tests,
  documentación fuente fuera del repo, `ui.js` sobrecargado. Coach y Sincronización
  parciales; Social y Onboarding ausentes.
- **Observaciones:** los documentos de estado estaban al 0 % (plantilla sin inicializar).
  Se corrigieron a la realidad. No se cambió comportamiento.

## Auditoría #2 (Segunda Fase · validación)
- **Fecha:** 2026-07-08
- **Resultado:** se validó la Auditoría #1 y se **corrigieron porcentajes** con una rúbrica
  reproducible (Core 75→60, Dashboard 85→95, etc.; visión total 38→56). Se añadieron
  auditorías especializadas (Arquitectura, Seguridad, Rendimiento, UX) y **6 hallazgos
  nuevos** (N-1 a N-6), destacando **N-1 (pérdida de datos: el respaldo no incluye rutinas)**.
- **Veredicto:** el proyecto **NO está listo** para nuevas funcionalidades hasta cerrar la
  base (tests + N-1 + N-3). No se cambió comportamiento.

---

# Métricas del Proyecto

## Producto (Auditoría #2, rúbrica reproducible)
- Cumplimiento del **MANIFESTO** (núcleo, media de 5 pilares): **~72 %**
- Madurez de implementación (media de 8 pilares): **~56 %**
- Cumplimiento del **MPS**: **no verificable** (documento ausente del repo)
- Cumplimiento del **PED**: **no verificable** (documento ausente del repo)

## Ingeniería
- Cobertura de pruebas: **0 %**
- Errores críticos conocidos: **0** bloqueante de arranque; **1 Alto** de datos (N-1)
- Riesgos altos abiertos: **6** (ver arriba)
- Deuda técnica registrada: **16 ítems** (DT-1…DT-10 + N-1…N-6)

---

# Regla de Oro

El progreso no se mide por líneas de código, sino por funcionalidades **especificadas,
implementadas, probadas, auditadas y en producción**. Hoy el techo real es **Nivel 2
(Implementado)** hasta que exista la suite de pruebas.
