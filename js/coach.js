/* ============================================================
   Entreno V — Coach/AI Engine (Cap. VI): Modo Coach en el entreno
   Arquitectura modular (spec §71): scripts clásicos cargados en orden,
   mismo scope global; sin build. Motor especializado que se comunica con el
   resto por funciones globales; no accede a la lógica interna de otros módulos.
   ------------------------------------------------------------
   IA local (ENTRENO V NEXT · Cap. VI · §56/§65). No busca impresionar: ayuda a
   decidir. Durante el entreno muestra UNA pista útil por ejercicio, siempre
   respaldada por datos y explicable (§64), que se actualiza sola tras cada serie
   y NUNCA interrumpe el flujo (§65). Todo el procesamiento es local (§68).
   ============================================================ */
let coachMode = false;   // §65: activa/desactiva el Coach. Persistido en ui (esquema v4).

/** Alterna o fija el Modo Coach y repinta el día. */
function setCoach(on){
  coachMode = (on === undefined) ? !coachMode : !!on;
  syncSettings(); render(); Store.save();
}

/** Mejor volumen histórico de un ejercicio (día+id), excluyendo una fecha (hoy). */
function bestExerciseVolume(dayType, slug, excludeDate){
  let best = 0;
  for(const date in sessions){
    if(date === excludeDate) continue;
    const s = sessions[date]; if(s.dayType !== dayType) continue;
    ['full','express'].forEach(mode => {
      const cell = s[mode] && s[mode].ex && s[mode].ex[slug];
      const v = setsVolume(cell && cell.sets);
      if(v > best) best = v;
    });
  }
  return best;
}

/** Pista del Coach para el ejercicio i (o '' si no aplica). Prioriza la acción más
    útil AHORA, siempre a partir de datos reales (§56/§64/§65). */
function coachCue(i, e){
  if(!coachMode || !e || !e.id) return '';
  const arr = setsMap[exKey(i)];
  const today = dateOfDay(current);
  const target = parseFirstInt(e.s) || 0;         // series objetivo del plan
  const doneSets = effectiveSetCount(arr);
  const last = lastSessionTopSet(current, e.id, today);

  // 1) Series efectivas que faltan (+ objetivo de peso si hay referencia).
  if(target && doneSets < target){
    const rem = target - doneSets;
    const goal = (last && last.w) ? ` · apunta a <b>${fmtWeight(last.w)} ${wUnit()}</b>${last.reps ? ` × ${last.reps}` : ''}` : '';
    return `🎯 Te quedan <b>${rem}</b> serie${rem === 1 ? '' : 's'} efectiva${rem === 1 ? '' : 's'}${goal}`;
  }
  // 2) Superar la última sesión por peso tope.
  const top = topSet(arr);
  if(last && last.w && (!top || top.w < last.w)){
    return `🎯 Hoy supera <b>${fmtWeight(last.w)} ${wUnit()}</b> para batir tu última sesión`;
  }
  // 3) Mejor volumen del ejercicio igualado o superado.
  const curVol = setsVolume(arr);
  if(curVol > 0){
    const bestVol = bestExerciseVolume(current, e.id, today);
    if(bestVol > 0 && curVol >= bestVol) return `🔥 Igualaste tu mejor volumen aquí: <b>${fmtKg(curVol)} ${wUnit()}</b>`;
  }
  // 4) Objetivo de series cumplido.
  if(target && doneSets >= target) return `✅ Series del ejercicio completadas`;
  return '';
}

/** Fila del Coach bajo un ejercicio (solo si el Modo Coach está activo). */
function coachRow(i, e){
  return coachMode ? `<div class="coach-cue" id="coach-${i}">${coachCue(i, e)}</div>` : '';
}

/** Refresca en vivo todas las pistas del Coach tras registrar una serie (§65). */
function updateCoachCues(){
  if(!coachMode) return;
  const day = SCHEDULE[current]; if(day.rest) return;
  visibleEx(day).forEach((e, i) => { const el = document.getElementById('coach-' + i); if(el) el.innerHTML = coachCue(i, e); });
}
