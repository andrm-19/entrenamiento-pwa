# ENGINEERING_PRINCIPLES.md

> **Versión:** 1.0 (Borrador) · **Estado:** Draft
>
> **Documento superior:** MANIFESTO.md
>
> **Nota de la Auditoría #1 (2026-07-08):** anclado en el repositorio para hacerlo
> auto-contenido. Contenido reproducido fielmente del borrador oficial. Al final se añade
> una sección de **Cumplimiento real** con el resultado de la auditoría.

---

# Propósito

Define las reglas de ingeniería que deben respetarse durante todo el desarrollo de
Entreno V. No describe funcionalidades ni reemplaza al MPS/PED. Su objetivo es garantizar
que cualquier implementación futura mantenga la identidad del producto y una arquitectura
sostenible durante años. Toda decisión técnica deberá respetar este documento.

# Jerarquía documental

```
MANIFESTO → ENTRENO V (MPS) → ENTRENO V NEXT (PED) → ENGINEERING PRINCIPLES
→ FUNCTIONAL SPECIFICATIONS → IMPLEMENTATION SPRINTS → Código
```

Si hay conflicto entre documentos, prevalece el de mayor jerarquía. Nunca el código
podrá modificar la filosofía del producto.

# Filosofía de Ingeniería

El código existe para implementar el producto, nunca al contrario. La arquitectura nunca
podrá modificar la experiencia solo porque sea más fácil de programar. Toda decisión
prioriza: **Simplicidad, Escalabilidad, Mantenibilidad, Rendimiento, Claridad, Modularidad.**

# Principios Fundamentales

1. **Modularidad** — cada módulo, una única responsabilidad.
2. **Bajo acoplamiento** — los módulos se comunican por interfaces públicas, no por dependencias ocultas.
3. **Alta cohesión** — cada Engine agrupa solo responsabilidades relacionadas.
4. **Funciones puras** — los cálculos, siempre que sea posible, con funciones puras (calcular no muta datos).
5. **Una única fuente de verdad** — nunca dos implementaciones para la misma métrica (p. ej. el volumen se calcula solo en Statistics Engine).
6. **Arquitectura antes que rapidez** — no se aceptan atajos que comprometan el crecimiento futuro.

# Arquitectura General (capas)

```
UI → Application Layer → Engines → Repositories → Persistence
```

Cada capa solo conoce la inmediatamente inferior.

- **UI:** solo muestra información. Nunca calcula, interpreta ni decide. Toda la lógica vive en los Engines.
- **Engines:** toda la inteligencia (Statistics, Progression, Coach, Gamification, Social, Sync). Evolucionan de forma independiente.
- **Repository:** toda lectura/escritura de datos. Ningún Engine accede directamente a IndexedDB.
- **Persistencia:** la información personal pertenece al usuario y se almacena localmente. El servidor solo para auth/sync/social. El progreso nunca depende obligatoriamente del servidor.

# Offline First

Entreno V funciona completamente sin conexión para todas las funciones críticas.
Entrenar nunca depende de Internet.

# Rendimiento

Toda interacción se siente inmediata. Sin cálculos pesados durante el render. Las
operaciones históricas se optimizan; las consultas frecuentes pueden cachearse.

# Coach Engine

El Coach **nunca** es un chatbot: sin pantalla de conversación, sin caja de texto. Solo
aparece por **intervenciones contextuales** (ejercicio ocupado, estoy cansado, posible
estancamiento, nuevo récord, rutina finalizada, varias sesiones sin progreso), mediante
botones, tarjetas, banners, diálogos cortos y bottom sheets. Nunca conversaciones largas.

**Filosofía del Coach:** propone, explica, recomienda. Nunca obliga, modifica
automáticamente, elimina información ni cambia rutinas sin autorización. La decisión
siempre es del usuario. La inteligencia es invisible: no compite por la atención, no
interrumpe sin necesidad, y solo aparece si hay una razón objetiva basada en datos.

# Datos

Pertenecen al usuario. La app solo protege, organiza e interpreta. Nunca vende ni
comparte información sin autorización.

# Testing

Todo Engine debe tener pruebas. Toda función crítica debe estar validada. Las pruebas
cubren: cálculos, errores, casos límite, rendimiento y regresiones.

# Escalabilidad

Antes de implementar cualquier cosa: ¿puede mantenerse 5 años? ¿puede evolucionar sin
romper otros módulos? ¿respeta MANIFESTO/MPS/PED y la filosofía? Si alguna respuesta es
no, se replantea.

# Checklist obligatorio antes de aprobar un Sprint

☐ Respeta MANIFESTO · ☐ Respeta MPS · ☐ Respeta PED · ☐ No introduce deuda técnica
innecesaria · ☐ Mantiene Offline First · ☐ Mantiene propiedad local de los datos ·
☐ Tiene pruebas · ☐ Está documentado · ☐ No rompe la arquitectura · ☐ Puede mantenerse
durante años.

# Regla de Oro

Ninguna funcionalidad se implementa directamente desde una idea. El flujo es:
Idea → Discusión de Producto → MANIFESTO → MPS → PED → Functional Specification →
Implementation Sprint → Código → Auditoría → Producción.

# Principio Final

La calidad de Entreno V no se mide por la cantidad de funcionalidades, sino por la
capacidad del proyecto de seguir creciendo durante años sin perder su identidad, su
simplicidad ni la confianza del usuario.

---

# Cumplimiento real (Auditoría #1 · 2026-07-08)

| Principio | Cumplimiento | Nota |
|---|---|---|
| Modularidad / responsabilidad única | 🟡 | Motores separados por archivo, pero `ui.js` mezcla render + lógica |
| Bajo acoplamiento (interfaces) | 🔴 | Comunicación por **scope global mutable**, no por interfaces |
| Alta cohesión | 🟡 | `engine.js` mezcla dominio + formato + SVG |
| Funciones puras | 🟢 | Cálculos mayormente puros (volumen, 1RM, tendencias) |
| Única fuente de verdad | 🟢 (primitiva) / 🟡 (agregados) | `setsVolume` único; agregados de racha/récords duplicados |
| UI no calcula | 🔴 | La UI **sí calcula** (Progression, records, insights en `ui.js`) |
| Repository para todo dato | 🟡 | `RoutineRepository` sí; **sesiones sin repositorio formal** |
| Ningún Engine toca IndexedDB directo | 🟢 | Acceso vía adaptadores `DB`/`IDB` |
| Offline First | 🟢 | Cumplido plenamente |
| Datos del usuario / local | 🟢 | Cumplido |
| Coach no chatbot | 🟢 | Cumplido estrictamente |
| Coach propone, no impone | 🟢 | Cumplido |
| Testing de Engines | 🔴 | **0 pruebas** — incumplimiento total |
| Documentado | 🟢 (código) / 🔴 (specs) | Comentarios excelentes; MPS/PED ausentes del repo |

Detalle y plan de corrección en [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md).
