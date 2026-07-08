# Documentación oficial de Entreno V

> Esta carpeta es la **fuente oficial** del proyecto. Un desarrollador o IA que trabaje
> en Entreno V debería poder leer **solo** estos documentos y entender qué es el producto,
> cómo funciona, cómo está construido, qué existe, qué falta y cuáles son las prioridades.
>
> Creada/actualizada por la **Auditoría #1** (2026-07-08).

## Por dónde empezar

1. **[MANIFESTO.md](./MANIFESTO.md)** — la identidad y los límites del producto (máxima jerarquía).
2. **[ENGINEERING_PRINCIPLES.md](./ENGINEERING_PRINCIPLES.md)** — reglas técnicas + cumplimiento real.
3. **[PROJECT_AUDIT.md](./PROJECT_AUDIT.md)** — **el mapa completo**: qué existe, riesgos, deuda, UX, informe ejecutivo y los 10 próximos sprints.
4. **[PRODUCT_STATUS.md](./PRODUCT_STATUS.md)** — estado y madurez real por módulo.
5. **[PRODUCT_BREAKDOWN_STRUCTURE.md](./PRODUCT_BREAKDOWN_STRUCTURE.md)** — estado real de cada capacidad.
6. **[DECISIONS_LOG.md](./DECISIONS_LOG.md)** — por qué el proyecto es como es (ADR).
7. **[CHANGELOG.md](./CHANGELOG.md)** — la historia del proyecto.
8. **[FUNCTIONAL_SPECIFICATION_TEMPLATE.md](./FUNCTIONAL_SPECIFICATION_TEMPLATE.md)** — plantilla para especificar antes de implementar.

## Jerarquía documental

```
MANIFESTO → MPS (ENTRENO V.md)* → PED (ENTRENO V NEXT.md)* → ENGINEERING_PRINCIPLES
→ FUNCTIONAL_SPECIFICATIONS → PBS → IMPLEMENTATION_SPRINTS → Código
```

`*` **Pendientes en el repo.** El código cita el MPS y el PED por sección (`§`) pero esos
dos documentos aún no están versionados aquí. Aportarlos es requisito para restablecer la
trazabilidad "código ↔ intención" (ver `PROJECT_AUDIT.md`, deuda **DT-2**).

## Estado del proyecto en una línea

PWA offline-first en **JS vanilla sin build**. **Core, Dashboard y Gamificación sólidos**
(~70 % de la visión del núcleo). **Coach y Sincronización parciales**; **Social y
Onboarding ausentes**. Mayor riesgo: **cero pruebas automatizadas**. No abrir sprints de
funcionalidad nueva hasta cerrar la base (S1–S3 en el audit).

## Regla de trabajo

Antes de escribir código: la capacidad debe existir en el **PBS**, tener una **Functional
Specification** aprobada y respetar el **MANIFESTO** y los **ENGINEERING_PRINCIPLES**. Al
cerrar cada Sprint: actualizar `PRODUCT_STATUS.md`, el PBS y el `CHANGELOG.md`.
