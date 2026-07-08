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

/* --- Detección de patrones (spec §62) --- Solo se muestran con evidencia
   suficiente; nunca conjeturas. Todo derivado del histórico local. --- */
const DOW_NAME = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function detectPatterns(){
  const out = [];
  const list = [];
  for(const date in sessions){
    const v = sessionVolume(sessions[date]);
    if(v > 0) list.push({ date, v, dow: parseYmd(date).getDay(), restMs: sessions[date].restMs || 0 });
  }
  if(list.length < 6) return out;                 // sin evidencia suficiente
  const avg = list.reduce((a, b) => a + b.v, 0) / list.length;
  // 1) Mejor día de la semana (≥2 sesiones ese día y ≥15% sobre la media).
  const byDow = {};
  list.forEach(s => { (byDow[s.dow] = byDow[s.dow] || []).push(s.v); });
  let bestDow = -1, bestAvg = 0;
  for(const d in byDow){
    if(byDow[d].length >= 2){ const a = byDow[d].reduce((x, y) => x + y, 0) / byDow[d].length; if(a > bestAvg){ bestAvg = a; bestDow = +d; } }
  }
  if(bestDow >= 0 && bestAvg >= avg * 1.15) out.push(`📅 Sueles rendir mejor los <b>${DOW_NAME[bestDow]}</b> (más volumen que tu media).`);
  // 2) Descanso vs. rendimiento (mitad con más descanso vs. mitad con menos).
  const withRest = list.filter(s => s.restMs > 0);
  if(withRest.length >= 5){
    const sorted = [...withRest].sort((a, b) => a.restMs - b.restMs);
    const medRest = sorted[Math.floor(sorted.length / 2)].restMs;
    const hi = withRest.filter(s => s.restMs >= medRest), lo = withRest.filter(s => s.restMs < medRest);
    if(hi.length && lo.length){
      const ah = hi.reduce((a, b) => a + b.v, 0) / hi.length, al = lo.reduce((a, b) => a + b.v, 0) / lo.length;
      if(ah >= al * 1.15) out.push(`⏱ Tus mejores entrenamientos ocurren cuando <b>descansas más</b> entre series.`);
      else if(al >= ah * 1.15) out.push(`⚡ Rindes más cuando <b>acortas los descansos</b>.`);
    }
  }
  return out.slice(0, 3);
}
/** Bloque "Patrones" del Dashboard (§62). Mensaje honesto si aún no hay evidencia. */
function patternsHtml(){
  const p = detectPatterns();
  if(!p.length) return '<p><small>Con más sesiones registradas aquí aparecerán patrones de tu entrenamiento. 🔍</small></p>';
  return `<div class="patterns">${p.map(t => `<div class="pattern">${t}</div>`).join('')}</div>`;
}

/** Análisis breve de la sesión recién cerrada (spec §59): ¿mejor que la anterior?
    ¿demasiada fatiga? ¿se cumplió el objetivo de series? Todo justificable con datos. */
function sessionAnalysis(d, snap){
  const out = [];
  const prev = prevSameDaySession(d, snap.date);
  if(prev){
    const pv = sessionVolume(prev);
    if(pv > 0){
      if(snap.volume > pv) out.push('Mejor que tu última sesión de este día.');
      else if(snap.volume < pv * 0.95) out.push('Por debajo de tu última sesión de este día.');
      else out.push('En línea con tu última sesión de este día.');
    }
  }
  // RIR medio de ESTA sesión (solo el día d) para detectar fatiga alta.
  let rs = 0, rn = 0;
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-/); if(!m || +m[2] !== d) continue;
    (setsMap[key] || []).forEach(s => { if(s && isEffective(s.type) && s.w > 0 && s.reps > 0 && s.rir !== '' && s.rir != null){ rs += +s.rir; rn++; } });
  }
  if(rn && rs / rn < 1) out.push('Intensidad muy alta (RIR bajo): cuida la recuperación.');
  return out.slice(0, 2);
}
