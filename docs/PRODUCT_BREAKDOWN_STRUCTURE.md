# PRODUCT_BREAKDOWN_STRUCTURE.md

> **Versión:** 2.0 (actualizado por Auditoría #1)
>
> **Estado:** Documento Vivo
>
> **Última actualización:** 2026-07-08 · commit `0098004`
>
> **Objetivo:** Descomponer Entreno V en todas sus capacidades funcionales y marcar su
> estado **real**, para saber exactamente qué existe, qué falta y qué debe desarrollarse.

---

# Estados

```
⬜ No iniciado   🟡 Parcial   🟢 Implementado   🔵 Probado   ✅ Auditado   🚀 Producción
```

> **Regla de este proyecto:** "🔵 Probado" exige **pruebas automatizadas**. Como hoy no
> existe ninguna, **ninguna** capacidad supera 🟢, salvo lo señalado como ✅ Auditado por
> esta auditoría documental (que audita el estado, no valida con tests).

---

# Mapa de estado (resumen)

| Pilar | Estado | Madurez |
|---|---|---|
| 1. Core | 🟢 | 75 % |
| 2. Dashboard | 🟢 | 85 % |
| 3. Coach Engine | 🟡 | 45 % |
| 4. Gamificación | 🟢 | 80 % |
| 5. Social | ⬜ | 0 % |
| 6. Sincronización | 🟡 | 35 % |
| 7. Configuración | 🟢 | 75 % |
| 8. Infraestructura | 🟡 | 50 % |

---

# 1. CORE

## 1.1 Onboarding — ⬜
- ⬜ Bienvenida
- ⬜ Explicación inicial
- ⬜ Configuración inicial
- ⬜ Objetivos
- ⬜ Nivel de experiencia
- ⬜ Frecuencia semanal

## 1.2 Perfil — ⬜
- ⬜ Crear / editar perfil
- ⬜ Peso corporal · Altura · Edad · Sexo
- ⬜ Objetivos · Preferencias

## 1.3 Rutinas — 🟢
- 🟢 Crear ejercicio (editor)
- 🟢 Editar (nombre, series, reps, descanso, énfasis, tipo/subtítulo del día)
- 🟢 Eliminar
- 🟢 Duplicar (a otro día)
- 🟢 Reordenar (subir/bajar)
- 🟢 Restaurar plan original del día
- ⬜ Plantillas
- ⬜ Rutinas sugeridas
- ⬜ Importar / Exportar rutinas

## 1.4 Ejercicios — 🟡
- 🟢 Crear / Editar / Eliminar (dentro del editor de rutina)
- 🟢 Clasificar músculos (en el plan por defecto)
- 🟡 **Editar músculos `m` de un ejercicio** (NO disponible en el editor → fisura)
- ⬜ Buscar / catálogo independiente
- ⬜ Equipamiento estructurado
- 🟢 Variantes (Express por día)
- 🟢 Personalizados (vía editor)

## 1.5 Entrenamiento — 🟢
- 🟢 Iniciar (sesión con `startedAt`)
- 🟢 Registrar series
- 🟢 Registrar peso · repeticiones · RIR
- 🟢 Tipo de serie (9 tipos: efectiva, calentamiento, aproximación, fallo, dropset, backoff, restpause, myoreps, superserie)
- 🟡 RPE (no se registra; se usa RIR en su lugar)
- 🟢 Notas (por ejercicio y feedback de sesión)
- 🟢 Finalizar entrenamiento (snapshot + resumen)

## 1.6 Historial — 🟢
- 🟢 Sesiones (archivador por fecha, nunca se borra)
- 🟢 Detalle completo por ejercicio (curva + últimas sesiones)
- 🟢 Comparación (vs. última sesión del mismo día, vs. media mensual)
- 🟡 Búsqueda / filtros (no hay buscador; se navega por día/ejercicio)

---

# 2. DASHBOARD — 🟢

## Estadísticas
- 🟢 Volumen (día/semana/mes/año) · Series · Repeticiones
- 🟢 Peso medio · Reps medias · RIR medio
- 🟢 Tiempo activo / descanso (medido)
- 🟢 Frecuencia muscular (series por músculo + última vez)

## Progreso
- 🟢 Tendencias (semana/mes/año)
- 🟢 Evolución por ejercicio (curva)
- 🟢 Récords (por ejercicio y globales)
- 🟢 Score de progreso (0–100, multifactor)
- 🟢 Salud del progreso (explicable)
- 🟢 Objetivos / Metas

## Visualización
- 🟢 Tarjetas (stat cards)
- 🟢 Gráficas SVG (barras, área, curvas)
- 🟢 Comparativas (pills vs. periodos)
- 🟢 Heatmap de constancia
- 🟢 Línea de tiempo
- 🟢 Proyecciones con nivel de confianza
- 🟡 Resumen semanal/mensual dedicado (existe información, no una vista "resumen" separada)

---

# 3. COACH ENGINE — 🟡

## Decisiones
- ⬜ Ejercicio ocupado
- ⬜ Estoy cansado
- ⬜ No me gusta este ejercicio
- ⬜ Dolor
- 🟡 Fatiga (se detecta y se informa en Dashboard/Salud, no como intervención Coach)

## Recomendaciones
- ⬜ Sustituciones de ejercicio
- 🟢 Ajustes de intensidad/carga (sobrecarga progresiva sugerida)
- 🟡 Ajustes de volumen (informativo, no accionable)
- ⬜ Ajustes de frecuencia

## Alertas
- 🟢 Estancamiento (detección + aviso)
- 🟡 Sobrecarga / Recuperación (en estado de Salud, no como intervención)
- 🟢 Constancia (racha, insights)

## Celebraciones
- 🟢 Nuevo récord · Objetivo cumplido · Racha · Mejora importante · Subida de nivel

## Pistas y análisis (capacidades nuevas)
- 🟢 Pista contextual por ejercicio durante el entreno
- 🟢 Detección de patrones (mejor día, descanso vs. rendimiento)
- 🟢 Análisis de sesión al cerrar

---

# 4. GAMIFICACIÓN — 🟢
- 🟢 Logros (por datos reales)
- 🟢 Rachas (conscientes de descanso)
- 🟢 Nivel + XP (multifactor; XP solo por acciones con valor)
- 🟢 Objetivos personales configurables
- 🟢 Retos del mes autoadaptados
- 🟢 Celebraciones
- ⬜ Insignias como sistema separado
- ⬜ Temporadas

---

# 5. SOCIAL — ⬜
## Perfil
- ⬜ Perfil público · Foto · Biografía
## Entrenar juntos
- ⬜ Publicar disponibilidad · Buscar personas · Solicitar · Confirmar · Cancelar
## Comunidad
- ⬜ Descubrir · Invitaciones · Bloquear · Reportar

---

# 6. SINCRONIZACIÓN — 🟡
- 🟢 Backup (JSON, validado)
- 🟢 Restauración (con confirmación + detección de esquema)
- 🟢 Durabilidad local (IndexedDB + localStorage con reconciliación)
- 🟢 Export CSV / PDF
- ⬜ Multi-dispositivo
- ⬜ Backup en la nube
- ⬜ Resolución de conflictos (esquema `updatedAt`/`state` listo, sin motor)
- ⬜ Sincronización automática

---

# 7. CONFIGURACIÓN — 🟢
- 🟢 Apariencia / Tema (claro/oscuro)
- 🟢 Unidad de peso (kg/lb; datos siempre en kg)
- 🟢 Descanso por defecto
- 🟢 Modo Coach
- 🟢 Metas semanales · Objetivos personales
- 🟢 Glosario
- 🟢 Exportar / Importar datos
- ⬜ Notificaciones
- ⬜ Privacidad (ajustes explícitos)

---

# 8. INFRAESTRUCTURA — 🟡
- 🟢 Base de datos (kv sobre IndexedDB + localStorage)
- 🟢 Motores (parcialmente separados por archivo)
- 🟢 Caché (Service Worker offline-first)
- 🟡 Logs (mínimos, vía try/catch silenciosos)
- 🟡 Auditoría (documental, esta; no hay auditoría interna en runtime)
- ⬜ **Testing** (0 %)
- ⬜ **CI/CD**
- ⬜ Versionado centralizado de assets/SW (hoy manual y disperso)

---

# Capacidades nuevas descubiertas (añadidas al PBS por Auditoría #1)

Estas existen en el código y **no estaban** en el PBS original:

- 🟢 Modo Express / Estudio (variante exprés por día)
- 🟢 1RM estimado (fórmula de Epley)
- 🟢 Cronómetro de descanso (pausa, silencio, ±15 s, aviso háptico, auto-ocultar)
- 🟢 Mapas musculares anatómicos (SVG frente/espalda)
- 🟢 Export PDF (informe imprimible) y CSV
- 🟢 Score de progreso y Salud del progreso
- 🟢 Predicciones/proyecciones con nivel de confianza (regresión lineal + r²)
- 🟢 Predicción de 1RM
- 🟢 Detección de patrones de entrenamiento
- 🟢 Heatmap de constancia (estilo "commits")
- 🟢 Línea de tiempo de entrenamientos y récords
- 🟢 Retos del mes autoadaptados
- 🟢 Análisis automático de sesión
- 🟢 Recuperación de sesión sin finalizar
- 🟢 Máquina de estados de sesión (preparado→en_curso→…→sincronizado)

# Capacidades obsoletas propuestas para eliminar

Ninguna. No se detectó código muerto relevante (la limpieza del calendario y de
selectores CSS ya se hizo en commits anteriores).

---

# Dependencias

- **Dashboard** depende de: Statistics Engine, Historial, Registro, Core.
- **Coach** depende de: Dashboard, Statistics, Historial, Objetivos, Registro. (Las
  *decisiones/sustituciones* dependerán además de una **biblioteca de ejercicios**.)
- **Social** depende de: Perfil, Autenticación, Sincronización.
- **Sincronización multi-dispositivo** depende de: Autenticación y del esquema
  `updatedAt`/`state` (ya presente en el modelo de datos).

---

# Regla de Oro

Si una funcionalidad no aparece en este documento, para efectos del proyecto **no
existe**. Antes de escribir código nuevo debe agregarse aquí, clasificarse,
priorizarse y relacionarse con el resto del producto. Este PBS es la referencia oficial
del alcance y del progreso de Entreno V.
