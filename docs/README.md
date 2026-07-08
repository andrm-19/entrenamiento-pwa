# Documentación oficial de Entreno V

> Esta carpeta es la **fuente oficial** del proyecto. Un desarrollador o IA que trabaje
> en Entreno V debería poder leer **solo** estos documentos y entender qué es el producto,
> cómo funciona, cómo está construido, qué existe, qué falta y cuáles son las prioridades.
>
> Creada/actualizada por la **Auditoría #1** (2026-07-08).

## Por dónde empezar

1. **[MANIFESTO.md](./MANIFESTO.md)** — la identidad y los límites del producto (máxima jerarquía).
2. **[ENGINEERING_PRINCIPLES.md](./ENGINEERING_PRINCIPLES.md)** — reglas técnicas + cumplimiento real.
3. **[PROJECT_AUDIT.md](./PROJECT_AUDIT.md)** — **el mapa completo**: qué existe, riesgos, deuda, informe ejecutivo, los 10 próximos sprints y la **Segunda Fase** (correcciones + preparación).
4. **[PRODUCT_STATUS.md](./PRODUCT_STATUS.md)** — estado y madurez real por módulo (porcentajes justificados con rúbrica).
5. **[PRODUCT_BREAKDOWN_STRUCTURE.md](./PRODUCT_BREAKDOWN_STRUCTURE.md)** — estado real de cada capacidad.

**Auditorías especializadas (Segunda Fase):**

6. **[ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md)** — arquitectura pura (capas, acoplamiento, cohesión, motores).
7. **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** — XSS, persistencia, export/import, con severidades.
8. **[PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md)** — render, recálculos, memoria, listeners/fugas.
9. **[UX_AUDIT.md](./UX_AUDIT.md)** — fidelidad a la filosofía del producto.

**Trazabilidad y proceso:**

10. **[DECISIONS_LOG.md](./DECISIONS_LOG.md)** — por qué el proyecto es como es (ADR).
11. **[CHANGELOG.md](./CHANGELOG.md)** — la historia del proyecto.
12. **[FUNCTIONAL_SPECIFICATION_TEMPLATE.md](./FUNCTIONAL_SPECIFICATION_TEMPLATE.md)** — plantilla para especificar antes de implementar.

## Jerarquía documental

```
MANIFESTO → MPS (ENTRENO V.md)* → PED (ENTRENO V NEXT.md)* → ENGINEERING_PRINCIPLES
→ FUNCTIONAL_SPECIFICATIONS → PBS → IMPLEMENTATION_SPRINTS → Código
```

`*` **Pendientes en el repo.** El código cita el MPS y el PED por sección (`§`) pero esos
dos documentos aún no están versionados aquí. Aportarlos es requisito para restablecer la
trazabilidad "código ↔ intención" (ver `PROJECT_AUDIT.md`, deuda **DT-2**).

## Estado del proyecto en una línea

PWA offline-first en **JS vanilla sin build**. **Dashboard 95 %, loop de entrenar 80 %,
Gamificación 75 %**; **Coach 50 % y Sincronización 40 % parciales**; **Social y Onboarding
0 %**. Núcleo ~**72 %** de la visión; total ~**56 %**. Mayores riesgos: **cero pruebas**,
**el respaldo no incluye las rutinas** (pérdida de datos) y **XSS latente**.

## ¿Listo para nuevos Sprints?

**NO todavía.** Antes hay que cerrar la base: **pruebas + respaldo completo (N-1) + escapar
XSS (N-3)**. Ese es el **Sprint 1 real**. Justificación completa en
[`PROJECT_AUDIT.md` · FASE 8](./PROJECT_AUDIT.md#fase-8--preparación-para-el-desarrollo).

## Regla de trabajo

Antes de escribir código: la capacidad debe existir en el **PBS**, tener una **Functional
Specification** aprobada y respetar el **MANIFESTO** y los **ENGINEERING_PRINCIPLES**. Al
cerrar cada Sprint: actualizar `PRODUCT_STATUS.md`, el PBS y el `CHANGELOG.md`.
