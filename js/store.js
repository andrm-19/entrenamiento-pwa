/* ============================================================
   Entreno V — 2. Persistencia: DB / IndexedDB / repositorios / estado
   Arquitectura modular (spec §10/§116): scripts clásicos cargados en orden,
   mismo scope global; sin build. El orden en index.html es significativo.
   ============================================================ */
/* ----------------------------------------------------------------
   3. CAPA DE PERSISTENCIA  (Store -> localStorage)  ·  ESQUEMA v2
   ------------------------------------------------------------
   FASE 1 — De "libreta de la semana" a "archivador por fecha".
   Antes: un único objeto con la semana en curso que se BORRABA al
   cambiar de semana (solo quedaba un resumen). Ahora: un REGISTRO
   HISTÓRICO de sesiones fechadas que NO se borra nunca.

   Guardado (clave nueva 'entrenoV.state.v2'):
     sessions:      { "<YYYY-MM-DD>": { dayType, full:{ex,note}, express:{ex,note} } }
                    ex: { "<id>": { sets:[{w,reps}], done, note } }   (id = slug estable)
     bests:         { "<dia>-<id>": { w, reps, date } }               (récord CON fecha)
     legacyHistory: { "<weekId>": { volume, completed } }             (resúmenes v1, preservados)
     ui:            { current, studyMode, bannerHidden }

   En memoria seguimos usando mapas de trabajo por posición
   (done/loads/notes, clave `${x?}${dia}-${idx}`) para NO tocar la UI:
   al cargar los hidratamos desde 'sessions' y al guardar los volcamos
   de vuelta. La traducción posición<->id y día<->fecha vive AQUÍ.
   La v1 NO se borra: queda como respaldo silencioso.
   Todo en try/catch: si algo falla, la app no se rompe.
   ---------------------------------------------------------------- */

/** Slug estable a partir del nombre: minúsculas, sin tildes, sin puntuación. */
function slugify(name){
  return String(name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita tildes (marcas combinantes)
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');
}
// Congelamos un id estable (slug) en cada ejercicio del plan (una sola vez, al arrancar).
/* freezeExerciseIds: movido al arranque (boot.js) */
// Copia PRISTINA del plan por defecto (antes de aplicar ediciones): permite "Restaurar
// plan original" en el editor (spec §46). Dato puro serializable -> clon por JSON.
/* DEFAULT_SCHEDULE: movido al arranque (boot.js) */

/* --- Utilidades de fecha (complementan las de §2) --- */
function ymd(dt){ const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), d=String(dt.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function parseYmd(s){ const [y,m,d]=String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); }
function addDays(dt, n){ const x=new Date(dt); x.setDate(dt.getDate()+n); return x; }
function dowOffset(day){ return day===0 ? 6 : day-1; }               // lunes=0 … domingo=6
/** Lunes (YYYY-MM-DD) de la semana que contiene una fecha dada. */
function weekMondayOf(dateStr){ const d=parseYmd(dateStr); const off = d.getDay()===0 ? -6 : 1-d.getDay(); return ymd(addDays(d, off)); }
/** Fecha real (YYYY-MM-DD) del día 'd' (0–6) en la semana ACTUAL. */
function dateOfDay(d){ return ymd(dateForDow(d)); }

/* --- Estado persistente (esquema v2). Se llena al cargar. --- */
const sessions = {};        // { "<fecha>": { dayType, full:{ex,note}, express:{ex,note} } }
const legacyHistory = {};   // resúmenes v1 preservados (semanas sin detalle)

/* Adaptador de persistencia: ÚNICO punto de acceso a la base de datos local
   (Fase F · spec §14/§15/§115 — inversión de dependencias). Hoy sobre localStorage;
   para migrar a IndexedDB basta reimplementar read/write/remove aquí, sin tocar
   Store, los servicios ni el dominio. */
const DB = {
  read(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } },
  write(key, val){ try{ localStorage.setItem(key, val); return true; }catch(e){ return false; } },
  remove(key){ try{ localStorage.removeItem(key); }catch(e){ /* sin persistencia: sigue en memoria */ } }
};

