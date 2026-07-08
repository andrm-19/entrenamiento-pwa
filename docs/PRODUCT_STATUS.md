# PRODUCT_STATUS.md

> **Versión:** 2.0 (actualizado por Auditoría #1)
>
> **Estado:** Documento Vivo
>
> **Documento superior:** FUNCTIONAL_SPECIFICATION.md
>
> **Última actualización:** 2026-07-08 · commit `0098004`
>
> **Objetivo:** Mostrar el estado **real** del producto, la madurez de cada módulo y
> servir de guía para planificar los siguientes Sprints.

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

| Módulo | Estado | Madurez | Prioridad | Nota |
|---|---|---|---|---|
| Core | 🟢 | 75 % | Crítica | Falta editar músculos y biblioteca de ejercicios |
| Dashboard | 🟢 | 85 % | Alta | Muy completo; riesgo de sobrecarga de UX |
| Coach | 🟡 | 45 % | Alta | Solo pistas pasivas; faltan decisiones/sustituciones |
| Gamificación | 🟢 | 80 % | Media | Falta "temporadas" |
| Social | ⬜ | 0 % | Media | Sin código |
| Sincronización | 🟡 | 35 % | Alta | Solo local; falta multi-dispositivo/nube/conflictos |
| Configuración | 🟢 | 75 % | Baja | Falta notificaciones/privacidad |
| Infraestructura | 🟡 | 50 % | Alta | **Sin pruebas ni CI** |

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

# Estado del Core — 🟢 (75 %)

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

# Dashboard — 🟢 (85 %)
- [x] Score de progreso 0–100 (multifactor)
- [x] Estado de Salud (explicable)
- [x] Comparativas (vs. semana / 4 sem / 12 sem)
- [x] Tendencia semana/mes/año + proyecciones con nivel de confianza
- [x] Predicción de 1RM
- [x] Récords históricos, progreso por ejercicio, timeline, heatmap, frecuencia muscular
- [ ] Jerarquización para reducir sobrecarga cognitiva (UX)

---

# Coach Engine — 🟡 (45 %)
- [x] Pistas contextuales por ejercicio (no intrusivas, no chatbot)
- [x] Detección de patrones (con umbral de evidencia)
- [x] Análisis de sesión al cerrar
- [x] Sobrecarga progresiva / estancamiento (hoy dentro de `ui.js`)
- [ ] **Decisión: "ejercicio ocupado"**
- [ ] **Decisión: "estoy cansado" (fatiga en vivo)**
- [ ] **Decisión: "dolor / no me gusta"**
- [ ] **Sustitución de ejercicios**

---

# Gamificación — 🟢 (80 %)
- [x] Nivel + XP (solo por acciones con valor)
- [x] Rachas conscientes de descanso (no castigan descansar)
- [x] Logros por datos reales
- [x] Objetivos personales configurables
- [x] Retos del mes autoadaptados
- [ ] Temporadas

---

# Social — ⬜ (0 %)
- [ ] Perfil público / foto / biografía
- [ ] Entrenar juntos (disponibilidad, solicitar, confirmar)
- [ ] Comunidad (descubrir, invitaciones, bloquear, reportar)

> Depende de Autenticación y Sincronización (inexistentes). Debe diseñarse con los
> límites del MANIFESTO por delante: **sin feeds infinitos, sin venta de datos**.

---

# Sincronización — 🟡 (35 %)
- [x] Backup / restauración por archivo (JSON, validado)
- [x] Durabilidad local doble (localStorage + IndexedDB con reconciliación)
- [x] Export CSV / PDF
- [ ] Multi-dispositivo
- [ ] Backup en la nube
- [ ] Resolución de conflictos (esquema `updatedAt`/`state` "sync-ready", sin motor)
- [ ] Sincronización automática

---

# Configuración — 🟢 (75 %)
- [x] Tema claro/oscuro · Unidad kg/lb · Descanso por defecto
- [x] Modo Coach on/off · Metas semanales · Objetivos personales · Glosario
- [x] Export/Import de datos
- [ ] Notificaciones · Ajustes de privacidad explícitos

---

# Infraestructura — 🟡 (50 %)
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
2. **Documentación fuente (MPS/PED) fuera del repo** → trazabilidad `§` rota (Crítico).
3. **`ui.js` mezcla render y lógica** → deuda que crece (Alto).
4. **Cache-busting manual disperso** → despliegues rotos (Alto).
5. **Self-XSS latente** en render de campos editables → peligroso al llegar sync/social (Alto).
6. **Sin caché de agregados** → el Dashboard degrada con años de datos (Medio).

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

**Sprint 1 — Red de seguridad de pruebas + fix self-XSS.** Objetivo: cubrir los motores
puros con tests unitarios y escapar los campos editables en `render()`. Resultado
esperado: base segura para refactorizar. Detalle y dependencias en
[`PROJECT_AUDIT.md` — Los próximos 10 Sprints](./PROJECT_AUDIT.md#los-próximos-10-sprints).

---

# Historial de Auditorías

## Auditoría #1
- **Fecha:** 2026-07-08
- **Resultado:** Producto con Core/Dashboard/Gamificación sólidos (~70 % de la visión
  del núcleo). Riesgos principales: sin tests, documentación fuente fuera del repo,
  `ui.js` sobrecargado. Coach y Sincronización parciales; Social y Onboarding ausentes.
- **Observaciones:** los documentos de estado estaban desincronizados con el código
  (marcaban 0 %). Este documento se corrigió a la realidad. No se cambió comportamiento.

---

# Métricas del Proyecto

## Producto (estimación de la Auditoría #1)
- Cumplimiento del **MANIFESTO** (núcleo): **~70 %**
- Cumplimiento del **MPS**: **no verificable** (documento ausente del repo)
- Cumplimiento del **PED**: **no verificable** (documento ausente del repo)

## Ingeniería
- Cobertura de pruebas: **0 %**
- Errores críticos conocidos: **0** (ninguno bloqueante detectado en la lectura)
- Riesgos altos abiertos: **5** (ver arriba)
- Deuda técnica registrada: **10 ítems**

---

# Regla de Oro

El progreso no se mide por líneas de código, sino por funcionalidades **especificadas,
implementadas, probadas, auditadas y en producción**. Hoy el techo real es **Nivel 2
(Implementado)** hasta que exista la suite de pruebas.
