/* ============================================================
   Entreno V — Dashboard/Analytics Engine (Cap. II): score, salud, predicción, línea de tiempo
   Arquitectura modular (spec §71): scripts clásicos cargados en orden,
   mismo scope global; sin build. Motor especializado que se comunica con el
   resto por funciones globales; no accede a la lógica interna de otros módulos.
   ============================================================ */
/* ================================================================
   DASHBOARD 2.0 · SCORE DE PROGRESO Y SALUD (ENTRENO V NEXT · Cap. II)
   ------------------------------------------------------------
   Responde de un vistazo la única pregunta del Dashboard (§16): "¿qué tan
   bien estoy progresando?". Es el Nivel 1 de la jerarquía (§17), lo primero
   que se ve. Ni el Score ni la Salud dependen de un único dato (§20/§23):
   combinan constancia, frecuencia, volumen, fuerza y objetivos, y todo es
   explicable. Reutiliza los agregados ya existentes. --- */

/** Volumen de las últimas n semanas (pasadas + la actual en curso), ascendente. */
function recentWeekVolumes(n){
  const cur = weekId();
  const past = weeklyVolumes().filter(w => w.weekId < cur).map(w => w.volume);
  past.push(weekVolume());
  return past.slice(-n);
}
/** Media de volumen de las últimas 4 SESIONES registradas (spec §22). 0 si no hay. */
function last4SessionsAvgVolume(){
  const vols = Object.keys(sessions).sort()
    .map(d => sessionVolume(sessions[d])).filter(v => v > 0).slice(-4);
  return vols.length ? Math.round(vols.reduce((a, b) => a + b, 0) / vols.length) : 0;
}
/** Fracción [0..1] de ejercicios del plan (con ≥2 sesiones) que NO están estancados,
    y cuántos hay en total. Indicador de progresión de fuerza (spec §20). */
function progressionRatio(){
  let prog = 0, tracked = 0;
  ORDER.forEach(d => {
    const day = SCHEDULE[d]; if(day.rest || !day.ex) return;
    day.ex.forEach(e => {
      if(!e.id) return;
      if(exerciseHistory(d, e.id).length < 2) return;   // sin historial suficiente
      tracked++;
      if(stagnationCount(d, e.id, '') < 2) prog++;       // '' = no excluye ninguna fecha
    });
  });
  return { ratio: tracked ? prog / tracked : 0, tracked };
}
/** Score general de progreso 0–100 (spec §20): media ponderada de sub-indicadores.
    No mide solo el peso levantado; complementa (no sustituye) las métricas sueltas. */
function progressScore(){
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  const now = weekVolume();
  // Constancia: proporción de semanas activas en las últimas 5 (incluida la actual).
  const wk = recentWeekVolumes(5);
  const constancia = clamp(wk.filter(v => v > 0).length / wk.length * 100);
  // Frecuencia: sesiones de esta semana frente al objetivo (meta o 4 por defecto).
  const target = goals.sessions || 4;
  const frecuencia = clamp(weekSessionsCount() / target * 100);
  // Volumen: tendencia frente a la media de las semanas previas (±50% ↦ 0..100).
  const past = wk.slice(0, -1).filter(v => v > 0);
  const avg = past.length ? past.reduce((a, b) => a + b, 0) / past.length : 0;
  let volumen = 50;
  if(avg > 0 && now > 0) volumen = clamp(50 + (now - avg) / avg * 100);
  else if(now > 0) volumen = 60;
  // Fuerza: proporción de ejercicios progresando (no estancados).
  const pr = progressionRatio();
  const fuerza = pr.tracked ? clamp(pr.ratio * 100) : (Object.keys(bests).length ? 60 : 50);
  const parts = [
    { key:'constancia', label:'Constancia', value:constancia, w:0.25 },
    { key:'frecuencia', label:'Frecuencia', value:frecuencia, w:0.20 },
    { key:'volumen',    label:'Volumen',    value:volumen,    w:0.25 },
    { key:'fuerza',     label:'Fuerza',     value:fuerza,     w:0.20 }
  ];
  // Objetivos: solo cuenta si hay metas definidas (spec 3.2 · cada dato sirve).
  if(goals.sessions || goals.volume){
    let met = 0, tot = 0;
    if(goals.sessions){ tot++; if(weekSessionsCount() >= goals.sessions) met++; }
    if(goals.volume){ tot++; if(now >= goals.volume) met++; }
    if(tot) parts.push({ key:'objetivos', label:'Objetivos', value:clamp(met / tot * 100), w:0.10 });
  }
  const tw = parts.reduce((a, p) => a + p.w, 0);
  const score = clamp(parts.reduce((a, p) => a + p.value * p.w, 0) / tw);
  return { score, parts };
}
/** Estado de salud del progreso (spec §23): SIEMPRE por múltiples indicadores,
    nunca un único dato. Devuelve estado, tono (color) y el porqué (explicable). */
