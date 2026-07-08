/* ============================================================
   Entreno V — 3. Dominio y servicios: volumen, 1RM, récords, estadísticas
   Arquitectura modular (spec §10/§116): scripts clásicos cargados en orden,
   mismo scope global; sin build. El orden en index.html es significativo.
   ============================================================ */
/* ----------------------------------------------------------------
   4. ESTADO EN MEMORIA (mapas de trabajo de la SEMANA ACTUAL)
   ------------------------------------------------------------
   done/loads/notes usan clave por posición `${x?}${dia}-${idx}` (el
   modo exprés vive en el espacio 'x'). Son la vista editable de la
   semana en curso: se hidratan desde 'sessions' al cargar y se
   vuelcan de vuelta al guardar. 'bests' ya usa id estable.
   ---------------------------------------------------------------- */
const done  = {};     // { "<key>": true }
const setsMap = {};   // { "<key>": [ { w, reps, rir, type } ] }  series reales (Fase B)
const notes = {};     // { "<key>": "texto" }  +  { "sess-<x?><dia>": "feedback" }
const bests = {};     // { "<dia>-<id>": { w, reps, date } }  récord con fecha
let current = todayDow, studyMode = false, bannerHidden = false, theme = 'dark', restDefault = 0, editMode = false;
let goals = { sessions:0, volume:0 };   // metas semanales (spec §81): 0 = sin meta
let unit = 'kg';                        // unidad de PESO mostrada (spec §22/§108). Siempre se GUARDA en kg.
/* Store.load: movido al arranque (boot.js) */

/* ----------------------------------------------------------------
   4b. UTILIDADES DE CARGAS / SEGUIMIENTO
   ---------------------------------------------------------------- */
const WEIGHT_STEP = 2.5;  // incremento del stepper de peso (kg)

/* --- SERIES REALES (Fase B) · tipos y agregados de una lista de series --- */
/** Tipos de serie (spec §53). El primero es el valor por defecto. */
const SET_TYPES = [
  ['efectiva','Efectiva'], ['calentamiento','Calentamiento'], ['aproximacion','Aproximación'],
  ['fallo','Al fallo'], ['dropset','Drop set'], ['backoff','Back-off'],
  ['restpause','Rest-pause'], ['myoreps','Myo-reps'], ['superserie','Superserie']
];
/** Una serie cuenta para estadísticas salvo calentamiento/aproximación (spec §53). */
function isEffective(type){ return type !== 'calentamiento' && type !== 'aproximacion'; }
/** Volumen real = Σ (peso × reps) de las series EFECTIVAS con datos (spec §55). */
function setsVolume(arr){
  if(!Array.isArray(arr)) return 0;
  let t = 0;
  for(const s of arr){ if(s && s.w > 0 && s.reps > 0 && isEffective(s.type)) t += s.w * s.reps; }
  return t;
}
/** Mejor serie efectiva por peso (para récords y curva de progreso). */
function topSet(arr){
  let best = null;
  if(Array.isArray(arr)) for(const s of arr){
    if(s && s.w > 0 && isEffective(s.type) && (!best || s.w > best.w)) best = s;
  }
  return best;
}
/** Mejor 1RM estimado entre las series efectivas registradas. */
function best1RM(arr){
  let m = 0;
  if(Array.isArray(arr)) for(const s of arr){ if(s && isEffective(s.type)){ const r = epley1RM(s.w, s.reps); if(r > m) m = r; } }
  return m;
}
/** Nº de series efectivas registradas (con peso y reps). */
function effectiveSetCount(arr){
  if(!Array.isArray(arr)) return 0;
  return arr.filter(s => s && s.w > 0 && s.reps > 0 && isEffective(s.type)).length;
}

/** Primer número de un texto: "3" -> 3, "3–4" -> 3, "8–12" -> 8. */
function parseFirstInt(s){ const m = String(s).match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; }

