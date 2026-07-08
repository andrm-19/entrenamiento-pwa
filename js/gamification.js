/* ============================================================
   Entreno V — Gamification Engine (Cap. III): nivel, XP, rachas, logros
   Arquitectura modular (spec §71): scripts clásicos cargados en orden,
   mismo scope global; sin build. Motor especializado que se comunica con el
   resto por funciones globales; no accede a la lógica interna de otros módulos.
   ============================================================ */
/* ================================================================
   GAMIFICACIÓN INTELIGENTE (ENTRENO V NEXT · Cap. III · §30/§32/§33)
   ------------------------------------------------------------
   Constancia, no adicción (§27). Todo se DERIVA de datos reales; la experiencia
   (XP) solo se gana con acciones con valor (§33), nunca por abrir la app ni pulsar
   botones. El nivel es multifactor (§32), no depende solo del peso. Sin nueva
   persistencia salvo el último nivel visto, para celebrar subidas (§35). --- */
const XP_PER = { workout:50, record:80, weekGoal:120, streakWeek:40 };

/** Nº de sesiones con volumen por semana (lunes). Base de rachas y metas (§30). */
function weeklySessionCounts(){
  const by = {};
  for(const date in sessions){ if(sessionVolume(sessions[date]) > 0){ const wk = weekMondayOf(date); by[wk] = (by[wk] || 0) + 1; } }
  return by;
}
/** Racha de semanas consecutivas (hasta la actual) cumpliendo la meta de sesiones.
    Se mide POR SEMANA: los días de descanso programados nunca rompen la racha (§30). */
function goalStreakWeeks(){
  const target = goals.sessions || 3;
  const counts = weeklySessionCounts();
  const curWk = weekId();
  let streak = 0;
  // La semana EN CURSO solo suma si ya cumplió; si aún no, no rompe la racha
  // (la semana no ha terminado). Solo una semana ya cerrada e incumplida la corta.
  if(Math.max(counts[curWk] || 0, weekSessionsCount()) >= target) streak++;
  let cur = weekMondayOf(ymd(addDays(parseYmd(curWk), -1)));
  while((counts[cur] || 0) >= target){ streak++; cur = weekMondayOf(ymd(addDays(parseYmd(cur), -1))); }
  return { streak, target };
}
/** Agregados para XP, nivel y logros (§32). Todo derivado del histórico, sin estado. */
function gamificationStats(){
  let workouts = 0, totalVolume = 0, trainedMs = 0;
  const exSet = new Set();
  for(const date in sessions){
    const s = sessions[date], v = sessionVolume(s);
    if(v > 0){ workouts++; totalVolume += v; }
    if(s.snapshot) trainedMs += s.snapshot.durationMs || s.snapshot.activeMs || 0;
    ['full','express'].forEach(mode => { const bag = s[mode] && s[mode].ex; if(bag) for(const slug in bag){ if(setsVolume(bag[slug].sets)) exSet.add(slug); } });
  }
  const records = Object.keys(bests).length;
  const target = goals.sessions || 3;
  const weeksMet = Object.values(weeklySessionCounts()).filter(c => c >= target).length;
  const streak = goalStreakWeeks().streak;
  const xp = workouts * XP_PER.workout + records * XP_PER.record + weeksMet * XP_PER.weekGoal + streak * XP_PER.streakWeek;
  return { workouts, totalVolume, trainedMs, records, weeksMet, streak, diversity: exSet.size, xp };
}
/** Nivel a partir de la XP (§32): curva creciente. Devuelve nivel + progreso al siguiente. */
function levelInfo(xp){
  let level = 1, need = 200, acc = 0;
  while(xp >= acc + need){ acc += need; level++; need = Math.round(need * 1.3); }
  const into = xp - acc;
  return { level, into, span:need, pct: Math.round(into / need * 100), xp };
}
/** Tras finalizar: si el nivel subió respecto al último visto, lo celebra (§35).
    La primera vez (levelSeen sin sembrar) NO celebra: solo fija el nivel actual. */
function celebrateLevelUp(){
  const nl = levelInfo(gamificationStats().xp).level;
  if(levelSeen && nl > levelSeen) showToast(`⭐ ¡Subiste a nivel ${nl}!`, 'success');
  if(nl !== levelSeen){ levelSeen = nl; Store.save(); }
}

/** Logros por datos reales (spec §31/§82). Hitos importantes, nunca triviales. */
function buildAchievements(){
  const g = gamificationStats();
  const hours = g.trainedMs / 3600000;
  return [
    { icon:'🎯', label:'Primer entreno',  ok: g.workouts >= 1 },
    { icon:'🏆', label:'Primer récord',   ok: g.records >= 1 },
    { icon:'🔥', label:'Racha ×2',        ok: g.streak >= 2 },
    { icon:'💪', label:'10 sesiones',     ok: g.workouts >= 10 },
    { icon:'🗓️', label:'50 sesiones',    ok: g.workouts >= 50 },
    { icon:'💯', label:'100 sesiones',    ok: g.workouts >= 100 },
    { icon:'🏋️', label:'10 t movidas',   ok: g.totalVolume >= 10000 },
    { icon:'🚛', label:'1 M kg movidos',  ok: g.totalVolume >= 1000000 },
    { icon:'⏱️', label:'50 h entrenadas', ok: hours >= 50 },
    { icon:'⭐', label:'Racha ×4',        ok: g.streak >= 4 }
  ];
}
function achievementsHtml(){
  return `<div class="ach">` + buildAchievements().map(a =>
    `<div class="ach-badge ${a.ok ? 'on' : ''}"><span class="ach-ico">${a.icon}</span><span>${a.label}</span></div>`).join('') + `</div>`;
}
/** Tarjeta de Nivel + XP + racha (§32/§33): visible pero sin distraer, opcional. */
function gamificationHtml(){
  const g = gamificationStats();
  const lv = levelInfo(g.xp);
  const gs = goalStreakWeeks();
  const toNext = (lv.span - lv.into).toLocaleString('es-ES');
  return `<div class="level-card">
    <div class="level-top">
      <div class="level-badge"><b>${lv.level}</b><span>Nivel</span></div>
      <div class="level-meta">
        <div class="level-xp"><b>${g.xp.toLocaleString('es-ES')}</b> XP · faltan ${toNext} para el nivel ${lv.level + 1}</div>
        <div class="level-track"><i style="width:${lv.pct}%"></i></div>
      </div>
    </div>
    <div class="level-facts">
      <span>🏋️ ${g.workouts} entrenos</span>
      <span>🏆 ${g.records} récords</span>
      <span>🔥 ${gs.streak} sem racha</span>
      <span>🎽 ${g.diversity} ejercicios</span>
    </div>
  </div>`;
}