function progressHealth(){
  const now = weekVolume();
  const wk = recentWeekVolumes(6);
  const past = wk.slice(0, -1).filter(v => v > 0);
  const avg = past.length ? past.reduce((a, b) => a + b, 0) / past.length : 0;
  const pct = (avg > 0 && now > 0) ? Math.round((now - avg) / avg * 100) : null;
  const rir = weeklyMetrics().avgRir;
  const pr = progressionRatio();
  const freqTarget = goals.sessions || 5;
  if(now <= 0 && avg <= 0)
    return { state:'Sin datos', tone:'neutral', why:'Registra algunas sesiones para evaluar tu progreso.' };
  // Fatiga: volumen a la baja con RIR muy bajo (cerca del fallo sostenido).
  if(rir != null && rir < 1 && pct != null && pct < 0)
    return { state:'Fatiga acumulada', tone:'warn', why:`Volumen a la baja (${pct}%) con RIR medio ${rir.toFixed(1)}. Considera una semana más suave.` };
  // Recuperación insuficiente: mucha frecuencia con poco margen.
  if(rir != null && rir < 1.5 && weekSessionsCount() >= freqTarget)
    return { state:'Recuperación insuficiente', tone:'warn', why:`${weekSessionsCount()} sesiones esta semana con RIR medio ${rir.toFixed(1)}. Vigila el descanso.` };
  // Sobrecarga elevada: salto grande de volumen con poco margen.
  if(pct != null && pct >= 40 && rir != null && rir < 1.5)
    return { state:'Sobrecarga elevada', tone:'warn', why:`+${pct}% de volumen frente a tu media con RIR ${rir.toFixed(1)}. Sube de forma más gradual.` };
  // Estancado: mayoría de ejercicios sin subir peso, o caída marcada de volumen.
  if((pr.tracked >= 2 && pr.ratio <= 0.4) || (pct != null && pct <= -15))
    return { state:'Estancado', tone:'warn', why: pr.tracked >= 2 && pr.ratio <= 0.4
      ? `${Math.round((1 - pr.ratio) * pr.tracked)} de ${pr.tracked} ejercicios sin progresar. Cambia rango de reps o descarga.`
      : `Volumen ${pct}% frente a tu media reciente. Revisa descanso y objetivos.` };
  // Progresando: volumen al alza y fuerza avanzando.
  if(pct != null && pct >= 5)
    return { state:'Progresando', tone:'good', why:`+${pct}% de volumen frente a tu media y ${Math.round(pr.ratio * 100)}% de ejercicios en progresión.` };
  return { state:'Estable', tone:'neutral', why: pct != null
    ? `Volumen estable (${pct >= 0 ? '+' : ''}${pct}%) frente a tu media reciente.`
    : 'Mantienes tu actividad; sigue registrando para ver la tendencia.' };
}
/* --- Predicción de tendencias (spec §24/§63) --- Estimaciones, NUNCA certezas.
   Cada proyección declara su nivel de confianza. Regresión lineal simple sobre el
   historial ya guardado; si no hay datos suficientes, no se inventa nada. --- */
/** Ajuste lineal por mínimos cuadrados de una serie de valores (x = índice).
    Devuelve { slope, intercept, r2, n }. r2 mide qué tan fiable es la recta. */