/** Escapa texto para inyectarlo con seguridad dentro de un <textarea>. */
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
/** Escapa para usar dentro de un atributo entre comillas dobles (añade &quot;). */
function escapeAttr(s){ return escapeHtml(s == null ? '' : s).replace(/"/g,'&quot;'); }

/** Clave única del ejercicio en el estado: namespacing por modo (exprés = 'x'). */
function exKey(i){ return `${studyMode ? 'x' : ''}${current}-${i}`; }

/**
 * Single Source of Truth de los ejercicios a renderizar.
 * En Modo Estudio cambia el SCHEMA a la versión exprés (express),
 * resolviendo cada entrada {base, ...overrides} contra el ejercicio base.
 */
function visibleEx(day){
  if(studyMode){
    if(day.express) return day.express.map(x => ({ ...day.ex[x.base], ...x }));
    return day.ex.slice(0, 3);   // fallback si un día no define versión exprés
  }
  return day.ex;
}

/** Resuelve un ejercicio (completo o exprés) para cálculos de volumen. */
function resolveExercise(d, i, isExpress){
  const day = SCHEDULE[d];
  if(!day || day.rest) return null;
  if(isExpress && day.express){
    const x = day.express[i];
    return x ? { ...day.ex[x.base], ...x } : null;
  }
  return (day.ex && day.ex[i]) || null;
}

/** Volumen de un ejercicio = series(plan) × reps(registradas) × peso(registrado). */
function exVolume(d, i, e){
  return setsVolume(setsMap[exKey(i)]);
}

/** Volumen total del día actual (solo lo visible). */
function dayVolume(d){
  const day = SCHEDULE[d];
  if(day.rest) return 0;
  return visibleEx(day).reduce((sum, e, i) => sum + exVolume(d, i, e), 0);
}

/** Volumen de toda una semana a partir de su mapa de cargas guardado. */
function weekVolume(map){
  map = map || setsMap;
  let total = 0;
  for(const key in map){
    if(/^(x?)\d+-\d+$/.test(key)) total += setsVolume(map[key]);   // claves normales y exprés
  }
  return Math.round(total);
}

/* --- Unidad de peso (spec §22/§108): SIEMPRE se guarda en kg; solo cambia la
   visualización y la entrada. Convertimos en un único punto (formateadores +
   helpers) para que todos los números se muestren en la unidad elegida. --- */
const LB_PER_KG = 2.2046226218;
/** ${wUnit()} (almacenado) -> número en la unidad de visualización. */
function toDisp(kg){ return unit === 'lb' ? (+kg || 0) * LB_PER_KG : (+kg || 0); }
/** número en la unidad de visualización -> ${wUnit()} (para guardar). */
function toKg(disp){ return unit === 'lb' ? (+disp || 0) / LB_PER_KG : (+disp || 0); }
/** Etiqueta de la unidad actual ("kg" | "lb"). */
function wUnit(){ return unit === 'lb' ? 'lb' : 'kg'; }
/** Incremento del stepper en la unidad de visualización (2,5 kg ≈ 5 lb). */
function weightStepDisp(){ return unit === 'lb' ? 5 : WEIGHT_STEP; }

/** Formatea una cantidad de peso/volumen (guardada en kg) en la unidad elegida, con miles. */
function fmtKg(n){ return Math.round(toDisp(n)).toLocaleString('es-ES'); }
/** Igual que fmtKg pero conservando el medio (72,5) — para pesos individuales. */
function fmtWeight(n){ return toDisp(n).toLocaleString('es-ES', { maximumFractionDigits:1 }); }

/** Retrasa la ejecución: agrupa ráfagas de cambios en una sola escritura. */
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }
const debouncedSave = debounce(() => Store.save(), 400);

/* ----------------------------------------------------------------
   4c. RÉCORDS, DESCANSO Y GRÁFICAS
   ---------------------------------------------------------------- */
/** Clave del récord: día + id estable del ejercicio (compartida entre completo y exprés,
    porque el ejercicio exprés resuelto hereda el id de su ejercicio base). */
function bestKeyFor(i, e){ return `${current}-${(e && e.id) || i}`; }

/** Texto de la pista de récord para un ejercicio. */
function bestCueContent(best, cur){
  if(!best) return '⚡ Registra el peso para marcar tu primer récord';
  if(cur && cur >= best) return `🏆 ¡Récord nuevo! <b>${fmtKg(cur)} ${wUnit()}</b>`;
  return `Récord: <b>${fmtKg(best)} ${wUnit()}</b> · te faltan ${fmtKg(best - cur)} ${wUnit()}`;
}

/** Segundos de descanso a partir del texto: "2 min"->120, "90 s"->90, "2–3 min"->150. */
function parseRestSeconds(txt){
  const nums = String(txt).match(/\d+/g);
  if(!nums) return 60;
  const isMin = /min/i.test(txt);
  if(nums.length >= 2 && isMin){              // rango "2–3 min" -> promedio
    return Math.round((+nums[0] + +nums[1]) / 2 * 60);
  }
  return isMin ? (+nums[0]) * 60 : (+nums[0]);
}

/** Volumen de un día concreto sumando cargas de cualquier modo (completo + exprés). */
function dayVolumeAnyMode(d){
  let total = 0;
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m || +m[2] !== d) continue;
    total += setsVolume(setsMap[key]);
  }
  return Math.round(total);
}

