# UX_AUDIT.md — Auditoría de Experiencia de Usuario

> **Versión:** 1.0 · **Fecha:** 2026-07-08 · **Commit del código:** `0098004`
>
> **Rol:** Product Auditor. Alcance: fidelidad de la experiencia a la filosofía del
> producto (MANIFESTO, MPS, PED, ENGINEERING_PRINCIPLES).
>
> **Nota:** MPS (`ENTRENO V.md`) y PED (`ENTRENO V NEXT.md`) **no están en el repositorio**;
> esta auditoría los infiere de sus citas `§` y del MANIFESTO. Cuando se aporten, revalidar.

---

## Veredicto de UX

**Entreno V transmite su filosofía en lo esencial y lo hace con oficio:** el usuario tiene
el control, el Coach no es un chatbot, el guardado es invisible, funciona sin conexión y no
hay patrones de adicción. El desvío principal es la **densidad del panel de Progreso**, que
empuja hacia la sobrecarga que el propio producto dice evitar, y la **ausencia de
onboarding**, que deja al usuario nuevo sin puerta de entrada.

Fidelidad a la filosofía: **Alta en el flujo de entrenar · Media en el de analizar.**

---

## 1. ¿La aplicación transmite la filosofía de Entreno V?

Contraste directo contra cada principio del MANIFESTO:

| Principio del MANIFESTO | ¿Se cumple en la UX? | Evidencia |
|---|---|---|
| "El usuario siempre tiene el control" | ✅ Sí | El Coach propone; nada cambia solo; se puede restaurar el plan; nada se borra |
| "La app propone y explica; nunca impone" | ✅ Sí | Sugerencias de sobrecarga como *pistas*; el usuario decide |
| "El Coach es reactivo y contextual. No existe un chat" | ✅ Sí (estricto) | Sin caja de texto ni pantalla de conversación; solo pistas/toasts/tarjetas |
| "La inteligencia debe ser silenciosa e integrada" | 🟡 Parcial | En el entreno sí; en Progreso la "inteligencia" **compite por la atención** (ver §3) |
| "El entrenamiento es más importante que la app" | ✅ Sí | Auto-guardado sin botón; foco en registrar rápido ("Última vez", steppers) |
| "Los datos pertenecen al usuario" | ✅ Sí | Local, export/backup, sin cuentas |
| "El progreso se mide según los objetivos del usuario" | 🟡 Parcial | Hay metas y objetivos, **pero** sin onboarding que los capture al inicio |
| "Toda recomendación debe estar fundamentada en datos" | ✅ Sí | Pistas, patrones e insights se derivan del histórico; se declara la confianza |
| "No feeds infinitos / no vender datos / no castigar el descanso / no premiar lo insano" | ✅ Sí | Sin feed; rachas por semana no rompen por descansar; XP solo por valor |

**Resultado:** 6 de 9 principios se cumplen plenamente; 3 son parciales, todos por la
**densidad analítica** y la **falta de onboarding**, no por traición a la filosofía.

## 2. ¿Dónde deja de transmitirla?

1. **Panel de Progreso sobredimensionado.** ≈20 secciones en un único scroll (Score,
   Salud, resumen, insights, métricas, metas, objetivos, retos, intensidad, comparativas,
   gráfica, proyección, patrones, progreso por ejercicio, constancia, timeline, nivel,
   logros, volumen×2, frecuencia, récords×2, tabla). Choca con **"simplicidad"** y con
   **"la inteligencia no compite por la atención"** (ENGINEERING_PRINCIPLES). Es acumulación
   por adición: cada Sprint sumó una sección sin jerarquizar.

2. **"La app desaparece cuando termina el entrenamiento" — a medias.** Al finalizar se abre
   un buen resumen (¿Qué hice? / ¿Cómo me fue? / ¿Estoy progresando?), pero no hay un cierre
   que "guarde y salga": el usuario queda de nuevo en la vista densa. La app no se aparta.

3. **Sin onboarding.** Un usuario nuevo aterriza directamente en la rutina por defecto, sin
   bienvenida ni captura de objetivo/nivel/frecuencia. El "progreso según los objetivos del
   usuario" arranca vacío.