function linearTrend(values){
  const n = values.length;
  if(n < 2) return { slope:0, intercept: n ? values[0] : 0, r2:0, n };
  let sx=0, sy=0, sxx=0, sxy=0;
  values.forEach((y, x) => { sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; });
  const denom = n*sxx - sx*sx;
  const slope = denom ? (n*sxy - sx*sy) / denom : 0;
  const intercept = (sy - slope*sx) / n;
  const my = sy/n;
  let ssTot=0, ssRes=0;
  values.forEach((y, x) => { const f = slope*x + intercept; ssTot += (y-my)**2; ssRes += (y-f)**2; });
  const r2 = ssTot ? Math.max(0, 1 - ssRes/ssTot) : 0;
  return { slope, intercept, r2, n };
}
/** Etiqueta de confianza a partir de nº de puntos y r² (§24: siempre explícita). */
function confidenceLabel(n, r2){
  if(n >= 6 && r2 >= 0.6) return 'confianza alta';
  if(n >= 4 && r2 >= 0.35) return 'confianza media';
  return 'confianza baja';
}
/** 1–3 proyecciones basadas en el historial (§24): evolución de volumen, tiempo
    estimado para una meta y probabilidad de récord. Devuelve [] si faltan datos. */
function trendForecasts(){
  const out = [];
  // Volumen semanal reciente (hasta 8 semanas, incluida la actual).
  const wv = recentWeekVolumes(8).filter(v => v > 0);
  if(wv.length >= 3){
    const t = linearTrend(wv);
    const next = Math.max(0, Math.round(t.intercept + t.slope * wv.length));
    const dir = t.slope > 0 ? 'al alza' : t.slope < 0 ? 'a la baja' : 'estable';
    const conf = confidenceLabel(t.n, t.r2);
    out.push({ icon:'📊', text:`Proyección de volumen la próxima semana: <b>~${fmtKg(next)} ${wUnit()}</b> (tendencia ${dir}).`, conf });
    // Tiempo estimado para la meta de volumen (solo con pendiente positiva útil).
    if(goals.volume > 0 && t.slope > 1){
      const cur = wv[wv.length - 1];
      if(cur < goals.volume){
        const weeks = Math.ceil((goals.volume - cur) / t.slope);
        if(weeks >= 1 && weeks <= 104)
          out.push({ icon:'🎯', text:`A este ritmo alcanzarías tu meta de volumen (<b>${fmtKg(goals.volume)} ${wUnit()}</b>) en <b>~${weeks} semana${weeks===1?'':'s'}</b>.`, conf });
      } else {
        out.push({ icon:'✅', text:`Ya superas tu meta de volumen semanal (<b>${fmtKg(goals.volume)} ${wUnit()}</b>).`, conf:'dato' });
      }
    }
  }
  // Probabilidad de récord: ejercicio del plan con mejor tendencia de peso al alza.
  let bestEx = null;
  ORDER.forEach(d => {
    const day = SCHEDULE[d]; if(day.rest || !day.ex) return;
    day.ex.forEach(e => {
      if(!e.id) return;
      const hist = exerciseHistory(d, e.id);
      if(hist.length < 3) return;
      const t = linearTrend(hist.map(h => h.w));
      const best = (bests[`${d}-${e.id}`] || {}).w || 0;
      const last = hist[hist.length - 1].w;
      if(t.slope > 0 && best > 0 && last >= best - WEIGHT_STEP*2 && (!bestEx || t.slope > bestEx.slope))
        bestEx = { name:e.n, slope:t.slope, r2:t.r2, n:t.n };
    });
  });
  if(bestEx){
    const prob = bestEx.r2 >= 0.5 ? 'alta' : bestEx.r2 >= 0.25 ? 'media' : 'moderada';
    out.push({ icon:'🏆', text:`Probabilidad <b>${prob}</b> de récord próximamente en <b>${bestEx.name}</b> si mantienes el ritmo.`, conf:confidenceLabel(bestEx.n, bestEx.r2) });
  }
  // Predicción del próximo 1RM (spec §63): ejercicio con mejor tendencia de 1RM al alza.
  let rmEx = null;
  ORDER.forEach(d => {
    const day = SCHEDULE[d]; if(day.rest || !day.ex) return;
    day.ex.forEach(e => {
      if(!e.id) return;
      const rms = exerciseHistory(d, e.id).map(h => epley1RM(h.w, h.reps)).filter(x => x > 0);
      if(rms.length < 3) return;
      const t = linearTrend(rms);
      const next = t.intercept + t.slope * rms.length, cur = rms[rms.length - 1];
      if(t.slope > 0 && next > cur && (!rmEx || t.slope > rmEx.slope))
        rmEx = { name:e.n, next, n:t.n, r2:t.r2, slope:t.slope };
    });
  });
  if(rmEx) out.push({ icon:'📈', text:`Próximo 1RM estimado en <b>${rmEx.name}</b>: <b>~${fmtKg(rmEx.next)} ${wUnit()}</b>.`, conf:confidenceLabel(rmEx.n, rmEx.r2) });
  return out.slice(0, 4);
}
/** Bloque de proyección para el Dashboard (§24). Siempre marca "estimaciones". */
function trendForecastHtml(){
  const fc = trendForecasts();
  if(!fc.length) return '<p><small>Con unas semanas más de registro verás aquí proyecciones de tu progreso. 🔮</small></p>';
  const items = fc.map(f => `<div class="forecast">
    <span class="forecast-ico">${f.icon}</span>
    <span class="forecast-txt">${f.text}${f.conf !== 'dato' ? ` <span class="forecast-conf">${f.conf}</span>` : ''}</span>
  </div>`).join('');
  return `<div class="forecasts">${items}</div>
    <p class="forecast-note"><small>Son estimaciones a partir de tu historial, no certezas.</small></p>`;
}
/* --- Línea de tiempo (spec §21): entrenamientos y récords en un mismo lugar.
   Solo eventos con fecha real ya registrada; no se inventan hitos que la app aún
   no rastrea (descargas, cambios de rutina, lesiones, peso corporal). --- */
