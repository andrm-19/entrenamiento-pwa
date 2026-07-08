# CHANGELOG.md — Entreno V

> Historia reconstruida desde el historial de git por la Auditoría #1 (2026-07-08).
> Formato inspirado en *Keep a Changelog*. Las referencias `§` provienen de los mensajes
> de commit y aluden a specs (MPS/PED) que **aún no están en el repositorio**.

El proyecto usa versionado por número de assets/caché (`CACHE_VERSION`, hoy `v46`) en
lugar de SemVer. Este changelog agrupa el trabajo por fecha e hito funcional.

---

## [Sin versionar] — Segunda Fase de Auditoría (validación) · 2026-07-08

### Añadido (solo documentación)
- `docs/ARCHITECTURE_AUDIT.md` — auditoría exclusiva de arquitectura.
- `docs/SECURITY_AUDIT.md` — auditoría de seguridad con severidades (N-1, S-1…S-5, N-4).
- `docs/PERFORMANCE_AUDIT.md` — auditoría de rendimiento (P-1…P-6, sin fugas detectadas).
- `docs/UX_AUDIT.md` — auditoría de experiencia contra la filosofía.

### Cambiado (documentación)
- `docs/PROJECT_AUDIT.md` → **v2.0**: sección "Segunda Fase" con correcciones a la v1.0,
  rúbrica de porcentajes reproducible, hallazgos nuevos (N-1…N-6) y respuestas de
  preparación (FASE 8). Deuda técnica ampliada a 16 ítems.
- `docs/PRODUCT_STATUS.md` → **v3.0**: porcentajes recalculados y justificados
  (Core 75→60, Dashboard 85→95, Coach 45→50, Gamificación 80→75, Sincronización 35→40,
  Configuración 75→80, Infraestructura 50→45; visión total 38→56).
- `docs/PRODUCT_BREAKDOWN_STRUCTURE.md` → mapa de estado con Σ/N; código muerto (N-5).
- `docs/DECISIONS_LOG.md` → **v1.1**: ADR-015 (respaldo incompleto), ADR-016 (conteos
  divergentes), ADR-017 (código muerto).

### Hallazgos verificados en esta fase (documentados, NO corregidos)
- **N-1 (Alta):** el respaldo JSON no incluye `entrenoV.plan.v1` → pérdida de rutinas al restaurar.
- **N-2 (Media):** dos conteos divergentes de sesiones/semana.
- **N-3 (Media→Crítica):** XSS también en informe PDF y tabla de Progreso.
- **N-4 (Media):** inyección de fórmulas CSV en la exportación.
- **N-5 (Baja):** código muerto `#banner`.
- **N-6 (Media):** sin CSP + 31 `onclick` inline.

---

## [Sin versionar] — Auditoría documental (Primera Fase) · 2026-07-08

### Añadido (solo documentación, sin cambios de comportamiento)
- `docs/PROJECT_AUDIT.md` — auditoría integral (producto, técnica, UX, 10 sprints, informe ejecutivo).
- `docs/PRODUCT_STATUS.md` — estado real por módulo (corrige la versión que marcaba 0 %).
- `docs/PRODUCT_BREAKDOWN_STRUCTURE.md` — estado real por capacidad + capacidades nuevas descubiertas.
- `docs/DECISIONS_LOG.md` — registro de decisiones de arquitectura (ADR).
- `docs/CHANGELOG.md` — este documento.
- `docs/MANIFESTO.md`, `docs/ENGINEERING_PRINCIPLES.md`, `docs/README.md` — documentación fuente anclada en el repo.

---

## 2026-07-08 — Motores 2.0, Dashboard y Coach (ENTRENO V NEXT)

### Añadido
- **Gamificación:** objetivos personales configurables y retos del mes autoadaptados (NEXT §29/§34).
- **Coach/IA:** análisis de sesión, detección de patrones y predicción de 1RM (NEXT §59/§62/§63).
- **Coach/IA:** Modo Coach local durante el entreno (pistas contextuales) (NEXT §56/§65).
- **Gamificación:** Nivel, XP y rachas conscientes de descanso (NEXT §30–§33/§35).
- **Dashboard 2.0:** línea de tiempo de entrenamientos y récords (NEXT §21).
- **Dashboard 2.0:** predicción de tendencias con nivel de confianza (NEXT §24).
- **Dashboard 2.0:** cabecera con Score de progreso y Salud (NEXT §16/§20/§22/§23).
- **Motor 2.0:** tiempo activo/descanso medido, volumen en vivo, resumen e insights automáticos (NEXT §9–§15).

### Cambiado (arquitectura)
- **Modularización:** `app.js` dividido en módulos por responsabilidad (§10/§116) y extracción de
  Dashboard/Gamificación/Coach a motores propios (NEXT §71). *(La lógica de Progression/records/insights
  quedó en `ui.js` — ver `PROJECT_AUDIT.md` DT-3.)*

## 2026-07-08 — Rutinas
- Renombrar rutina, duplicar a otro día y restaurar el plan original (§46).

## 2026-07-07 — Motor, UX y datos
- Detección de fatiga (§60) y exportación a PDF imprimible (§85).
- Campos de peso/reps/RIR más visibles al escribir (§106/§110).
- Unidad kg/lb: conversión de visualización/entrada, datos siempre en kg (§22/§108).
- Metas semanales (§81) e intensidad de la semana (§57).
- Apartado de progreso como "curva de aprendizaje" con gráficas (§73/§74/§84).
- Récords ricos (§76) y cronómetro con pausa/silencio (§62).
- Sobrecarga progresiva + detección de estancamiento (§58/§59).

## 2026-07-07 — Persistencia durable y editor (Fase 1)
- Editor de rutinas: añadir/quitar/reordenar/editar sobre `RoutineRepository`.
- Modelos del dominio (JSDoc) + `RoutineRepository` sobre IndexedDB.
- Capa de persistencia durable en IndexedDB con fallback a localStorage.

## 2026-07-07 — Robustez de la PWA (Fase 0)
- Hotfix: `[hidden]` con `!important` (el overlay del diálogo bloqueaba todos los toques).
- Service Worker: autorecarga al activar para romper la "caché envenenada".
- Rediseño de controles de serie + Service Worker robusto (network-first).

## 2026-07-07 — Rediseño v3
- Eliminación total del calendario; limpieza de selectores CSS muertos.
- Pulido de botones/tarjetas, "última vez" y glosario.
- Fases A–F: series reales, 1RM estimado, sesión + recuperación, dashboard, ajustes y capa DB.

## 2026-06-30 — Rediseño v2
- Tema cian premium, progreso "pro" y modelos con volumen.

## 2026-06-28 / 06-29 — Génesis
- Rediseño v2/v3 inicial, export, colores por músculo, rutina Express.
- AMOLED, 120 Hz, dock ergonómico, manifest Android, gráficas.
- Cronómetro automático + cache-busting.
- **Commit inicial:** Entreno V — PWA modular de entrenamiento (offline-first).

---

## Convención para futuras entradas

Al cerrar un Sprint (ver `PROJECT_AUDIT.md`), añadir aquí: qué se **Añadió / Cambió /
Corregió / Eliminó**, la referencia de spec `§`, y actualizar `CACHE_VERSION` +
`APP_VERSION`. Mantener `PRODUCT_STATUS.md` y el PBS sincronizados en el mismo Sprint.