/* ----------------------------------------------------------------
   MOTOR 2.0 · TIEMPO PRECISO, ESTADO Y AGREGADOS DE SESIÓN
   (ENTRENO V NEXT · Cap. I · §10/§11/§12/§14)
   ------------------------------------------------------------
   El motor deja de solo GUARDAR la sesión: empieza a medirla. El descanso
   se cronometra con exactitud (límites del temporizador start/stop); el
   tiempo activo se DERIVA (total de pared − descanso) para no acumular
   error. Todo son campos opcionales en sessions[fecha]; nada se rompe si
   faltan. Cálculo en segundo plano (principio 3.1). --- */

/** Desglose de tiempo de una sesión (spec §10). Descanso medido, activo derivado.
    setCount/exCount opcionales: si se pasan, calcula promedios por serie/ejercicio. */
function sessionTiming(sess, setCount, exCount){
  if(!sess) return { activeMs:0, restMs:0, totalMs:0, avgPerExerciseMs:0, avgPerSetMs:0 };
  const total = (sess.startedAt && sess.finishedAt) ? Math.max(0, sess.finishedAt - sess.startedAt) : 0;
  const rest  = Math.max(0, sess.restMs || 0);
  const active = total > 0 ? Math.max(0, total - rest) : 0;   // sin fin aún: no derivamos activo
  return {
    activeMs: active, restMs: rest, totalMs: total,
    avgPerExerciseMs: exCount  ? Math.round(active / exCount)  : 0,
    avgPerSetMs:      setCount ? Math.round(active / setCount) : 0
  };
}

/** Estados internos de la sesión (spec §14). El primero es el inicial. */
const SESSION_STATES = ['preparado','en_curso','pausado','finalizado','recuperado','cancelado','sincronizado'];
/** Estado actual de una sesión: el explícito, o el derivado de sus marcas de tiempo
    (compatibilidad con sesiones anteriores a la máquina de estados). */
function deriveSessionState(s){
  if(s && s.state && SESSION_STATES.includes(s.state)) return s.state;
  if(s && s.finishedAt) return 'finalizado';
  if(s && s.startedAt)  return 'en_curso';
  return 'preparado';
}
/** Escribe el estado de la sesión de una fecha y sella updatedAt (base sync, §44).
    updatedAt en CADA escritura habilita la futura resolución de conflictos sin
    tocar el dominio. Solo estados válidos; ignora fechas inexistentes. */
function setSessionState(date, state){
  const s = sessions[date];
  if(!s || !SESSION_STATES.includes(state)) return;
  s.state = state;
  s.updatedAt = Date.now();
}