## 3. ¿Qué partes generan fricción?

- 🟡 **Densidad de la tarjeta de ejercicio.** Apila: Última vez + sobrecarga + Coach +
  series + récord + 1RM + historial + nota + vídeo. Es potente, pero durante una serie
  puede ser mucho ruido. Verificar que no distraiga del gesto de registrar.
- 🟡 **Doble eje de "modo" no evidente.** "Completa / Express" cambia todo el esquema del
  día; para un usuario nuevo el significado de "Express/Estudio" no es obvio.
- 🟡 **Recarga visible tras actualizar** (autorecarga del Service Worker): correcta para la
  robustez, pero se percibe como un parpadeo inesperado.
- 🟡 **Cifras que podrían discrepar.** Existen **dos formas** de contar "sesiones de la
  semana" (por checkbox vs. por volumen; ver `PROJECT_AUDIT` N-2). Si la tarjeta "sesiones"
  y la barra de "Meta de sesiones" muestran números distintos, erosiona la **confianza**,
  que el MANIFESTO pone en el centro.
- 🟡 **Pérdida de rutinas al restaurar** (N-1): el respaldo no trae las rutinas
  personalizadas → sorpresa negativa fuerte ("hice backup y perdí mis rutinas").

## 4. ¿Qué sorprende positivamente?

- ✨ **"Última vez"** bajo cada ejercicio (estilo *Previous* de Hevy/Strong): cierra cada
  serie en segundos. Excelente decisión de UX.
- ✨ **Auto-guardado invisible**: sin botón "guardar", sin ansiedad de perder datos.
- ✨ **Cronómetro de descanso** flotante con pausa/silencio/±15 s y aviso háptico, que se
  auto-oculta. Ergonómico para una mano.
- ✨ **Mapas musculares SVG** por ejercicio y por día: comunican "qué trabajo" de un vistazo.
- ✨ **Resumen final en 3 preguntas** honestas y accionables, con récords y comparativas.
- ✨ **Salud del progreso explicable** (no un número mágico: dice *por qué*).
- ✨ **Recuperación de entreno sin finalizar**: respeta el trabajo del usuario.
- ✨ **Feedback moderno** (toasts + diálogo propio en vez de `alert/confirm`) y
  **accesibilidad de base** (`aria-label`, `aria-live`, roles, tema claro/oscuro).

## 5. Accesibilidad (a validar, no verificado con herramientas)

- ✅ `aria-label` extensos, `role`/`aria-live` en timer y toast, targets grandes para el pulgar.
- 🟡 **Sin verificar**: contraste real de los colores musculares sobre AMOLED; comportamiento
  con tamaño de fuente del sistema aumentado; orden de foco de teclado en el editor; soporte
  de lector de pantalla en las gráficas SVG (tienen `aria-label`, pero los datos no son
  navegables). Requiere una pasada con herramientas (axe/Lighthouse) en un Sprint de UX.

---

## 6. Recomendaciones de UX (documentadas, no implementadas)

Ordenadas por impacto en la fidelidad a la filosofía:

1. **Jerarquizar el panel de Progreso** en niveles: Nivel 1 siempre visible (Score + Salud
   + 3 datos), el resto colapsable/bajo demanda. Alinea con "simplicidad" y "la
   inteligencia no compite por la atención". (Sprint de UX en `PROJECT_AUDIT.md`.)
2. **Unificar el conteo de sesiones** (una sola fuente de verdad) para que ninguna pantalla
   muestre cifras contradictorias. (Ligado a N-2.)
3. **Onboarding mínimo** que capture objetivo/nivel/frecuencia sin estorbar (una pantalla,
   saltable). (Sprint de Onboarding.)
4. **Respaldo completo** para no sorprender con pérdida de rutinas (N-1). *Es UX además de
   seguridad: la confianza es el activo central.*
5. **Cierre "guardar y salir"** tras el resumen, para que la app "se aparte" al terminar.

**Ninguna se implementa en esta fase.** Se registran para los Sprints correspondientes.