/* Capa IndexedDB (spec §11/§15/§120): almacén clave-valor durable.
   IndexedDB resiste mejor que localStorage (no lo borra la limpieza "ligera"
   del navegador ni el desalojo por espacio), así que actúa como FUENTE DURABLE.
   localStorage se conserva como espejo síncrono para un arranque instantáneo
   (sin parpadeo), respaldo y exportación. Todo con feature-detect + try/catch:
   si IndexedDB no está disponible, la app sigue funcionando con localStorage.
   Migrar a stores relacionales (workouts/sets/…) será reimplementar esto sin
   tocar Store, servicios ni dominio (inversión de dependencias, spec §115). */
const IDB = {
  NAME: 'entrenoV', STORE: 'kv', _promise: null,
  _open(){
    if(this._promise) return this._promise;
    this._promise = new Promise((resolve)=>{
      try{
        if(!('indexedDB' in self)){ resolve(null); return; }
        const req = indexedDB.open(this.NAME, 1);
        req.onupgradeneeded = ()=>{ const db = req.result; if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
        req.onsuccess = ()=> resolve(req.result);
        req.onerror   = ()=> resolve(null);
      }catch(e){ resolve(null); }
    });
    return this._promise;
  },
  async get(key){
    const db = await this._open(); if(!db) return null;
    return new Promise((resolve)=>{ try{
      const r = db.transaction(this.STORE,'readonly').objectStore(this.STORE).get(key);
      r.onsuccess = ()=> resolve(r.result == null ? null : r.result);
      r.onerror   = ()=> resolve(null);
    }catch(e){ resolve(null); } });
  },
  async set(key, val){
    if(val == null) return false;
    const db = await this._open(); if(!db) return false;
    return new Promise((resolve)=>{ try{
      const t = db.transaction(this.STORE,'readwrite');
      t.objectStore(this.STORE).put(val, key);
      t.oncomplete = ()=> resolve(true);
      t.onerror    = ()=> resolve(false);
    }catch(e){ resolve(false); } });
  }
};
/* Candado: no espejamos a IndexedDB hasta reconciliar en el arranque, para no
   sobrescribir datos durables con un estado vacío (p. ej. si localStorage se
   limpió pero IndexedDB conserva el historial). */
let idbReconciled = false;

const Store = {
  KEY:    'entrenoV.state.v4',
  KEY_V3: 'entrenoV.state.v3',
  KEY_V2: 'entrenoV.state.v2',
  KEY_V1: 'entrenoV.state.v1',

  /** Carga la v4 (o migra en cadena v1→v2→v3→v4) y deja todo hidratado en memoria.
      Las versiones anteriores NO se borran: quedan como respaldo silencioso.
      v3 → v4 (Motor 2.0): el esquema de sesiones es compatible; solo se AÑADEN
      campos opcionales (state/updatedAt/restMs). applyState los deriva y save()
      sella la v4 sin perder nada. */
  load(){
    try{
      const rawV4 = DB.read(this.KEY);
      if(rawV4){ applyState(JSON.parse(rawV4)); return; }

      const rawV3 = DB.read(this.KEY_V3);
      if(rawV3){ applyState(JSON.parse(rawV3)); this.save(); return; }

      // v2 → v3: el esquema de sesiones es compatible (las series ya eran array).
      // applyState hidrata (type='efectiva' por defecto) y save() sella la versión.
      const rawV2 = DB.read(this.KEY_V2);
      if(rawV2){ applyState(JSON.parse(rawV2)); this.save(); return; }

      const rawV1 = DB.read(this.KEY_V1);
      if(rawV1){ applyState(migrateV1toV2(JSON.parse(rawV1))); this.save(); return; }

      // Nada previo: estado nuevo, limpio.
      current = todayDow; studyMode = false; bannerHidden = false;
    }catch(e){
      current = todayDow; studyMode = false; bannerHidden = false;
    }
  },

  /** Reconciliación durable (spec §6/§33/§209 · nunca perder datos):
      · IndexedDB tiene datos y localStorage NO -> restaura desde IndexedDB y repinta.
      · localStorage tiene datos y IndexedDB NO -> siembra IndexedDB.
      Tras esto habilita el espejo continuo a IndexedDB. Se llama una vez, al arrancar. */
  async reconcileDurable(){
    try{
      const idbRaw = await IDB.get(this.KEY);
      const lsRaw  = DB.read(this.KEY);
      if(idbRaw && !lsRaw){
        applyState(JSON.parse(idbRaw));   // localStorage se limpió: IndexedDB salva los datos
        DB.write(this.KEY, idbRaw);
        renderDays(); render();
      }
      idbReconciled = true;
      const truth = DB.read(this.KEY);     // fuente vigente ya reconciliada
      if(truth) IDB.set(this.KEY, truth);  // siembra/sincroniza IndexedDB
    }catch(e){ idbReconciled = true; }
  },

  /** Vuelca los mapas de trabajo a 'sessions' y persiste el objeto v3
      (localStorage síncrono + espejo durable en IndexedDB). */
  save(){
    try{
      syncSessionsFromWorking();
      const json = JSON.stringify({
        schemaVersion: 4,
        ui: { current, studyMode, bannerHidden, theme, restDefault, goals, unit, levelSeen, coachMode },
        sessions,
        bests,
        legacyHistory
      });
      DB.write(this.KEY, json);
      if(idbReconciled) IDB.set(this.KEY, json);   // espejo durable (async, fire-and-forget)
    }catch(e){ /* almacenamiento no disponible: la app sigue en memoria */ }
  }
};

/* ================================================================
   MODELOS DEL DOMINIO (spec §20-27) · tipos por JSDoc, sin build.
   Documentan la forma de cada entidad para el refactor modular.
   ----------------------------------------------------------------
   @typedef {Object} Routine       Rutina/día del plan (editable).
     @property {string} type       Nombre visible ("Empuje", "Tirón"…).
     @property {string} sub        Subtítulo (grupos musculares).
     @property {string} key        Clave de color (push/pull/legs/upper).
     @property {string[]} muscles  Músculos destacados en el mapa.
     @property {Exercise[]} ex      Ejercicios completos.
     @property {Object[]} [express] Variante exprés (índices base + overrides).
     @property {boolean} [rest]     Día de descanso.

   @typedef {Object} Exercise      Ejercicio de la biblioteca/rutina.
     @property {string} id         Slug estable (slugify del nombre).
     @property {string} n          Nombre.
     @property {string} p          Propósito/énfasis.
     @property {string} s          Series objetivo ("4", "3–4").
     @property {string} r          Reps objetivo ("8–12").
     @property {string} d          Descanso sugerido ("2 min").
     @property {string[]} m        Grupos musculares trabajados.
     @property {string} q          Búsqueda de vídeo (YouTube).
     @property {string[]} tech     Pasos de técnica.

   @typedef {Object} SetEntry      Serie registrada (spec §27).
     @property {number} w          Peso. @property {number} reps  Repeticiones.
     @property {number|''} rir     RIR. @property {string} type   Tipo (§53).

   @typedef {Object} PersonalRecord  Récord (spec §28).
     @property {number} w @property {number} reps @property {string|null} date
   ================================================================ */

/* Repositorio de rutinas (spec §14/§46/§120): ÚNICO punto de acceso a las
   ediciones de rutina del usuario, sobre IndexedDB. El plan por defecto
   (SCHEDULE) es la semilla síncrona para un primer render instantáneo; encima
   se aplican los overrides guardados. Aún sin editor de UI: esta es la capa
   que lo habilitará (crear/editar/duplicar/reordenar) sin tocar el dominio. */
const RoutineRepository = {
  KEY: 'entrenoV.plan.v1',
  /** Overrides desde localStorage (síncrono, para el primer render sin parpadeo). */
  loadSync(){ try{ const raw = DB.read(this.KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } },
  /** Overrides desde IndexedDB (capa durable). */
  async loadIDB(){ try{ const raw = await IDB.get(this.KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } },
  /** Persiste un parche por día en localStorage (sync) + IndexedDB (durable).
      patch p.ej. { ex:[...], express:[...] } o { type, sub }. */
  async saveDay(dow, patch){
    try{
      const ov = this.loadSync() || {};
      ov[dow] = Object.assign({}, ov[dow], patch);
      const json = JSON.stringify(ov);
      DB.write(this.KEY, json);      // espejo síncrono
      IDB.set(this.KEY, json);       // durable (async, fire-and-forget)
      return true;
    }catch(e){ return false; }
  },
  /** Borra el override de un día (para "Restaurar plan original", spec §46). */
  removeDay(dow){
    try{
      const ov = this.loadSync(); if(!ov || !(dow in ov)) return;
      delete ov[dow];
      const json = JSON.stringify(ov);
      DB.write(this.KEY, json); IDB.set(this.KEY, json);
    }catch(e){ /* sin persistencia: queda en memoria */ }
  },
  /** Mergea un objeto de overrides sobre SCHEDULE en memoria. Devuelve si cambió. */
  _merge(ov){
    let changed = false;
    for(const dow in ov){ if(SCHEDULE[dow]){ Object.assign(SCHEDULE[dow], ov[dow]); changed = true; } }
    if(changed) freezeExerciseIds();
    return changed;
  },
  /** Aplica overrides ANTES del primer render (síncrono). Sin overrides -> no-op. */
  applySync(){ const ov = this.loadSync(); if(ov) this._merge(ov); },
  /** Reconciliación durable (spec §33): si localStorage se limpió pero IndexedDB
      conserva las ediciones de rutina, las restaura y repinta. Tras el primer render. */
  async applyOverrides(){
    try{
      const idb = await this.loadIDB();
      const ls  = this.loadSync();
      if(idb && !ls){ DB.write(this.KEY, JSON.stringify(idb)); if(this._merge(idb)){ renderDays(); render(); } }
      else if(ls && !idb){ IDB.set(this.KEY, JSON.stringify(ls)); }
    }catch(e){ /* sin overrides: se queda el plan por defecto */ }
  }
};
/** Congela un id estable (slug) en cada ejercicio del plan que no lo tenga. */
function freezeExerciseIds(){
  ORDER.forEach(d => { const day = SCHEDULE[d]; if(day && day.ex) day.ex.forEach(e => { if(!e.id) e.id = slugify(e.n); }); });
}

/** Copia un estado v2 (leído o recién migrado) a las variables en memoria. */
function applyState(st){
  const ui = (st && st.ui) || {};
  current      = (ui.current in SCHEDULE) ? ui.current : todayDow;
  studyMode    = !!ui.studyMode;
  bannerHidden = !!ui.bannerHidden;
  theme        = (ui.theme === 'light') ? 'light' : 'dark';
  restDefault  = +ui.restDefault || 0;
  goals        = Object.assign({ sessions:0, volume:0 }, (ui.goals || {}));
  unit         = (ui.unit === 'lb') ? 'lb' : 'kg';
  levelSeen    = +ui.levelSeen || 0;
  coachMode    = !!ui.coachMode;
  Object.assign(sessions, (st && st.sessions) || {});
  Object.assign(bests, (st && st.bests) || {});
  Object.assign(legacyHistory, (st && st.legacyHistory) || {});
  // v3→v4 (Motor 2.0): sella un estado explícito y un updatedAt a cada sesión que
  // aún no los tenga (derivados de sus marcas de tiempo). No sobrescribe los ya
  // presentes; base sync-ready (§14/§44). Sesiones previas quedan bien clasificadas.
  for(const date in sessions){
    const s = sessions[date];
    if(!s.state)     s.state = deriveSessionState(s);
    if(!s.updatedAt) s.updatedAt = s.finishedAt || s.startedAt || null;
  }
  hydrateWorkingMaps();     // reconstruye done/loads/notes de la semana actual
}

/** Reconstruye los mapas de trabajo (done/loads/notes) de la SEMANA ACTUAL
    a partir de 'sessions'. Solo la semana en curso vive en esos mapas. */
function hydrateWorkingMaps(){
  for(const k in done) delete done[k];
  for(const k in setsMap) delete setsMap[k];
  for(const k in notes) delete notes[k];
  for(const d of ORDER){
    const day = SCHEDULE[d]; if(day.rest) continue;
    const sess = sessions[dateOfDay(d)];
    if(!sess) continue;
    if(sess.full){
      (day.ex||[]).forEach((e,i)=>{
        const cell = sess.full.ex && sess.full.ex[e.id];
        if(!cell) return;
        if(cell.done) done[`${d}-${i}`] = true;
        if(cell.sets && cell.sets.length) setsMap[`${d}-${i}`] = cell.sets.map(cleanSet);
        if(cell.note) notes[`${d}-${i}`] = cell.note;
      });
      if(sess.full.note) notes[`sess-${d}`] = sess.full.note;
    }
    if(sess.express && day.express){
      day.express.forEach((x,i)=>{
        const base = day.ex[x.base]; if(!base) return;
        const cell = sess.express.ex && sess.express.ex[base.id];
        if(!cell) return;
        if(cell.done) done[`x${d}-${i}`] = true;
        if(cell.sets && cell.sets.length) setsMap[`x${d}-${i}`] = cell.sets.map(cleanSet);
        if(cell.note) notes[`x${d}-${i}`] = cell.note;
      });
      if(sess.express.note) notes[`sess-x${d}`] = sess.express.note;
    }
  }
}
/** Normaliza una serie leída de disco a la forma de trabajo {w,reps,rir,type}. */
function cleanSet(s){
  return { w:(+s.w||0), reps:(+s.reps||0),
           rir:(s.rir===0||s.rir)?String(s.rir):'',
           type:s.type||'efectiva' };
}

/** Vuelca los mapas de trabajo de la semana actual a 'sessions' (por fecha).
    No toca sesiones de otras fechas: el histórico solo crece. */
function syncSessionsFromWorking(){
  for(const d of ORDER){
    const day = SCHEDULE[d]; if(day.rest) continue;
    const date = dateOfDay(d);
    const fullEx = {};
    (day.ex||[]).forEach((e,i)=>{ const cell = buildCell(`${d}-${i}`); if(cell) fullEx[e.id] = cell; });
    const expEx = {};
    if(day.express) day.express.forEach((x,i)=>{ const base = day.ex[x.base]; if(!base) return; const cell = buildCell(`x${d}-${i}`); if(cell) expEx[base.id] = cell; });
    const fullNote = notes[`sess-${d}`] || '';
    const expNote  = notes[`sess-x${d}`] || '';
    // Solo creamos/actualizamos la fecha si hay algo (o si ya existía).
    if(sessions[date] || Object.keys(fullEx).length || Object.keys(expEx).length || fullNote || expNote){
      const meta = sessions[date] || {};   // conserva el ciclo de vida de la sesión (Fase C)
      sessions[date] = { dayType:d, full:{ex:fullEx, note:fullNote}, express:{ex:expEx, note:expNote},
        startedAt: meta.startedAt || null, finishedAt: meta.finishedAt || null, snapshot: meta.snapshot || null,
        // Motor 2.0 (§10/§14): tiempo de descanso medido, estado y sello de cambio.
        restMs: meta.restMs || 0, state: meta.state || null, updatedAt: meta.updatedAt || null };
    }
  }
}

/** Construye la celda {sets,done,note} de una clave de trabajo, o null si vacía.
    Persiste TODAS las series con datos (peso o reps), con su RIR y tipo. */
function buildCell(key){
  const arr = setsMap[key], dn = done[key], nt = notes[key];
  const cell = {};
  const clean = Array.isArray(arr)
    ? arr.filter(s => s && (s.w || s.reps)).map(s => {
        const out = { w:(+s.w||0), reps:(+s.reps||0), type:s.type||'efectiva' };
        if(s.rir !== '' && s.rir != null) out.rir = +s.rir;
        return out;
      })
    : [];
  if(clean.length) cell.sets = clean;
  if(dn) cell.done = true;
  if(nt) cell.note = nt;
  return Object.keys(cell).length ? cell : null;
}

/** Convierte un estado v1 (semana en curso + resúmenes) a v2 (sesiones fechadas).
    NO inventa datos: lo que la v1 no guardó (fechas de récords viejos, detalle de
    semanas ya resumidas) queda tal cual (récords sin fecha, tendencia en
    'legacyHistory'). Nada se pierde. */
function migrateV1toV2(v1){
  const week = v1.week || weekId();
  const st = { schemaVersion:2, ui:{}, sessions:{}, bests:{}, legacyHistory:{} };
  st.ui.current      = (v1.current in SCHEDULE) ? v1.current : todayDow;
  st.ui.studyMode    = !!v1.studyMode;
  st.ui.bannerHidden = !!v1.bannerHidden;

  const dateInWeek = day => ymd(addDays(parseYmd(week), dowOffset(day)));
  const ensure = (date, day) => (st.sessions[date] || (st.sessions[date] = { dayType:day, full:{ex:{},note:''}, express:{ex:{},note:''} }));
  const slugAt = (day, idx, isX) => {
    const dd = SCHEDULE[day]; if(!dd || dd.rest) return null;
    if(isX){ const x = dd.express && dd.express[idx]; const base = x && dd.ex[x.base]; return base ? base.id : null; }
    const e = dd.ex && dd.ex[idx]; return e ? e.id : null;
  };
  const putCell = (mode, day, slug, patch) => {
    const cell = ensure(dateInWeek(day), day)[mode].ex; (cell[slug] || (cell[slug] = {}));
    Object.assign(cell[slug], patch);
  };
  const scan = (map, apply) => { for(const key in (map||{})){ const m = key.match(/^(x?)(\d+)-(\d+)$/); if(!m) continue; const isX=m[1]==='x', day=+m[2], idx=+m[3], slug=slugAt(day,idx,isX); if(slug) apply(isX?'express':'full', day, slug, key); } };

  scan(v1.loads, (mode,day,slug,key)=>{ const ld=v1.loads[key]; if(ld && (ld.w||ld.reps)) putCell(mode,day,slug,{ sets:[{w:ld.w||0,reps:ld.reps||0}] }); });
  scan(v1.done,  (mode,day,slug,key)=>{ if(v1.done[key]) putCell(mode,day,slug,{ done:true }); });
  scan(v1.notes, (mode,day,slug,key)=>{ const t=v1.notes[key]; if(t) putCell(mode,day,slug,{ note:t }); });

  // Notas de sesión v1: claves "sess-<x?><dia>".
  for(const key in (v1.notes||{})){
    const m = key.match(/^sess-(x?)(\d+)$/); if(!m) continue;
    const isX=m[1]==='x', day=+m[2], txt=v1.notes[key]; if(!txt) continue;
    ensure(dateInWeek(day), day)[isX?'express':'full'].note = txt;
  }

  // Récords v1 (por posición, sin fecha) -> por id, fecha desconocida (null).
  for(const key in (v1.bests||{})){
    const m = key.match(/^(\d+)-(\d+)$/); if(!m) continue;
    const day=+m[1], idx=+m[2], dd=SCHEDULE[day], e=dd && dd.ex && dd.ex[idx]; if(!e) continue;
    st.bests[`${day}-${e.id}`] = { w:(v1.bests[key].w||0), reps:0, date:null };
  }

  // Tendencia acumulada (resúmenes v1) -> legacyHistory.
  Object.assign(st.legacyHistory, v1.history || {});
  return st;
}

/* --- Consultas de lectura del histórico (para récords y gráficas) --- */
/** Resuelve un ejercicio guardado (dia,id,modo) contra el plan actual. */
function resolveBySlug(dayType, slug, mode){
  const day = SCHEDULE[dayType]; if(!day || day.rest) return null;
  if(mode==='express' && day.express){
    for(const x of day.express){ const base=day.ex[x.base]; if(base && base.id===slug) return {...base, ...x}; }
    return null;
  }
  return (day.ex||[]).find(e=>e.id===slug) || null;
}
/** Volumen de una sesión (ambos modos): series(plan) × reps × peso. */
function sessionVolume(sess){
  if(!sess) return 0; let total=0;
  ['full','express'].forEach(mode=>{
    const bag = sess[mode] && sess[mode].ex; if(!bag) return;
    for(const slug in bag){ total += setsVolume(bag[slug] && bag[slug].sets); }
  });
  return Math.round(total);
}
/** Volumen por semana (lunes) combinando el histórico real + resúmenes v1. */
function weeklyVolumes(){
  const byWeek = {};
  for(const date in sessions){ const wk = weekMondayOf(date); byWeek[wk] = (byWeek[wk]||0) + sessionVolume(sessions[date]); }
  for(const wk in legacyHistory){ if(!(wk in byWeek)) byWeek[wk] = legacyHistory[wk].volume || 0; }
  return Object.keys(byWeek).sort().map(wk => ({ weekId:wk, volume:Math.round(byWeek[wk]) }));
}
/** Volumen por mes ("YYYY-MM") a partir del histórico. Ascendente. */
function monthlyVolumes(){
  const by = {};
  for(const date in sessions){ const m = date.slice(0,7); by[m] = (by[m]||0) + sessionVolume(sessions[date]); }
  return Object.keys(by).sort().map(m => ({ key:m, volume:Math.round(by[m]) }));
}
/** Volumen por año ("YYYY") a partir del histórico. Ascendente. */
function yearlyVolumes(){
  const by = {};
  for(const date in sessions){ const y = date.slice(0,4); by[y] = (by[y]||0) + sessionVolume(sessions[date]); }
  return Object.keys(by).sort().map(y => ({ key:y, volume:Math.round(by[y]) }));
}
/** Volumen medio POR SESIÓN de un mes ("YYYY-MM"), excluyendo opcionalmente una
    fecha (la de hoy) para comparar la sesión recién cerrada contra las previas
    del mes (spec §12 · comparación con la media mensual). 0 si no hay referencia. */
function monthlyAvgSessionVolume(monthKey, excludeDate){
  let sum = 0, n = 0;
  for(const date in sessions){
    if(date.slice(0,7) !== monthKey || date === excludeDate) continue;
    const v = sessionVolume(sessions[date]);
    if(v > 0){ sum += v; n++; }
  }
  return n ? Math.round(sum / n) : 0;
}
/** Comparativas de progreso (spec §74): semana actual vs 1/4/12 semanas atrás (%). */
function progressionComparison(){
  const curWk = weekId(), weekNow = weekVolume();
  const prev = weeklyVolumes().filter(w => w.weekId < curWk);
  const ago = n => (prev.length >= n ? prev[prev.length - n].volume : null);
  // Sin volumen esta semana todavía (semana recién empezada) no comparamos: evita el
  // engañoso "-100%" antes de entrenar. En cuanto registras algo, muestra el % real.
  const pct = base => (weekNow > 0 && base && base > 0) ? Math.round((weekNow - base) / base * 100) : null;
  return { weekNow, vsLast:pct(ago(1)), vs4:pct(ago(4)), vs12:pct(ago(12)) };
}
/** Historial de un ejercicio (dia+id) en el tiempo: [{date, w, reps}] ascendente. */
function exerciseHistory(dayType, slug){
  const out = [];
  for(const date in sessions){
    const s = sessions[date]; if(s.dayType!==dayType) continue;
    ['full','express'].forEach(mode=>{
      const cell = s[mode] && s[mode].ex && s[mode].ex[slug];
      const top = topSet(cell && cell.sets);            // mejor serie efectiva de esa sesión
      if(top) out.push({ date, w:top.w||0, reps:top.reps||0 });
    });
  }
  return out.sort((a,b)=> a.date<b.date ? -1 : a.date>b.date ? 1 : 0);
}