/** Volumen por grupo muscular de UN día (reparte el de cada ejercicio entre sus
    músculos). Igual criterio que muscleVolumeThisWeek pero acotado al día d. */
function dayMuscleVolume(d){
  const vol = {};
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m || +m[2] !== d) continue;
    const e = resolveExercise(+m[2], +m[3], m[1] === 'x');
    if(!e || !e.m || !e.m.length) continue;
    const v = setsVolume(setsMap[key]);
    if(!v) continue;
    const share = v / e.m.length;
    e.m.forEach(mu => { vol[mu] = (vol[mu] || 0) + share; });
  }
  return vol;
}

/**
 * Gráfica de barras en SVG puro (sin dependencias).
 * data: [{ label, value, hot }]  -> hot resalta la barra (p. ej. hoy).
 */
function svgBars(data, unit){
  const W = 300, H = 130, pad = 22, gap = 8;
  const max = Math.max(1, ...data.map(d => d.value));
  const bw = (W - pad * 2 - gap * (data.length - 1)) / data.length;
  const bars = data.map((d, i) => {
    const h = Math.round((d.value / max) * (H - pad * 2));
    const x = pad + i * (bw + gap);
    const y = H - pad - h;
    const cls = d.hot ? 'cbar hot' : 'cbar';
    const lbl = d.value ? fmtKg(d.value) : '';
    return `<rect class="${cls}" x="${x.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${h}" rx="4"/>
      <text class="cval" x="${(x + bw/2).toFixed(1)}" y="${y - 4}" text-anchor="middle">${lbl}</text>
      <text class="clbl" x="${(x + bw/2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${d.label}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de ${unit}">
    <line class="caxis" x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}"/>${bars}</svg>`;
}

/** Nombre legible de cada grupo muscular. */
const MUSCLE_LABEL = {
  frontdelt:'Hombro front.', sidedelt:'Hombro lat.', reardelt:'Hombro post.',
  chest:'Pecho', biceps:'Bíceps', triceps:'Tríceps', forearms:'Antebrazo', abs:'Abdomen',
  lats:'Dorsal', upperback:'Espalda alta', lowerback:'Lumbar',
  quads:'Cuádriceps', hams:'Femoral', glutes:'Glúteo', calves:'Gemelo'
};

/** Volumen acumulado por grupo muscular esta semana (reparte el de cada ejercicio). */
function muscleVolumeThisWeek(){
  const vol = {};
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m) continue;
    const e = resolveExercise(+m[2], +m[3], m[1] === 'x');
    if(!e || !e.m || !e.m.length) continue;
    const v = setsVolume(setsMap[key]);
    if(!v) continue;
    const share = v / e.m.length;
    e.m.forEach(mu => { vol[mu] = (vol[mu] || 0) + share; });
  }
  return vol;
}

/** Barras horizontales (HTML) animadas con transform. rows: [{label, value, valText}]. */
function hBars(rows, accentVar){
  if(!rows.length) return '';
  const max = Math.max(1, ...rows.map(r => r.value));
  return rows.map(r => {
    const pct = Math.max(3, Math.round(r.value / max * 100));
    return `<div class="hbar-row">
      <span class="hbar-lbl">${r.label}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${pct}%;--accent:var(${accentVar || '--pull'})"></span></span>
      <span class="hbar-val">${r.valText}</span>
    </div>`;
  }).join('');
}

