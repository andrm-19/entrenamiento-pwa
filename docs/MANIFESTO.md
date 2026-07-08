# ENTRENO V MANIFESTO (Borrador v0.1)

> **Nota de la Auditoría #1 (2026-07-08):** documento anclado en el repositorio para que
> sea auto-contenido. Contenido reproducido fielmente del borrador oficial. Es el
> **documento de mayor jerarquía**: toda decisión de producto, diseño y desarrollo debe
> respetarlo.

Este documento define la identidad de Entreno V. Es la base para todas las decisiones de producto, diseño y desarrollo.

## ¿Por qué existe Entreno V?

Entreno V existe para ayudar a las personas a entrenar mejor. La aplicación no busca retener al usuario; busca aportar valor cuando realmente la necesita.

## Principios

- El usuario siempre tiene el control.
- La app propone y explica; nunca impone.
- El Coach es reactivo y contextual. No existe un chat.
- La inteligencia debe ser silenciosa e integrada en la interfaz.
- El entrenamiento es más importante que la aplicación.
- Los datos pertenecen al usuario.
- El progreso se mide según los objetivos del usuario.
- Toda recomendación debe estar fundamentada en datos.

## Qué nunca hará Entreno V

- No tendrá un chat de IA.
- No utilizará feeds infinitos.
- No venderá los datos del usuario.
- No castigará al usuario por descansar.
- No premiará conductas poco saludables.

## Siguientes documentos

1. Engineering Principles
2. Functional Specifications
3. Implementation Sprints

---

## Jerarquía documental oficial

```
MANIFESTO
   ↓
MASTER PRODUCT SPECIFICATION (MPS · "ENTRENO V.md")        ← PENDIENTE en el repo
   ↓
PRODUCT EVOLUTION DOCUMENT (PED · "ENTRENO V NEXT.md")     ← PENDIENTE en el repo
   ↓
ENGINEERING PRINCIPLES
   ↓
FUNCTIONAL SPECIFICATIONS
   ↓
PRODUCT BREAKDOWN STRUCTURE (PBS)
   ↓
IMPLEMENTATION SPRINTS
   ↓
Código
```

> **Si hay contradicción entre documentos y código, el código NO tiene prioridad.**
> La documentación representa la intención del producto.
>
> **Bloqueante conocido:** el MPS y el PED son citados por el código (`§`) pero **no
> están en el repositorio**. Aportarlos es requisito para restablecer la trazabilidad
> (ver `PROJECT_AUDIT.md` DT-2).
