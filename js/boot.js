/* ============================================================
   Entreno V — 5. Arranque: inicialización (orden garantizado tras cargar todo)
   Arquitectura modular (spec §10/§116): scripts clásicos cargados en orden,
   mismo scope global; sin build. El orden en index.html es significativo.
   ============================================================ */

freezeExerciseIds();
const DEFAULT_SCHEDULE = JSON.parse(JSON.stringify(SCHEDULE));
Store.load();
// Gamificación (NEXT §35): siembra el nivel actual la primera vez, sin celebrarlo,
// para que solo las subidas FUTURAS disparen la celebración. Store.save() (más
// abajo en el arranque) lo persiste.
if(!levelSeen) levelSeen = levelInfo(gamificationStats().xp).level;

/* ----------------------------------------------------------------
   8. PWA: icono, manifest y service worker
   ------------------------------------------------------------
   El icono y el manifest viven ahora en archivos reales
   (assets/icon.svg y manifest.json), enlazados desde index.html.
   Aquí solo registramos el service worker para el modo offline-first.
   Se omite bajo file:// porque los SW requieren http(s)/localhost.
   ---------------------------------------------------------------- */
function registerSW(){
  if('serviceWorker' in navigator && location.protocol !== 'file:'){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js').catch(()=>{ /* sin SW: sigue funcionando */ });
    });
  }
}

/* ----------------------------------------------------------------
   9. ARRANQUE
   ---------------------------------------------------------------- */
applyTheme();                              // Fase E: aplica el tema guardado antes de pintar
renderWeek();
renderBanner();
bindObservers();                           // Observer registrado UNA sola vez
RoutineRepository.applySync();             // Fase 1: aplica ediciones de rutina antes de pintar (sin parpadeo)
renderDays();
render();
registerSW();
Store.save(); // fija la semana en curso (y archiva la anterior si cambió)
Store.reconcileDurable();  // Fase 1: IndexedDB durable (restaura si localStorage se limpió)
RoutineRepository.applyOverrides();  // Fase 1: aplica ediciones de rutina guardadas (si hay)
checkRecovery();  // Fase C: avisa de un entrenamiento sin finalizar de esta semana