/** Gráfica de área para la tendencia semanal. points: [{label, value}]. */
function svgArea(points){
  const W = 320, H = 150, padL = 34, padR = 8, padT = 14, padB = 22;
  const max = Math.max(1, ...points.map(p => p.value));
  const n = points.length;
  const xAt = i => padL + (n === 1 ? (W - padL - padR)/2 : i * (W - padL - padR) / (n - 1));
  const yAt = v => H - padB - (v / max) * (H - padB - padT);
  // Rejilla horizontal + etiquetas del eje Y (0 · mitad · máx) para lectura precisa.
  const grid = [0, 0.5, 1].map(f => {
    const val = max * f, y = yAt(val).toFixed(1);
    return `<line class="area-grid" x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}"/>
      <text class="axis-lbl" x="${padL-6}" y="${(+y+3).toFixed(1)}" text-anchor="end">${fmtKg(val)}</text>`;
  }).join('');
  const pts = points.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`);
  const area = `M ${xAt(0).toFixed(1)},${(H-padB).toFixed(1)} L ${pts.join(' L ')} L ${xAt(n-1).toFixed(1)},${(H-padB).toFixed(1)} Z`;
  const marks = points.map((p, i) => {
    const last = i === n-1;
    return `<circle class="area-dot${last ? ' last' : ''}" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.value).toFixed(1)}" r="${last ? 3.6 : 2.6}"/>
     <text class="axis-lbl" x="${xAt(i).toFixed(1)}" y="${H-6}" text-anchor="middle">${p.label}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendencia de volumen semanal">
    ${grid}<path class="area-fill" d="${area}"/><path class="area-line" d="M ${pts.join(' L ')}"/>${marks}</svg>`;
}

/**
 * Heatmap de constancia estilo "commits de GitHub": una casilla por semana
 * (hasta 12), coloreada en 5 niveles según el volumen de esa semana respecto
 * al máximo. La semana en curso lleva un anillo. Crece cada lunes al archivarse.
 */
function consistencyHeatmap(weekNow){
  const curWk = weekId();
  const weeks = [
    ...weeklyVolumes().filter(w => w.weekId < curWk).map(w => ({ id:w.weekId, vol:w.volume })),
    { id: curWk, vol: weekNow, now:true }
  ].slice(-12);
  const max = Math.max(1, ...weeks.map(w => w.vol));
  const level = v => v <= 0 ? 0 : v < max*0.25 ? 1 : v < max*0.5 ? 2 : v < max*0.75 ? 3 : 4;
  const cells = weeks.map(w => {
    const dd = w.id.slice(5).replace('-', '/');   // "MM/DD"
    const txt = w.vol > 0 ? `${dd}: ${fmtKg(w.vol)} ${wUnit()}` : `${dd}: sin registro`;
    return `<span class="heat-cell l${level(w.vol)}${w.now ? ' now' : ''}" title="Semana ${txt}"></span>`;
  }).join('');
  return `<div class="heat">${cells}</div>
    <div class="heat-legend"><span>Menos</span>
      <span class="heat-cell l0"></span><span class="heat-cell l1"></span><span class="heat-cell l2"></span><span class="heat-cell l3"></span><span class="heat-cell l4"></span>
      <span>Más</span></div>`;
}

/* ----------------------------------------------------------------
   5. MAPAS MUSCULARES (SVG)
   ---------------------------------------------------------------- */
function hasAny(m, set){ return m.some(x => set.includes(x)); }

/** Color de cada grupo muscular (paleta elegante para AMOLED). */
const MUSCLE_COLOR = {
  lats:'#37AEF0', upperback:'#49B9E8', lowerback:'#5CC6E0',           // espalda · azul
  frontdelt:'#B888F7', sidedelt:'#C99AF8', reardelt:'#A877E8',        // hombros · violeta
  chest:'#FF8559',                                                    // pecho · coral
  biceps:'#F4B73E', triceps:'#F2C44C', forearms:'#E3AB33',            // brazos · ámbar
  abs:'#34D6C0',                                                      // core · cian
  quads:'#A6E024', hams:'#86CC4A', glutes:'#74C238', calves:'#B9E85A' // pierna · verde
};
/** Atributos del músculo: activo -> color de su grupo (el degradado #mg usa currentColor). */
function muscleAttr(t, m){
  return m.includes(t)
    ? `class="muscle on" style="color:${MUSCLE_COLOR[t] || 'var(--accent)'}"`
    : 'class="muscle"';
}

/* Silueta base compartida (frente y espalda): cabeza, cuello, torso, brazos y
   piernas en gris tenue (.ghost). Encima se pintan los músculos coloreables.
   viewBox 100×230, simétrica respecto a x=50. */
const GHOST_BODY = `
 <circle class="ghost" cx="50" cy="15" r="9.5"/>
 <path class="ghost" d="M44 23 q6 4 12 0 l-1 7 q-5 3 -10 0 z"/>
 <path class="ghost" d="M50 28 C61 28 67 33 69 43 C71 53 68 67 65 83 C63 96 62 102 61 109 C60 116 62 119 59 121 C55 123 45 123 41 121 C38 119 40 116 39 109 C38 102 37 96 35 83 C32 67 29 53 31 43 C33 33 39 28 50 28 Z"/>
 <path class="ghost" d="M33 42 C26 45 22 55 20 74 C18 90 17 104 19 116 C20 122 25 122 26 116 C28 103 32 84 35 66 C37 54 37 46 34 43 Z"/>
 <path class="ghost" d="M67 42 C74 45 78 55 80 74 C82 90 83 104 81 116 C80 122 75 122 74 116 C72 103 68 84 65 66 C63 54 63 46 66 43 Z"/>
 <path class="ghost" d="M41 120 C34 122 33 135 34 155 C35 174 37 192 40 209 C41 218 47 218 48 208 C49 190 49 160 49 138 C49 128 47 119 41 120 Z"/>
 <path class="ghost" d="M59 120 C66 122 67 135 66 155 C65 174 63 192 60 209 C59 218 53 218 52 208 C51 190 51 160 51 138 C51 128 53 119 59 120 Z"/>`;

function frontSVG(m){const a=t=>muscleAttr(t,m);return `<svg viewBox="0 0 100 230" aria-hidden="true">${GHOST_BODY}
 <path ${a('frontdelt')} d="M34 44 C27 44 21 49 19 57 C25 55 31 54 37 54 C41 51 39 45 34 44 Z"/>
 <path ${a('frontdelt')} d="M66 44 C73 44 79 49 81 57 C75 55 69 54 63 54 C59 51 61 45 66 44 Z"/>
 <ellipse ${a('sidedelt')} cx="20" cy="60" rx="5" ry="9"/>
 <ellipse ${a('sidedelt')} cx="80" cy="60" rx="5" ry="9"/>
 <path ${a('chest')} d="M49 54 C40 53 33 57 31 65 C30 72 35 78 44 77 C48 76 49 73 49 66 Z"/>
 <path ${a('chest')} d="M51 54 C60 53 67 57 69 65 C70 72 65 78 56 77 C52 76 51 73 51 66 Z"/>
 <ellipse ${a('biceps')} cx="19" cy="75" rx="6" ry="13"/>
 <ellipse ${a('biceps')} cx="81" cy="75" rx="6" ry="13"/>
 <ellipse ${a('forearms')} cx="17" cy="103" rx="5.5" ry="15"/>
 <ellipse ${a('forearms')} cx="83" cy="103" rx="5.5" ry="15"/>
 <path ${a('abs')} d="M42 79 C46 77 54 77 58 79 C61 80 61 84 61 88 L60 104 C60 108 57 110 54 110 L46 110 C43 110 40 108 40 104 L39 88 C39 84 39 80 42 79 Z"/>
 <path class="sep" d="M50 80 V109 M42 89 H58 M41 99 H59"/>
 <path ${a('quads')} d="M40 124 C34 126 34 139 35 157 C36 169 39 177 44 176 C48 175 48 165 47 151 C46 137 46 126 44 124 C43 123 41 123 40 124 Z"/>
 <path ${a('quads')} d="M60 124 C66 126 66 139 65 157 C64 169 61 177 56 176 C52 175 52 165 53 151 C54 137 54 126 56 124 C57 123 59 123 60 124 Z"/>
 <path class="sep" d="M43 130 C41 146 42 162 44 174 M57 130 C59 146 58 162 56 174"/></svg>`;}

function backSVG(m){const a=t=>muscleAttr(t,m);return `<svg viewBox="0 0 100 230" aria-hidden="true">${GHOST_BODY}
 <path ${a('reardelt')} d="M34 44 C27 44 21 49 19 57 C25 55 31 54 37 54 C41 51 39 45 34 44 Z"/>
 <path ${a('reardelt')} d="M66 44 C73 44 79 49 81 57 C75 55 69 54 63 54 C59 51 61 45 66 44 Z"/>
 <path ${a('upperback')} d="M50 33 C56 33 63 37 67 43 C64 53 58 59 50 60 C42 59 36 53 33 43 C37 37 44 33 50 33 Z"/>
 <path class="sep" d="M50 35 V59"/>
 <path ${a('lats')} d="M49 61 C42 61 36 65 35 75 C34 86 40 98 49 102 C49 88 49 74 49 61 Z"/>
 <path ${a('lats')} d="M51 61 C58 61 64 65 65 75 C66 86 60 98 51 102 C51 88 51 74 51 61 Z"/>
 <ellipse ${a('triceps')} cx="19" cy="75" rx="6" ry="13"/>
 <ellipse ${a('triceps')} cx="81" cy="75" rx="6" ry="13"/>
 <path ${a('lowerback')} d="M44 101 C47 100 53 100 56 101 C57 106 56 111 55 114 C52 115 48 115 45 114 C44 111 43 106 44 101 Z"/>
 <path ${a('glutes')} d="M49 116 C42 116 35 120 35 130 C35 139 42 144 49 142 C49 133 49 124 49 116 Z"/>
 <path ${a('glutes')} d="M51 116 C58 116 65 120 65 130 C65 139 58 144 51 142 C51 133 51 124 51 116 Z"/>
 <path class="sep" d="M50 116 V142"/>
 <path ${a('hams')} d="M40 145 C35 147 35 159 37 171 C39 179 43 180 45 173 C46 161 46 149 44 145 C43 144 41 144 40 145 Z"/>
 <path ${a('hams')} d="M60 145 C65 147 65 159 63 171 C61 179 57 180 55 173 C54 161 54 149 56 145 C57 144 59 144 60 145 Z"/>
 <path ${a('calves')} d="M40 185 C36 187 37 199 39 209 C41 216 44 216 45 208 C46 198 45 188 43 185 C42 184 41 184 40 185 Z"/>
 <path ${a('calves')} d="M60 185 C64 187 63 199 61 209 C59 216 56 216 55 208 C54 198 55 188 57 185 C58 184 59 184 60 185 Z"/></svg>`;}

function heroMap(m){return `<div class="map"><div class="fig">${frontSVG(m)}<small>Frente</small></div><div class="fig">${backSVG(m)}<small>Espalda</small></div></div>`;}
function miniMap(m){let h='';if(hasAny(m,FRONT))h+=frontSVG(m);if(hasAny(m,BACK))h+=backSVG(m);return `<div class="mini">${h}</div>`;}

/** Figura anatómica compacta por ejercicio: muestra el lado (frente/espalda)
    con más músculos trabajados, para no recargar la tarjeta con dos siluetas. */
function exFig(m){
  if(!m || !m.length) return '';
  // Manda el músculo PRINCIPAL (el primero de la lista suele ser el objetivo);
  // si no es concluyente, decide por qué lado tiene más músculos trabajados.
  const useBack = BACK.includes(m[0]) ? true
                : FRONT.includes(m[0]) ? false
                : m.filter(x => BACK.includes(x)).length > m.filter(x => FRONT.includes(x)).length;
  return `<div class="exfig" aria-hidden="true">${useBack ? backSVG(m) : frontSVG(m)}</div>`;
}

/** Clave de la nota de sesión (por día y modo). Feedback general del entreno. */
function sessKey(){ return `sess-${studyMode ? 'x' : ''}${current}`; }
function sessionNote(){ return notes[sessKey()] || ''; }

