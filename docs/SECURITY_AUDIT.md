# SECURITY_AUDIT.md — Auditoría de Seguridad

> **Versión:** 1.0 · **Fecha:** 2026-07-08 · **Commit del código:** `0098004`
>
> **Rol:** Security Reviewer. Alcance acotado a lo pedido: XSS, persistencia, IndexedDB,
> localStorage, validaciones, sanitización, exportación e importación de datos.
>
> **Se documenta, no se corrige** (restricción de la fase).

---

## Modelo de amenaza

Entreno V es una **PWA de un solo usuario, sin backend, sin autenticación, sin datos de
terceros y sin secretos**. Todos los datos son del propio usuario y viven en su
dispositivo. Esto **reduce mucho** el impacto de la mayoría de vulnerabilidades: no hay
sesión que robar, ni servidor que atacar, ni datos ajenos que exfiltrar.

**Sin embargo**, hay dos vectores que elevan la relevancia de los hallazgos:
1. **Importación de un respaldo** provisto por otra persona (archivo compartido).
2. La **hoja de ruta** (Sincronización y Social): cualquier XSS latente hoy se vuelve
   **crítico** en cuanto los datos se compartan entre dispositivos o usuarios.

Por eso los hallazgos se clasifican por severidad **actual** y se anota su **severidad
futura** bajo sync/social.

---

## Tabla resumen de hallazgos

| ID | Hallazgo | Severidad actual | Severidad futura (sync/social) | Área |
|---|---|---|---|---|
| **N-1** | El respaldo/restauración **NO incluye las rutinas personalizadas** | **Alta** (pérdida de datos) | Alta | Exportación/Importación |
| **S-1** | **XSS almacenado (self-XSS)** en render de campos editables | Media | **Crítica** | XSS |
| **S-2** | **Ausencia de Content-Security-Policy** + 31 manejadores `onclick` inline | Media | Alta | XSS / hardening |
| **N-4** | **Inyección de fórmulas CSV** en la exportación | Media | Media | Exportación |
| **S-3** | **Validación laxa** del respaldo importado (`isValidBackup`) | Baja | Media | Importación/Validación |
| **S-4** | Restaurar sesiones con slugs de ejercicios inexistentes deja historial huérfano | Baja | Media | Persistencia/Importación |
| **S-5** | `localStorage`/IndexedDB sin cifrado (datos en claro en el dispositivo) | Baja | Media | Persistencia |

---

## N-1 · El respaldo no incluye las rutinas personalizadas — **ALTA**

**Descripción.** `exportJSON()` (`ui.js:1186`) exporta **solo** `entrenoV.state.v4`
(sesiones, récords, ui). Las ediciones de rutina del usuario (renombrar, añadir/quitar/
reordenar ejercicios, duplicar días) viven en `entrenoV.plan.v1`, gestionadas por
`RoutineRepository` (`store.js:220`). `importJSON()` (`ui.js:1232`) tampoco toca esa clave.

**Impacto.** Un usuario que personaliza sus rutinas, hace **"Respaldo"** y luego restaura
en **otro móvil** (o tras limpiar los datos del sitio) **pierde todas sus rutinas
personalizadas**: la app vuelve al plan por defecto. Además, las sesiones restauradas que
referencian ejercicios personalizados quedan **huérfanas** (ver S-4).

**Por qué es Alta.** Contradice directamente el propósito declarado del respaldo
("para no perder nada / cambiar de móvil", README) y el principio del MANIFESTO "los datos
pertenecen al usuario". No es un fallo cosmético: es **pérdida de datos del usuario**.

**Evidencia.** `exportJSON` → `DB.read(Store.KEY)`. `importJSON` → escribe solo
`Store.KEY`/`KEY_V2`/`KEY_V1`. Ninguna referencia a `entrenoV.plan.v1`.

**Recomendación (no implementar aún).** Un export/import que serialice **ambas** claves
(`state.v4` + `plan.v1`) como un único paquete versionado. Ver `PROJECT_AUDIT.md` Sprint 1.

---

## S-1 · XSS almacenado (self-XSS) en el render — **MEDIA** (→ Crítica con sync/social)

**Descripción.** Varios campos **editables por el usuario** se insertan en `innerHTML`
**sin escapar**:

| Ubicación | Campo | Origen |
|---|---|---|
| `ui.js:61` | `${e.n}` (nombre de ejercicio) | Editor de rutina |
| `ui.js:88` | `${day.type}` (nombre de rutina) | Editor de rutina |
| `ui.js:89` | `${day.sub}` (subtítulo) | Editor de rutina |
| `ui.js:1216` | `${r.ejercicio}` (informe **PDF**) | Editor de rutina |
| `ui.js:1597` | `${grec.maxRmName}` (nota de récord) | Editor de rutina |
| `ui.js:1603` | `${r.ejercicio}` (tabla de Progreso) | Editor de rutina |

Un nombre de ejercicio como `<img src=x onerror=alert(1)>` se **almacena** (el editor
guarda con `escapeAttr` dentro de `value=`, lo que **no** neutraliza el payload al
re-renderizarlo crudo) y **se ejecuta** al pintar el día, el panel Progreso o el informe PDF.

**Impacto actual (Media).** Es **self-XSS**: el usuario se inyecta a sí mismo, en su propio
origen, sin secretos que robar. El daño realista es bajo (puede romper su propia vista o
ejecutar JS que ya podría ejecutar por consola).

**Impacto futuro (Crítica).** En cuanto exista **compartir/sincronizar rutinas** entre
usuarios/dispositivos, el payload viaja a la víctima y se convierte en XSS almacenado
clásico con ejecución en el origen de la app.