function timelineEvents(){
  const ev = [];
  for(const date in sessions){
    const v = sessionVolume(sessions[date]);
    if(v > 0){ const dt = SCHEDULE[sessions[date].dayType];
      ev.push({ date, kind:'workout', icon:'🏋️', label: dt ? dt.type : 'Entreno', detail:`${fmtKg(v)} ${wUnit()}` }); }
  }
  for(const k in bests){
    const b = bests[k]; if(!b || !b.date) continue;
    const d = +k.slice(0, k.indexOf('-')), slug = k.slice(k.indexOf('-') + 1);
    const ex = resolveBySlug(d, slug, 'full') || resolveBySlug(d, slug, 'express');
    ev.push({ date:b.date, kind:'record', icon:'🏆', label: ex ? ex.n : 'Récord', detail:`${fmtKg(b.w)} ${wUnit()}` });
  }
  ev.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);   // más reciente primero
  return ev.slice(0, 15);
}
/** Render de la línea de tiempo (§21). Mensaje honesto si aún no hay eventos. */
function timelineHtml(){
  const ev = timelineEvents();
  if(!ev.length) return '<p><small>Aquí aparecerán tus entrenamientos y récords a medida que registres. 🗓️</small></p>';
  const items = ev.map(e => `<div class="tl-item ${e.kind}">
    <span class="tl-dot">${e.icon}</span>
    <span class="tl-body"><b>${escapeHtml(e.label)}</b><span class="tl-detail">${e.detail}</span></span>
    <span class="tl-date">${daysAgoLabel(e.date)}</span>
  </div>`).join('');
  return `<div class="timeline">${items}</div>`;
}
/** Bloque de cabecera del Dashboard (Nivel 1 · §16/§17/§26): Score + Salud + media
    de las últimas 4 sesiones. Lo primero que ve el usuario al abrir Progreso. */
function progressHeadlineHtml(){
  const ps = progressScore();
  const h = progressHealth();
  const avg4 = last4SessionsAvgVolume();
  const bars = ps.parts.map(p =>
    `<div class="pscore-row"><span class="pscore-lbl">${p.label}</span>
      <span class="pscore-track"><i style="width:${p.value}%"></i></span>
      <span class="pscore-val">${p.value}</span></div>`).join('');
  return `<div class="phead">
    <div class="phead-top">
      <div class="pscore-ring" style="--v:${ps.score}">
        <b>${ps.score}</b><span>Score</span></div>
      <div class="phealth ${h.tone}">
        <div class="phealth-state">${h.state}</div>
        <div class="phealth-why">${h.why}</div></div>
    </div>
    <div class="pscore-bars">${bars}</div>
    ${avg4 > 0 ? `<div class="phead-avg">Media de tus últimas 4 sesiones: <b>${fmtKg(avg4)} ${wUnit()}</b></div>` : ''}
  </div>`;
}
