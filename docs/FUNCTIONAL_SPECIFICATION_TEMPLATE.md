# FUNCTIONAL_SPECIFICATION_TEMPLATE.md

> **Versión:** 1.0 · **Estado:** Plantilla Oficial · **Documento superior:** ENGINEERING_PRINCIPLES.md
>
> **Nota de la Auditoría #1:** anclada en el repo. Ninguna funcionalidad se implementa sin
> una Functional Specification completa y aprobada. Copiar este archivo por cada feature.

---

# Objetivo
Define el comportamiento funcional de una característica **antes** de implementarla, de
modo que cualquier desarrollador o IA implemente exactamente lo esperado sin interpretar
intenciones. Elimina ambigüedad entre Producto, Diseño e Implementación.

# Información General
- **Nombre:** _(nombre corto)_
- **Estado:** Draft · En revisión · Aprobada · Implementada · Auditada
- **Prioridad:** Crítica · Alta · Media · Baja
- **Pilar:** Core · Dashboard · Coach · Social · Gamificación · Sincronización · Configuración · Infraestructura
- **Objetivo:** ¿qué problema resuelve? ¿por qué existe?

# Filosofía
¿Cómo debe **sentirse** para el usuario? (rápida, natural, invisible, cómoda; nunca invasiva).

# Experiencia esperada
Describir sensaciones y comportamiento, **no** componentes.

# Flujo del Usuario
Paso a paso (1, 2, 3, …).

# Entradas
¿Qué información necesita? (rutina, historial, grupo muscular, equipamiento, objetivos, estadísticas…).

# Salidas
¿Qué genera? (cambio de ejercicio, registro, recomendación, actualización del Dashboard…).

# Reglas
Todo lo que **siempre** debe cumplirse.

# Restricciones
Todo lo que **nunca** debe ocurrir (p. ej. nunca modificar la rutina automáticamente, nunca abrir un chat).

# Casos límite
¿Qué ocurre si? (sin Internet, sin ejercicios compatibles, el usuario cancela, datos incompletos, errores).

# Coach
¿Debe intervenir? Sí/No. Si sí: ¿por qué aparece? ¿cuándo? ¿qué dice? ¿qué botones muestra? ¿cómo desaparece?

# Datos
¿Qué datos nuevos almacena? ¿dónde? ¿por qué? ¿durante cuánto tiempo?

# Métricas afectadas
Volumen · Series · Peso · RPE · RIR · Progreso · Rachas · Récords · Dashboard · Coach · Gamificación · Social.

# UI
¿Qué elementos aparecen? (tarjetas, bottom sheet, banner, modal, snackbar, animaciones).

# Accesibilidad
¿Una sola mano? ¿tamaños de fuente? ¿lectores de pantalla? ¿contraste?

# Rendimiento
Tiempo máximo esperado; animaciones; consultas; cálculos.

# Offline
¿Funciona sin Internet? ¿cómo? ¿qué pasa al recuperar conexión?

# Seguridad
¿Qué riesgos existen? ¿cómo se protegen los datos?

# Criterios de aceptación
☐ Cumple el flujo · ☐ Cumple las reglas · ☐ No viola restricciones · ☐ Supera las
pruebas · ☐ Respeta MANIFESTO/MPS/PED/ENGINEERING_PRINCIPLES · ☐ La experiencia coincide.

# Casos de prueba
Caso 1/2/3 — Entrada → Resultado esperado.

# Riesgos
¿Qué puede salir mal? ¿qué dependencias tiene? ¿qué rompe si falla?

# Futuras mejoras
Solo documentar (no implementar ahora).

# Auditoría
¿La implementación coincide con esta especificación? Sí / Parcialmente / No — describir diferencias.

# Aprobaciones
Producto · Diseño · Arquitectura · Desarrollo · QA — Fecha — Versión.