**Contraste.** Las notas y el feedback de sesión **sí** se escapan (`escapeHtml`, `ui.js:112,326`).
La inconsistencia confirma que es un olvido puntual, no una decisión.

**Recomendación.** Escapar TODOS los campos editables en el render (misma técnica ya usada
para notas). Añadir CSP (ver S-2). No implementar en esta fase.

---

## S-2 · Sin Content-Security-Policy + manejadores inline — **MEDIA**

**Descripción.** `index.html` no define ninguna CSP (ni meta ni cabecera documentada). El
código genera **31 manejadores `onclick=` inline** en HTML dinámico. Sin CSP, cualquier
HTML inyectado (S-1) ejecuta sin restricción; y **una CSP estricta no puede activarse** sin
antes eliminar los `onclick` inline (requerirían `unsafe-inline`).

**Impacto.** Defensa en profundidad ausente: no hay segunda barrera si S-1 se explota.

**Severidad.** Media hoy (superficie pequeña), Alta cuando lleguen datos externos.

**Recomendación.** Migrar `onclick` inline a delegación de eventos (ya existe el patrón en
`bindObservers`) y añadir una CSP `default-src 'self'`. No implementar aún.

---

## N-4 · Inyección de fórmulas en CSV — **MEDIA**

**Descripción.** `exportCSV()` (`ui.js:1172`) entrecomilla los nombres pero **no los
prefija** contra fórmulas. Un nombre de ejercicio que empiece por `=`, `+`, `-` o `@` (p.
ej. `=HYPERLINK("http://malo","clic")` o `=1+1`) se interpreta como **fórmula** al abrir el
CSV en Excel/Google Sheets (CSV/Formula Injection).

**Impacto.** El propio usuario podría, sin querer, crear un CSV que ejecute fórmulas al
abrirlo; con compartición de datos, un tercero podría inducirlo.

**Evidencia.** `'"' + r.ejercicio.replace(/"/g,'""') + '"'` — solo escapa comillas, no
neutraliza el prefijo de fórmula.

**Recomendación.** Prefijar con `'` los campos que empiecen por `= + - @`. Documentado; no
se corrige ahora.

---

## S-3 · Validación laxa del respaldo importado — **BAJA**

**Descripción.** `isValidBackup()` (`ui.js:1274`) acepta cualquier objeto que tenga la
clave `schemaVersion` **o** alguna de `week/done/loads/notes/bests/history`. No valida
tipos, ni estructura interna, ni rangos.

**Impacto.** Un archivo malformado "válido a ojos de la función" se escribe en
`localStorage` y se recarga. La carga (`Store.load` → `applyState`) está envuelta en
`try/catch` y **degrada a estado por defecto** si falla, por lo que el peor caso es
perder la sesión en curso, no una ejecución. Riesgo bajo, pero la validación no es una
verdadera sanitización.

**Recomendación.** Validación estructural (forma de `sessions`, tipos numéricos) antes de
persistir. Documentado.

---

## S-4 · Historial huérfano al restaurar sin el plan — **BAJA**

**Descripción.** Consecuencia de N-1: si se restauran sesiones que referencian slugs de
ejercicios personalizados (`entrenoV.plan.v1`) y ese plan no está presente,
`resolveBySlug`/`resolveExercise` devuelven `null` y ese historial **no se puede mostrar**
(aunque los datos siguen en disco, invisibles).

**Impacto.** Confusión y sensación de pérdida de datos. No es explotable; es integridad.

**Recomendación.** Resolver junto con N-1 (exportar/restaurar el plan también).

---

## S-5 · Datos locales sin cifrado — **BAJA**

**Descripción.** `localStorage` e IndexedDB guardan el estado **en claro**. Cualquier
proceso con acceso al perfil del navegador puede leerlo.

**Impacto.** Bajo para datos de entrenamiento (no sensibles como credenciales). Se vuelve
relevante solo si en el futuro se guardan datos personales sensibles (salud, perfil).

**Recomendación.** Aceptable hoy. Reevaluar al añadir Perfil/Social. Documentado.

---

## Lo que está BIEN (controles presentes)

- ✅ **Sin `eval`, sin `Function()`, sin `innerHTML` alimentado por red.** Todo el HTML se
  genera localmente.
- ✅ **Escapado correcto** de notas y feedback de sesión (`escapeHtml`).
- ✅ **Sin secretos en el repo**, sin tokens, sin claves.
- ✅ **Service Worker** solo cachea respuestas `200/OK` del **mismo origen**; ignora
  peticiones que no sean GET del propio origen (`service-worker.js:75`). Evita envenenar la
  caché con respuestas de terceros.
- ✅ **Importación con confirmación explícita** antes de sobrescribir datos.
- ✅ **Persistencia tolerante a fallos** (todo en `try/catch`): un almacenamiento no
  disponible no rompe la app.

---

## Priorización de remediación (para Sprints)

1. **N-1** (Alta) — respaldo completo (state + plan). *Bloqueante de confianza en el respaldo.*
2. **S-1** (Media→Crítica) — escapar campos editables en el render. *Bloqueante antes de sync/social.*
3. **N-4** (Media) — prefijo anti-fórmula en CSV.
4. **S-2** (Media) — CSP + eliminar `onclick` inline (defensa en profundidad).
5. **S-3 / S-4 / S-5** (Baja) — validación estructural, historial huérfano, cifrado (diferibles).

Ninguno se corrige en esta fase; todos entran en el backlog de `PROJECT_AUDIT.md`.
