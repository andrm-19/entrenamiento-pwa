/* ============================================================
   Entreno V — 4. Interfaz: render, tracker, editor, paneles, ajustes, eventos
   Arquitectura modular (spec §10/§116): scripts clásicos cargados en orden,
   mismo scope global; sin build. El orden en index.html es significativo.
   ============================================================ */
/* ----------------------------------------------------------------
   6. RENDER
   ---------------------------------------------------------------- */
function renderWeek(){
  const mo = monday, su = dateForDow(0);
  document.getElementById('weeklabel').innerHTML =
    `Semana del <b>${mo.getDate()} ${MES[mo.getMonth()]}</b> al <b>${su.getDate()} ${MES[su.getMonth()]}</b>`;
}

function renderBanner(){
  const b = document.getElementById('banner');
  if(b && bannerHidden) b.remove();
}

function renderDays(){
  const nav = document.getElementById('days');
  nav.innerHTML = ORDER.map(d=>{
    const day = SCHEDULE[d], isToday = d===todayDow, isActive = d===current;
    const dt = dateForDow(d).getDate();
    const letter = day.ab.charAt(0);   // L · M · M · J · V · S · D (una sola letra: menos ruido)
    return `<button class="day-btn ${isActive?'active':''} ${isToday?'today':''} ${day.rest?'rest':''}" onclick="select(${d})" aria-label="${day.label} ${dt}${isToday?' (hoy)':''}${day.rest?' · descanso':''}">
      <span class="ab">${letter}</span><span class="date">${dt}</span></button>`;
  }).join('');
}

function render(){
  const day = SCHEDULE[current], view = document.getElementById('view');
  const accentVar = day.rest ? '--rest' : C[day.key];
  view.style.setProperty('--accent', `var(${accentVar})`);
  if(day.rest){
    view.innerHTML = `<div class="rest-card" style="--accent:var(--primary)">
      <div class="big">Día de descanso</div>
      <p>El músculo no crece en el gimnasio, crece mientras te recuperas. Hoy toca cargar baterías: duerme bien, mantén la proteína alta e hidrátate.</p>
      <button class="rbtn" onclick="openPanel('progress')">Ver mi progreso</button>
    </div>`; return;
  }
  if(editMode){ view.innerHTML = renderRoutineEditor(day); return; }
  const exList = visibleEx(day);
  const total = exList.length;
  const firstExtra = exList.findIndex(e => e.extra);
  const list = exList.map((e,i)=>{
    const isDone = !!done[exKey(i)];
    const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.q)}`;
    const steps = e.tech.map(t=>`<li>${t}</li>`).join('');
    const divider = (i === firstExtra && firstExtra > 0)
      ? `<div class="ex-divider">＋ Extra · si te alcanza el tiempo</div>` : '';
    const tag = e.extra ? '<span class="tag-opt">EXTRA</span>' : (e.opt ? '<span class="tag-opt">OPCIONAL</span>' : '');
    return `${divider}<div class="ex ${e.opt||e.extra?'opt':''} ${isDone?'done':''}" id="ex-${i}">
      <div class="ex-top">
        <label class="check" aria-label="Marcar ${e.n}">
          <input type="checkbox" class="check-box" data-k="done" data-i="${i}" ${isDone?'checked':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#0B0B0F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 6.5"/></svg>
        </label>
        <div class="ex-main">
          <div class="ex-head">
            <div class="name">${e.n}${tag}</div>
            <div class="purpose">${e.p}</div>
          </div>
          <div class="stats">
            <span class="stat"><span>Series</span>${e.s}</span>
            <span class="stat"><span>Reps</span>${e.r}</span>
            <button class="stat stat-rest" type="button" data-rest="${parseRestSeconds(e.d)}" aria-label="Descanso ${e.d}">⏱ ${e.d}</button>
          </div>
          ${lastTimeHint(i, e)}
          ${progressionHint(i, e)}
          ${logRow(i)}
          ${bestRow(i, e)}
          ${oneRmRow(i)}
          <div class="acc-wrap">
            <details class="acc"><summary><span class="acc-ico">📋</span> Cómo hacerlo</summary><ol class="tech-ol">${steps}</ol></details>
            ${historyDetails(i, e)}
            ${noteDetails(i)}
            <a class="acc-link" href="${yt}" target="_blank" rel="noopener"><span class="acc-ico">▶</span> Ver video</a>
          </div>
        </div>
        ${exFig(e.m)}
      </div>
    </div>`;
  }).join('');
  view.innerHTML = `<section class="dayhead">
      <div class="dayhead-main">
        <div class="daytype">${day.type}</div>
        <div class="daysub">${day.label} ${dateForDow(current).getDate()} ${MES[dateForDow(current).getMonth()]} · ${day.sub}</div>
        <div class="modeswitch" role="group" aria-label="Modo de rutina">
          <button class="mode-btn ${studyMode ? '' : 'on'}" type="button" onclick="toggleStudy(false)">Completa</button>
          <button class="mode-btn ${studyMode ? 'on' : ''}" type="button" onclick="toggleStudy(true)">⚡ Express</button>
        </div>
      </div>
      ${heroMap(day.muscles)}
    </section>
    <div class="dayprog">
      <div class="dayprog-top"><span><b id="pcount">0</b> / ${total} ejercicios</span>
        <span class="dayprog-actions">
          ${studyMode ? '' : '<button class="btn-ghost" type="button" onclick="toggleEditMode(true)">✏️ Editar</button>'}
          <button class="btn-ghost" type="button" onclick="resetDay()">Reiniciar</button>
        </span></div>
      <div class="pbar"><i id="pbar"></i></div>
    </div>
    <div class="list">${list}</div>
    <div class="volume" id="volume"></div>
    <button class="finish-btn" type="button" onclick="finishCurrentSession()">Finalizar entrenamiento</button>
    <div class="session-note">
      <h4><span class="acc-ico">📝</span> Feedback de la sesión</h4>
      <textarea class="note-input" rows="2" data-k="snote"
        placeholder="¿Cómo te sentiste hoy? Energía, dolores, PRs, qué subir la próxima…"
        aria-label="Feedback de la sesión">${escapeHtml(sessionNote())}</textarea>
    </div>`;
  view.querySelectorAll('.note-input').forEach(autoGrow);  // ajusta alto de las notas guardadas
  updateProgress();
  updateVolume();
}

/** HTML del registro de carga (peso + reps). Sin handlers inline: solo data-*. */
/** Referencia rápida "Última vez" (sesión previa, no la de hoy) para registrar veloz
    — como el "Previous" de Hevy/Strong. Ayuda a cerrar cada serie en <3 s. */
function lastTimeHint(i, e){
  if(!e || !e.id) return '';
  const today = dateOfDay(current);
  const prior = exerciseHistory(current, e.id).filter(h => h.date !== today);
  if(!prior.length) return '';
  const ref = prior[prior.length - 1];
  return `<div class="lasttime">Última vez <b>${fmtKg(ref.w)} ${wUnit()} × ${ref.reps || '—'}</b> <span>· ${ref.date.slice(5).replace('-', '/')}</span></div>`;
}

/* ----------------------------------------------------------------
   MOTOR · SOBRECARGA PROGRESIVA (spec §58) y ESTANCAMIENTO (§59)
   ------------------------------------------------------------
   Lee la última sesión del mismo ejercicio y SUGIERE (nunca cambia
   automáticamente, spec §58) subir carga cuando hubo margen: RIR alto o
   reps al tope del rango. Detecta estancamiento si el peso no sube en
   varias sesiones. Solo lectura sobre el historial ya guardado.
   ---------------------------------------------------------------- */
/** Rango de reps objetivo del plan: "8–12" -> {min:8, max:12}; "10" -> {10,10}. */
function parseRepsRange(txt){
  const nums = String(txt).match(/\d+/g);
  if(!nums) return { min:0, max:0 };
  return { min:+nums[0], max:+(nums[1] || nums[0]) };
}
/** Mejor serie efectiva de la sesión MÁS RECIENTE anterior a excludeDate, con RIR.
    Devuelve {w, reps, rir, date} o null. */
function lastSessionTopSet(dayType, slug, excludeDate){
  let best = null, bestDate = '';
  for(const date in sessions){
    if(date === excludeDate) continue;
    const s = sessions[date]; if(s.dayType !== dayType) continue;
    ['full','express'].forEach(mode => {
      const cell = s[mode] && s[mode].ex && s[mode].ex[slug];
      const t = topSet(cell && cell.sets);
      if(t && date > bestDate){ best = t; bestDate = date; }
    });
  }
  return best ? { w:best.w||0, reps:best.reps||0, rir:(best.rir===0||best.rir)?+best.rir:null, date:bestDate } : null;
}
/** Nº de sesiones previas (desde la última) sin aumentar el peso tope. >=2 = estancado. */
function stagnationCount(dayType, slug, excludeDate){
  const hist = exerciseHistory(dayType, slug).filter(h => h.date !== excludeDate);
  if(hist.length < 2) return 0;
  const last = hist[hist.length - 1].w;
  let n = 0;
  for(let k = hist.length - 2; k >= 0; k--){ if(hist[k].w >= last) n++; else break; }
  return n;
}
/** Sugerencia de sobrecarga progresiva para un ejercicio (o null si no hay datos). */
function progressionSuggest(e){
  if(!e || !e.id) return null;
  const today = dateOfDay(current);
  const last = lastSessionTopSet(current, e.id, today);
  if(!last || !last.w) return null;
  const { max } = parseRepsRange(e.r);
  const rir = last.rir;
  const ref = `${fmtWeight(last.w)} ${wUnit()} × ${last.reps}${rir != null ? ` · RIR ${rir}` : ''}`;
  const up = +(last.w + WEIGHT_STEP).toFixed(2);
  if(stagnationCount(current, e.id, today) >= 2){
    return { cls:'warn', html:`⚠️ Estancado (${ref}). Prueba cambiar el rango de reps, sumar descanso o una semana de descarga.` };
  }
  const hasHeadroom = (rir != null && rir >= 2) || (max && last.reps >= max);
  if(hasHeadroom) return { cls:'up',  html:`💡 La última vez ${ref} con margen → prueba <b>${fmtWeight(up)} ${wUnit()}</b>.` };
  if(rir != null && rir <= 1) return { cls:'', html:`Mantén <b>${fmtWeight(last.w)} ${wUnit()}</b> y busca más repeticiones antes de subir.` };
  return { cls:'', html:`Repite <b>${fmtWeight(last.w)} ${wUnit()}</b> e intenta sumar 1–2 reps.` };
}
/** Línea de recomendación de sobrecarga bajo el ejercicio (spec §58). */
function progressionHint(i, e){
  const s = progressionSuggest(e);
  return s ? `<div class="prog-hint ${s.cls}">${s.html}</div>` : '';
}

function logRow(i){
  return `<div class="sets" id="sets-${i}">${setRows(i)}</div>
    <button class="addset" type="button" data-addset data-i="${i}">＋ Añadir serie</button>`;
}

/** HTML de todas las series de un ejercicio (mínimo una fila para empezar). */
function setRows(i){
  const arr = setsMap[exKey(i)];
  const list = (Array.isArray(arr) && arr.length) ? arr : [{ w:'', reps:'', rir:'', type:'efectiva' }];
  return list.map((s, si) => setRow(i, si, s, list.length)).join('');
}

/** HTML de una fila de serie: nº · peso · reps · RIR · tipo · (eliminar si hay varias).
    Layout en dos niveles (grid) para que NUNCA se desborde ni envuelva feo en móvil:
      · fila principal:  [nº]  Peso(− valor +)  Reps(− valor +)
      · fila inferior:   [RIR]  [tipo de serie]  [eliminar] */
function setRow(i, si, s, count){
  // El peso se GUARDA en kg; aquí se muestra en la unidad elegida (redondeo a 0,5).
  const wv = (s.w === '' || s.w == null) ? '' : (Math.round(toDisp(s.w) * 2) / 2);
  const rv = (s.reps === '' || s.reps == null) ? '' : s.reps;
  const rr = (s.rir === '' || s.rir == null) ? '' : s.rir;
  const type = s.type || 'efectiva';
  const opts = SET_TYPES.map(([v, lbl]) => `<option value="${v}"${type === v ? ' selected' : ''}>${lbl}</option>`).join('');
  const stepper = (field, val, unitLabel, step) => `<div class="stepper">
        <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="${field}" data-delta="-${step}" aria-label="Bajar ${field === 'w' ? 'peso' : 'reps'} serie ${si + 1}">−</button>
        <input class="num" type="number" inputmode="${unitLabel ? 'decimal' : 'numeric'}" min="0" step="${step}" value="${val}" placeholder="0" data-k="set" data-i="${i}" data-s="${si}" data-field="${field}" aria-label="${field === 'w' ? 'Peso' : 'Reps'} serie ${si + 1}${unitLabel ? ' (' + unitLabel + ')' : ''}">
        ${unitLabel ? `<span class="unit">${unitLabel}</span>` : ''}
        <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="${field}" data-delta="${step}" aria-label="Subir ${field === 'w' ? 'peso' : 'reps'} serie ${si + 1}">+</button>
      </div>`;
  return `<div class="setrow${isEffective(type) ? '' : ' warm'}" data-row="${si}">
    <div class="setrow-main">
      <span class="set-idx" aria-hidden="true">${si + 1}</span>
      <div class="field"><span class="field-lbl">Peso</span>${stepper('w', wv, wUnit(), weightStepDisp())}</div>
      <div class="field"><span class="field-lbl">Reps</span>${stepper('reps', rv, '', 1)}</div>
    </div>
    <div class="setrow-foot">
      <label class="set-rir"><span class="field-lbl">RIR</span><input class="num" type="number" inputmode="numeric" min="0" max="10" step="1" value="${rr}" placeholder="—" data-k="set" data-i="${i}" data-s="${si}" data-field="rir" aria-label="RIR serie ${si + 1}"></label>
      <select class="set-type" data-k="set" data-i="${i}" data-s="${si}" data-field="type" aria-label="Tipo de serie ${si + 1}">${opts}</select>
      ${count > 1 ? `<button class="set-del" type="button" data-delset data-i="${i}" data-s="${si}" aria-label="Eliminar serie ${si + 1}">✕</button>` : ''}
    </div>
  </div>`;
}

/** Pista de récord histórico del ejercicio (progreso de sobrecarga). */
function bestRow(i, e){
  const best = (bests[bestKeyFor(i, e)] || {}).w || 0;
  const cur  = (topSet(setsMap[exKey(i)]) || {}).w || 0;
  const isPr = cur && cur >= best;
  return `<div class="best ${isPr ? 'pr' : ''}" id="best-${i}">${bestCueContent(best, cur)}</div>`;
}

/** Refresca la pista de récord en vivo cuando cambias el peso. */
function updateBestCue(i){
  const el = document.getElementById('best-' + i);
  if(!el) return;
  const e = visibleEx(SCHEDULE[current])[i];
  if(!e) return;
  const best = (bests[bestKeyFor(i, e)] || {}).w || 0;
  const cur  = (topSet(setsMap[exKey(i)]) || {}).w || 0;
  el.classList.toggle('pr', !!(cur && cur >= best));
  el.innerHTML = bestCueContent(best, cur);
}

/* --- 1RM ESTIMADO (Epley) · métrica oficial del spec §56 ---
   Primer ladrillo del "motor": una primitiva pura + su render en vivo.
   NO toca datos ni el esquema; solo lee la carga ya registrada. --- */
/** 1RM estimado = peso × (1 + reps/30). Devuelve 0 si faltan datos. */
function epley1RM(w, reps){
  const weight = +w || 0, r = +reps || 0;
  return (weight > 0 && r > 0) ? weight * (1 + r / 30) : 0;
}
/** Texto de la línea de 1RM a partir de un 1RM ya calculado. */
function oneRmLine(rm){
  return rm > 0
    ? `📈 1RM estimado: <b>${fmtKg(rm)} ${wUnit()}</b>`
    : '📈 Registra peso y reps para ver tu 1RM estimado';
}
/** Línea de 1RM estimado bajo cada ejercicio: mejor 1RM entre sus series. */
function oneRmRow(i){
  return `<div class="orm" id="orm-${i}">${oneRmLine(best1RM(setsMap[exKey(i)]))}</div>`;
}
/** Refresca el 1RM en vivo al cambiar cualquier serie (sin re-render del día). */
function updateOneRepMax(i){
  const el = document.getElementById('orm-' + i);
  if(el) el.innerHTML = oneRmLine(best1RM(setsMap[exKey(i)]));
}

/** Mini-curva SVG del peso a lo largo de las sesiones (FASE 4, sin dependencias).
    Etiqueta el primer y el último peso: se lee de un vistazo "de X a Y". */
function svgExerciseCurve(hist){
  if(!hist || !hist.length) return '';
  const W=264, H=94, padL=10, padR=12, padT=16, padB=14;
  const vals=hist.map(h=>h.w), max=Math.max(...vals), min=Math.min(...vals), span=Math.max(1, max-min), n=hist.length;
  const xAt=i=> padL + (n===1 ? (W-padL-padR)/2 : i*(W-padL-padR)/(n-1));
  const yAt=v=> H-padB - ((v-min)/span)*(H-padT-padB);
  const pts=hist.map((h,i)=>`${xAt(i).toFixed(1)},${yAt(h.w).toFixed(1)}`);
  const line = n>1 ? `<polyline class="exc-line" points="${pts.join(' ')}"/>` : '';
  const dots = hist.map((h,i)=>`<circle class="exc-dot${i===n-1?' last':''}" cx="${xAt(i).toFixed(1)}" cy="${yAt(h.w).toFixed(1)}" r="${i===n-1?3.6:2.4}"/>`).join('');
  const f=hist[0], l=hist[n-1];
  const firstLbl=`<text class="exc-lbl" x="${xAt(0).toFixed(1)}" y="${(yAt(f.w)-6).toFixed(1)}" text-anchor="${n===1?'middle':'start'}">${fmtKg(f.w)}</text>`;
  const lastLbl = n>1 ? `<text class="exc-lbl last" x="${xAt(n-1).toFixed(1)}" y="${(yAt(l.w)-6).toFixed(1)}" text-anchor="end">${fmtKg(l.w)}</text>` : '';
  return `<svg class="exc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de peso por sesión">${line}${dots}${firstLbl}${lastLbl}</svg>`;
}

/** Historial del ejercicio en el tiempo: curva de peso + resumen "de X a Y" + últimas
    sesiones. Es el "me veo reflejado": entras a un ejercicio y ves tu evolución real. */
function historyDetails(i, e){
  if(!e || !e.id) return '';
  const hist = exerciseHistory(current, e.id);
  if(!hist.length){
    return `<details class="acc"><summary><span class="acc-ico">📈</span> Historial</summary>
      <p class="hist-empty">Aún sin historial. Registra hoy y aquí verás tu evolución sesión a sesión.</p></details>`;
  }
  const first=hist[0], last=hist[hist.length-1], diff=last.w-first.w;
  const delta = hist.length>1
    ? `<div class="hist-delta ${diff>=0?'up':'down'}">${diff>=0?'▲':'▼'} ${diff>=0?'Subiste':'Bajaste'} <b>${fmtKg(Math.abs(diff))} ${wUnit()}</b> desde ${first.date.slice(5).replace('-','/')} · ${fmtKg(first.w)} → ${fmtKg(last.w)} ${wUnit()}</div>`
    : `<div class="hist-delta">Primer registro: <b>${fmtKg(first.w)} ${wUnit()}</b>. Registra otra sesión para ver tu curva.</div>`;
  const bestW = (bests[bestKeyFor(i, e)] || {}).w || 0;
  const rows = hist.slice(-8).map(h => {
    const isPr = h.w > 0 && h.w >= bestW;
    return `<li${isPr ? ' class="pr"' : ''}><span>${h.date.slice(5).replace('-','/')}</span><b>${fmtKg(h.w)} ${wUnit()}</b> × ${h.reps || '—'}${isPr ? ' 🏆' : ''}</li>`;
  }).join('');
  return `<details class="acc"><summary><span class="acc-ico">📈</span> Historial · ${hist.length}</summary>
    ${svgExerciseCurve(hist.slice(-10))}${delta}<ul class="hist-list">${rows}</ul></details>`;
}

/** Nota rápida colapsable (se abre sola si ya hay texto). */
function noteDetails(i){
  const val = notes[exKey(i)] || '';
  return `<details class="acc"${val ? ' open' : ''}>
    <summary><span class="acc-ico">📝</span> Nota${val ? ' •' : ''}</summary>
    <textarea class="note-input" rows="1" data-k="note" data-i="${i}"
      placeholder="Cómo te sentiste, subir peso la próxima…"
      aria-label="Nota del ejercicio">${escapeHtml(val)}</textarea>
  </details>`;
}

/* ----------------------------------------------------------------
   7. OBSERVER / SILENT-SAVE  (event delegation, sin botón de guardar)
   ------------------------------------------------------------
   Un único listener sobre #view captura los eventos 'input'/'change'
   de TODOS los controles (checkbox, number, textarea). Cada control
   se autodescribe con data-* (data-k, data-i, data-field), así el
   render no lleva handlers inline y el guardado es automático.
   ---------------------------------------------------------------- */
function bindObservers(){
  const view = document.getElementById('view');
  view.addEventListener('input',  onFieldChange);  // number + textarea (cada tecla)
  view.addEventListener('change', onFieldChange);  // checkbox
  view.addEventListener('click',  onViewClick);    // botones +/− y cronómetro
}

/** Reacciona a cualquier cambio de valor y dispara el guardado silencioso. */
function onFieldChange(e){
  const el = e.target;
  const k = el.dataset && el.dataset.k;
  if(!k) return;
  const i = +el.dataset.i, key = exKey(i);

  if(k === 'edit'){   // editor de rutina: cambia un campo del ejercicio (nombre, series, reps…)
    const field = el.dataset.field, day = SCHEDULE[current];
    if(day.ex && day.ex[i]){ day.ex[i][field] = el.value; persistRoutineDebounced(); }
    return;
  }
  if(k === 'editday'){   // editor de rutina: nombre/subtítulo del día
    SCHEDULE[current][el.dataset.field] = el.value;
    persistRoutineDebounced();
    return;
  }

  if(k === 'done'){
    done[key] = el.checked;
    if(el.checked) ensureSessionStarted(current);
    const card = el.closest('.ex');
    if(card) card.classList.toggle('done', el.checked);
    updateProgress();
    if(el.checked){
      // Terminaste el día -> confeti; si no, arranca el descanso AUTOMÁTICO.
      if(!celebrateIfComplete()){
        const ex = visibleEx(SCHEDULE[current])[i];
        if(ex) startRest(parseRestSeconds(ex.d));
      }
    }
  } else if(k === 'set'){
    ensureSessionStarted(current);
    const si = +el.dataset.s, field = el.dataset.field;
    const arr = (setsMap[key] || (setsMap[key] = []));
    const row = (arr[si] || (arr[si] = { w:0, reps:0, rir:'', type:'efectiva' }));
    if(field === 'type'){
      row.type = el.value || 'efectiva';
      const rowEl = el.closest('.setrow');
      if(rowEl) rowEl.classList.toggle('warm', !isEffective(row.type));
    } else if(field === 'rir'){
      row.rir = el.value === '' ? '' : Math.max(0, parseInt(el.value, 10) || 0);
    } else {
      let num = parseFloat(el.value);
      if(isNaN(num) || num < 0) num = 0;
      // El peso se teclea en la unidad de visualización; se GUARDA siempre en kg.
      row[field] = (field === 'w') ? +toKg(num).toFixed(4) : num;
    }
    // Récord por peso, solo series efectivas, con fecha (spec §61).
    if(field === 'w' && isEffective(row.type)){
      const ex = visibleEx(SCHEDULE[current])[i], bk = bestKeyFor(i, ex);
      if(row.w > ((bests[bk] || {}).w || 0)) bests[bk] = { w: row.w, reps: row.reps || 0, date: dateOfDay(current) };
    }
    updateBestCue(i);
    updateOneRepMax(i);
    updateVolume();
  } else if(k === 'note'){
    notes[key] = el.value;
    autoGrow(el);
  } else if(k === 'snote'){
    notes[sessKey()] = el.value;   // feedback general del día (no atado a un ejercicio)
    autoGrow(el);
  }
  debouncedSave();   // Silent-Save: una sola escritura tras la ráfaga de cambios
}

/** Clics dentro de #view: steppers +/− y cronómetro de descanso. */
function onViewClick(e){
  const eact = e.target.closest('[data-editact]');
  if(eact){ routineEditAction(eact.dataset.editact, +eact.dataset.i); return; }

  const addex = e.target.closest('[data-addex]');
  if(addex){ routineAddExercise(); return; }

  const dup = e.target.closest('[data-dupday]');
  if(dup){ routineDuplicateTo(+dup.dataset.dupday); return; }

  const rst = e.target.closest('[data-resetroutine]');
  if(rst){ routineReset(); return; }

  const rest = e.target.closest('[data-rest]');
  if(rest){ startRest(+rest.dataset.rest); return; }

  const add = e.target.closest('[data-addset]');
  if(add){ addSet(+add.dataset.i); return; }

  const del = e.target.closest('[data-delset]');
  if(del){ removeSet(+del.dataset.i, +del.dataset.s); return; }

  const btn = e.target.closest('[data-step]');
  if(!btn) return;
  const i = +btn.dataset.i, si = +btn.dataset.s, field = btn.dataset.field, delta = parseFloat(btn.dataset.delta);
  const input = document.querySelector(`.setrow[data-row="${si}"] input[data-i="${i}"][data-s="${si}"][data-field="${field}"]`);
  if(!input) return;
  let num = parseFloat(input.value);
  if(isNaN(num)) num = 0;
  num = Math.max(0, +(num + delta).toFixed(2));
  input.value = (field === 'w') ? num : Math.round(num);
  input.dispatchEvent(new Event('input', { bubbles:true }));  // -> pasa por onFieldChange
}

/** Añade una serie (hereda peso/reps de la anterior: menos toques, spec §106). */
function addSet(i){
  const key = exKey(i);
  const arr = (setsMap[key] || (setsMap[key] = []));
  if(!arr.length) arr.push({ w:0, reps:0, rir:'', type:'efectiva' });   // materializa la fila visible
  const prev = arr[arr.length - 1] || {};
  arr.push({ w: prev.w || 0, reps: prev.reps || 0, rir:'', type:'efectiva' });
  refreshSets(i);
  updateBestCue(i); updateOneRepMax(i); updateVolume();
  Store.save();
}

/** Elimina una serie y re-pinta las filas de ese ejercicio. */
function removeSet(i, si){
  const arr = setsMap[exKey(i)];
  if(!Array.isArray(arr)) return;
  arr.splice(si, 1);
  refreshSets(i);
  updateBestCue(i); updateOneRepMax(i); updateVolume();
  Store.save();
}

/** Re-genera solo el HTML de las series de un ejercicio desde setsMap. */
function refreshSets(i){
  const host = document.getElementById('sets-' + i);
  if(host) host.innerHTML = setRows(i);
}

/* ----------------------------------------------------------------
   7e. CRONÓMETRO DE DESCANSO  (toca "Descanso" para iniciarlo)
   ---------------------------------------------------------------- */
let restTimerId = null, restLeft = 0, restEndId = null, restHideId = null, restPaused = false, restMuted = false;
let restStartedAt = 0;   // Motor 2.0 (§10): marca de inicio del descanso en curso (0 = no hay).
/** Suma el descanso realmente transcurrido a la sesión del día (tiempo medido, §10).
    El tiempo ACTIVO se deriva luego (total de pared − descanso), sin acumular error. */
function accrueRest(){
  if(!restStartedAt) return;
  const s = sessions[dateOfDay(current)];
  if(s && s.startedAt){ s.restMs = (s.restMs || 0) + Math.max(0, Date.now() - restStartedAt); s.updatedAt = Date.now(); }
  restStartedAt = 0;
}
function startRest(seconds){
  const bar = document.getElementById('restTimer');
  if(!bar) return;
  accrueRest();                                // cierra cualquier descanso anterior abierto
  restStartedAt = Date.now();                  // arranca la medición real de este descanso
  if(restDefault > 0) seconds = restDefault;   // Fase E: descanso por defecto configurable
  // Cancela cualquier temporizador pendiente (evita que un descanso anterior
  // oculte el nuevo a mitad de camino: ese era el bug del "reloj que no se va").
  clearInterval(restTimerId); clearTimeout(restEndId); clearTimeout(restHideId);
  restLeft = seconds;
  restPaused = false; setRestPauseIcon();       // cada descanso arranca en marcha
  bar.classList.remove('done', 'paused');
  bar.hidden = false;
  void bar.offsetWidth;          // fuerza un reflow: fija el estado inicial oculto...
  bar.classList.add('show');     // ...y ahora la transición de entrada arranca sí o sí
  paintRest();
  restTimerId = setInterval(()=>{
    if(restPaused) return;       // en pausa: el reloj no corre (spec §62)
    restLeft--;
    if(restLeft <= 0){
      clearInterval(restTimerId);
      restLeft = 0; paintRest();                                 // muestra 00:00 un instante
      if(!restMuted && navigator.vibrate) navigator.vibrate([200,100,200]);   // aviso háptico (si no está silenciado)
      bar.classList.add('done');
      restEndId = setTimeout(stopRest, 900);   // al llegar a 00:00 se oculta AUTOMÁTICAMENTE
      return;
    }
    paintRest();
  }, 1000);
}
/** Pausa/reanuda el cronómetro (spec §62). */
function toggleRestPause(){
  restPaused = !restPaused;
  setRestPauseIcon();
  const bar = document.getElementById('restTimer');
  if(bar) bar.classList.toggle('paused', restPaused);
}
function setRestPauseIcon(){
  const b = document.getElementById('restPauseBtn');
  if(b){ b.textContent = restPaused ? '▶' : '⏸'; b.setAttribute('aria-label', restPaused ? 'Reanudar' : 'Pausar'); }
}
/** Silencia/activa el aviso háptico al terminar el descanso (spec §62). */
function toggleRestMute(){
  restMuted = !restMuted;
  const b = document.getElementById('restMuteBtn');
  if(b){ b.textContent = restMuted ? '🔕' : '🔔'; b.setAttribute('aria-label', restMuted ? 'Activar aviso' : 'Silenciar aviso'); }
}
function paintRest(){
  const mm = Math.floor(Math.max(0,restLeft) / 60), ss = Math.max(0,restLeft) % 60;
  const t = document.getElementById('restTime');
  if(t) t.textContent = `${mm}:${String(ss).padStart(2,'0')}`;
}
function stopRest(){
  accrueRest();                                // registra el descanso transcurrido (§10)
  clearInterval(restTimerId); clearTimeout(restEndId);
  const bar = document.getElementById('restTimer');
  if(!bar) return;
  bar.classList.remove('show', 'done');            // se colapsa con la animación de salida
  clearTimeout(restHideId);
  restHideId = setTimeout(() => { bar.hidden = true; }, 300);   // oculta al terminar la transición
}
function addRest(sec){ restLeft = Math.max(0, restLeft + sec); paintRest(); }

/* ----------------------------------------------------------------
   7f. CELEBRACIÓN  (refuerzo positivo al completar el día)
   ---------------------------------------------------------------- */
function celebrateIfComplete(){
  const day = SCHEDULE[current];
  if(day.rest) return false;
  const ex = visibleEx(day);
  const allDone = ex.length && ex.every((_, i) => done[exKey(i)]);
  if(allDone){ stopRest(); confettiBurst(); return true; }   // día terminado: corta el descanso
  return false;
}
function confettiBurst(){
  const layer = document.getElementById('confetti');
  if(!layer) return;
  const colors = ['#2DA8F2','#FF7A33','#A6E024','#B97BF6','#F4F4F2'];
  layer.innerHTML = '';
  for(let i = 0; i < 28; i++){
    const s = document.createElement('span');
    s.className = 'confetti-bit';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = (Math.random() * 0.25) + 's';
    s.style.transform = `rotate(${Math.random()*360}deg)`;
    layer.appendChild(s);
  }
  layer.hidden = false;
  setTimeout(()=>{ layer.hidden = true; layer.innerHTML = ''; }, 2200);
}

/* ----------------------------------------------------------------
   7h. SESIÓN ACTIVA + RECUPERACIÓN  (Fase C · spec §16/§25/§48/§64/§65)
   ------------------------------------------------------------
   El día ya se auto-guarda serie a serie; aquí añadimos el CICLO DE VIDA
   de la sesión (inicio/fin + duración), el resumen final con snapshot y
   la recuperación de un entreno sin finalizar. Los metadatos viven en
   sessions[fecha] y syncSessionsFromWorking los preserva.
   ---------------------------------------------------------------- */
/** Marca el inicio de la sesión del día d una sola vez (al haber actividad). */
function ensureSessionStarted(d){
  const date = dateOfDay(d);
  const s = (sessions[date] || (sessions[date] = { dayType:d, full:{ex:{},note:''}, express:{ex:{},note:''}, startedAt:null, finishedAt:null, snapshot:null, restMs:0, state:'preparado', updatedAt:null }));
  if(!s.startedAt){ s.startedAt = Date.now(); setSessionState(date, 'en_curso'); }   // preparado → en curso (§14)
}
/** ¿El día d tiene alguna serie efectiva o ejercicio marcado? */
function dayHasProgress(d){
  for(const key in setsMap){ const m = key.match(/^(x?)(\d+)-/); if(m && +m[2] === d && setsVolume(setsMap[key])) return true; }
  for(const key in done){ if(done[key]){ const m = key.match(/^(x?)(\d+)-/); if(m && +m[2] === d) return true; } }
  return false;
}
/** Formatea una duración en ms: "1 h 18 min" / "42 min". */
function fmtDuration(ms){
  const min = Math.max(0, Math.round(ms / 60000)), h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}
/** Snapshot permanente del entreno (spec §12/§65): retrato completo de la sesión
    para el resumen final y el dashboard rápido. Añade tiempo activo/descanso,
    músculos trabajados, récords reales (por nombre), media mensual y objetivos. */
function buildSnapshot(d, s){
  const day = SCHEDULE[d];
  const today = dateOfDay(d);
  let sets = 0, exercises = 0, topRm = 0;
  const recordNames = [];
  visibleEx(day).forEach((e, i) => {
    const arr = setsMap[exKey(i)];
    const c = effectiveSetCount(arr);
    if(c){ exercises++; sets += c; }
    const rm = best1RM(arr); if(rm > topRm) topRm = rm;
    const cur = (topSet(arr) || {}).w || 0;
    if(cur > 0){                                  // récord REAL: supera el mejor de sesiones ANTERIORES
      const prior = exerciseHistory(d, e.id).filter(h => h.date !== today);
      const prevBest = prior.reduce((mx, h) => Math.max(mx, h.w), 0);
      if(cur > prevBest) recordNames.push(e.n);
    }
  });
  const t = sessionTiming(s, sets, exercises);
  const goalsDone = [];
  if(goals.sessions && weekSessionsCount() >= goals.sessions) goalsDone.push('sesiones');
  if(goals.volume && weekVolume() >= goals.volume) goalsDone.push('volumen');
  return {
    date: today, dayType:d, volume: dayVolumeAnyMode(d),
    sets, exercises, records: recordNames.length, recordNames,
    oneRm: Math.round(topRm), durationMs: t.totalMs, activeMs: t.activeMs, restMs: t.restMs,
    avgPerExerciseMs: t.avgPerExerciseMs, avgPerSetMs: t.avgPerSetMs,
    muscles: dayMuscleVolume(d), monthAvg: monthlyAvgSessionVolume(today.slice(0,7), today), goalsDone
  };
}
/** Sesión más reciente del mismo día de rutina anterior a excludeDate (o null).
    Sirve para comparar la sesión recién cerrada con "la última vez" (§12/§13). */
function prevSameDaySession(dayType, excludeDate){
  let best = null, bd = '';
  for(const date in sessions){
    if(date === excludeDate) continue;
    const s = sessions[date];
    if(s.dayType === dayType && date > bd){ bd = date; best = s; }
  }
  return best;
}
/** Insights automáticos al cerrar la sesión (spec §13): 1–3 mensajes SIEMPRE
    respaldados por datos, nunca aleatorios, priorizando utilidad sobre motivación.
    Centrados en la sesión recién cerrada; se completan con el contexto semanal. */
function sessionInsights(d, snap){
  const out = [];
  const prev = prevSameDaySession(d, snap.date);
  // 1) Récord real de la sesión.
  if(snap.recordNames.length){
    const extra = snap.recordNames.length > 1 ? ` (+${snap.recordNames.length - 1})` : '';
    out.push(`🏆 Nuevo récord en <b>${snap.recordNames[0]}</b>${extra}.`);
  }
  // 2) Volumen frente a la última sesión de este mismo día.
  if(prev){
    const pv = sessionVolume(prev);
    if(pv > 0 && snap.volume > 0){
      const pct = Math.round((snap.volume - pv) / pv * 100);
      if(pct > 0)      out.push(`📈 +${pct}% de volumen respecto a tu última sesión de ${SCHEDULE[d].type}.`);
      else if(pct < 0) out.push(`📉 ${pct}% de volumen frente a tu última sesión de ${SCHEDULE[d].type}.`);
    }
    // 3) Descanso medio por serie vs. la sesión anterior.
    const prevSets = prev.snapshot && prev.snapshot.sets;
    if(prev.restMs && prevSets && snap.restMs && snap.sets){
      const restPerSet = snap.restMs / snap.sets, prevPerSet = prev.restMs / prevSets;
      const diffS = Math.round((prevPerSet - restPerSet) / 1000);
      if(diffS >= 5)      out.push(`⏱ Tu descanso medio bajó ${diffS} s por serie.`);
      else if(diffS <= -5) out.push(`⏱ Tu descanso medio subió ${-diffS} s por serie.`);
    }
  }
  // 4) Comparación con la media mensual de sesión.
  if(snap.monthAvg > 0 && snap.volume > 0){
    const pct = Math.round((snap.volume - snap.monthAvg) / snap.monthAvg * 100);
    if(Math.abs(pct) >= 5) out.push(`📊 ${pct >= 0 ? '+' : ''}${pct}% de volumen frente a tu media del mes.`);
  }
  // Completa con el contexto semanal ya existente si hacen falta más (nunca el
  // marcador genérico "Registra tus series…": no aporta al cerrar una sesión).
  for(const m of buildInsights()){
    if(out.length >= 3) break;
    if(m.startsWith('💡 Registra') || out.includes(m)) continue;
    out.push(m);
  }
  // Si aún no hay nada útil, un cierre honesto respaldado por el propio volumen.
  if(!out.length && snap.volume > 0) out.push(`✅ Sesión registrada: ${fmtKg(snap.volume)} ${wUnit()} de volumen en ${snap.sets} series.`);
  return out.slice(0, 3);
}
/** Recomendación accionable para el próximo entreno (spec §12/§60): reutiliza la
    sugerencia de sobrecarga/estancamiento ya existente. Explicable y opcional. */
function nextRecommendation(d){
  const day = SCHEDULE[d];
  let up = null, warn = null;
  visibleEx(day).forEach((e) => {
    const s = progressionSuggest(e);
    if(!s) return;
    if(s.cls === 'warn' && !warn) warn = `${e.n}: ${s.html}`;
    else if(s.cls === 'up' && !up) up = `${e.n}: ${s.html}`;
  });
  return warn || up || '';
}
/** Finaliza la sesión del día actual: sella la hora, calcula el snapshot y muestra el resumen. */
function finishCurrentSession(){
  const d = current;
  if(!dayHasProgress(d)) return;                 // nada que finalizar todavía
  ensureSessionStarted(d);
  accrueRest();                                  // cierra el descanso en curso ANTES de sellar el fin (§10)
  const date = dateOfDay(d), s = sessions[date];
  s.finishedAt = Date.now();
  setSessionState(date, 'finalizado');           // en curso → finalizado (§14)
  s.snapshot = buildSnapshot(d, s);
  Store.save();
  stopRest();
  renderSummary(d, s.snapshot);
  openPanel('summary');
  confettiBurst();
}
/** Resumen final rediseñado (spec §12): tres bloques que responden de un vistazo
    "¿Qué hice?", "¿Cómo me fue?" y "¿Estoy progresando?". Compatibilidad hacia
    atrás: snapshots viejos sin los campos nuevos degradan con valores por defecto. */
function renderSummary(d, snap){
  const host = document.getElementById('summary-body'); if(!host) return;
  const day = SCHEDULE[d] || {};
  const u = wUnit();
  const activeMs = snap.activeMs != null ? snap.activeMs : snap.durationMs || 0;
  const restMs = snap.restMs || 0;

  // --- ¿Qué hice? ---
  const muscleIds = Object.keys(snap.muscles || {}).sort((a, b) => snap.muscles[b] - snap.muscles[a]);
  const map = muscleIds.length ? miniMap(muscleIds) : '';
  const muscleChips = muscleIds.slice(0, 6)
    .map(mu => `<span class="sum-mus">${MUSCLE_LABEL[mu] || mu}</span>`).join('');
  const whatCards = `
    <div class="sum-grid">
      <div class="sum-card"><b>${fmtDuration(activeMs)}</b><span>entrenando</span></div>
      <div class="sum-card"><b>${fmtDuration(restMs)}</b><span>descansando</span></div>
      <div class="sum-card"><b>${fmtKg(snap.volume)}</b><span>${u} volumen</span></div>
      <div class="sum-card"><b>${snap.sets}</b><span>series</span></div>
      <div class="sum-card"><b>${snap.exercises}</b><span>ejercicios</span></div>
      <div class="sum-card${snap.records ? ' gold' : ''}"><b>${snap.records}</b><span>récords 🏆</span></div>
    </div>`;

  // --- ¿Cómo me fue? --- (récords + comparaciones con la última sesión y la media mensual)
  const prev = prevSameDaySession(d, snap.date);
  const cmps = [];
  if(prev){
    const pv = sessionVolume(prev);
    if(pv > 0){ const p = Math.round((snap.volume - pv) / pv * 100);
      cmps.push(`<div class="sum-cmp ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${p >= 0 ? '+' : ''}${p}% vs. tu última sesión de ${day.type || ''}</div>`); }
  }
  if(snap.monthAvg > 0){ const p = Math.round((snap.volume - snap.monthAvg) / snap.monthAvg * 100);
    cmps.push(`<div class="sum-cmp ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${p >= 0 ? '+' : ''}${p}% vs. tu media mensual</div>`); }
  const recordLine = snap.recordNames && snap.recordNames.length
    ? `<div class="sum-records">🏆 ${snap.recordNames.map(escapeHtml).join(' · ')}</div>` : '';
  const goalsLine = snap.goalsDone && snap.goalsDone.length
    ? `<div class="sum-goals">✅ Objetivo semanal cumplido: ${snap.goalsDone.join(' y ')}</div>` : '';

  // --- ¿Estoy progresando? --- (insights automáticos + recomendación para el próximo)
  const insights = sessionInsights(d, snap);
  const insightList = insights.map(m => `<li>${m}</li>`).join('');
  const rec = nextRecommendation(d);
  const recBlock = rec ? `<div class="sum-next"><b>Para la próxima:</b> ${rec}</div>` : '';

  host.innerHTML = `
    <div class="sum-hero"><div class="sum-emoji">🎉</div>
      <div class="sum-title">Entrenamiento completado</div>
      <div class="sum-sub">${day.type || ''} · ${day.label || ''}</div></div>

    <div class="sum-sec"><h3 class="sum-q">¿Qué hice?</h3>
      ${whatCards}
      ${map ? `<div class="sum-map">${map}</div>` : ''}
      ${muscleChips ? `<div class="sum-mus-row">${muscleChips}</div>` : ''}
    </div>

    <div class="sum-sec"><h3 class="sum-q">¿Cómo me fue?</h3>
      ${recordLine || (cmps.length ? '' : '<div class="sum-muted">Sigue registrando para comparar con tus sesiones anteriores.</div>')}
      ${cmps.join('')}
      ${goalsLine}
    </div>

    <div class="sum-sec"><h3 class="sum-q">¿Estoy progresando?</h3>
      ${insightList ? `<ul class="sum-insights">${insightList}</ul>` : ''}
      ${recBlock}
    </div>

    <button class="panel-close" onclick="closePanels()">Cerrar ✕</button>`;
}
/** Recuperación automática (spec §48/§210): sesión iniciada y SIN finalizar de un
    día anterior de ESTA semana (la de hoy no se avisa: estás en ella). */
function checkRecovery(){
  const today = ymd(now), wk = weekId();
  let cand = null;
  for(const date in sessions){
    const s = sessions[date];
    if(s.startedAt && !s.finishedAt && date >= wk && date < today && (!cand || date > cand.date)) cand = { date, s };
  }
  if(!cand) return;
  const day = SCHEDULE[cand.s.dayType] || {};
  const bar = document.createElement('div');
  bar.className = 'recovery';
  bar.innerHTML = `<div class="rec-txt">🔄 <b>Entrenamiento sin finalizar</b>
      <small>${day.type || ''} · ${cand.date.slice(5).replace('-', '/')}</small></div>
    <div class="rec-actions"><button class="rec-go" type="button">Continuar</button>
      <button class="rec-skip" type="button">Descartar</button></div>`;
  bar.querySelector('.rec-go').addEventListener('click', () => { setSessionState(cand.date, 'recuperado'); Store.save(); bar.remove(); if(typeof cand.s.dayType === 'number') select(cand.s.dayType); });
  bar.querySelector('.rec-skip').addEventListener('click', () => { cand.s.finishedAt = Date.now(); setSessionState(cand.date, 'cancelado'); Store.save(); bar.remove(); });
  document.body.appendChild(bar);
}

/** Crece el textarea con su contenido (sin scroll interno). */
function autoGrow(t){ t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

function resetDay(){
  visibleEx(SCHEDULE[current]).forEach((_,i)=>{
    done[exKey(i)] = false;
    const cb = document.querySelector(`.check-box[data-i="${i}"]`);
    if(cb) cb.checked = false;
    const card = document.getElementById('ex-'+i);
    if(card) card.classList.remove('done');
  });
  updateProgress();
  Store.save();
}

function updateProgress(){
  const day = SCHEDULE[current];
  if(day.rest) return;
  const total = visibleEx(day).length;
  let n = 0;
  for(let i=0;i<total;i++){ if(done[exKey(i)]) n++; }
  const pc = document.getElementById('pcount'), pb = document.getElementById('pbar');
  if(pc) pc.textContent = n;
  if(pb) pb.style.transform = 'scaleX(' + (total ? n/total : 0) + ')';   // 120Hz: transform, no width
}

/** Volumen en vivo (spec §11): entreno · semana · mes · año + top muscular, siempre
    disponible durante la sesión y recalculado tras cada serie (en segundo plano). */
function updateVolume(){
  const el = document.getElementById('volume');
  if(!el) return;
  const v = dayVolume(current);
  if(v <= 0){ el.innerHTML = `🏋️ Registra peso y reps para ver tu volumen en vivo`; return; }
  const today = ymd(now);
  const wk = weekVolume();
  const mo = (monthlyVolumes().find(m => m.key === today.slice(0,7)) || {}).volume || 0;
  const yr = (yearlyVolumes().find(y => y.key === today.slice(0,4)) || {}).volume || 0;
  const u = wUnit();
  const chip = (lbl, val) => `<span class="vchip"><span class="vchip-l">${lbl}</span><b>${fmtKg(val)} ${u}</b></span>`;
  // Comparación con la semana anterior (contexto rápido de progreso).
  const prevWeeks = weeklyVolumes().filter(w => w.weekId < weekId());
  let cmp = '';
  const prev = prevWeeks.length ? (prevWeeks[prevWeeks.length - 1].volume || 0) : 0;
  if(prev > 0){
    const diff = wk - prev, sign = diff >= 0 ? '+' : '−';
    cmp = `<div class="vcmp ${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '▲' : '▼'} ${sign}${fmtKg(Math.abs(diff))} ${u} vs. semana anterior</div>`;
  }
  // Reparto por grupo muscular del día (top 3): qué estás trabajando ahora mismo.
  const mv = dayMuscleVolume(current);
  const top = Object.keys(mv).sort((a,b)=>mv[b]-mv[a]).slice(0,3)
    .map(mu => `<span class="vmus">${MUSCLE_LABEL[mu] || mu} · ${fmtKg(mv[mu])}</span>`).join('');
  el.innerHTML = `<div class="vstrip">${chip('Entreno', v)}${chip('Semana', wk)}${chip('Mes', mo)}${chip('Año', yr)}</div>`
    + (top ? `<div class="vmus-row">${top}</div>` : '') + cmp;
}

/* ----------------------------------------------------------------
   7d. EDITOR DE RUTINAS (spec §46) · añadir/quitar/reordenar/editar
   ------------------------------------------------------------
   Edita SCHEDULE[current].ex en memoria y persiste el override vía
   RoutineRepository (IndexedDB). El id de cada ejercicio se mantiene
   estable: renombrar NO rompe el historial (indexado por id, no por nombre).
   ---------------------------------------------------------------- */
function newExercise(){
  return { id:'ex-'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),
    n:'Nuevo ejercicio', p:'', s:'3', r:'8–12', d:'90 s', m:[], q:'', tech:[] };
}
/** Persiste el día editado (ejercicios + variante exprés) en IndexedDB. */
function persistRoutine(){ const d = SCHEDULE[current]; return RoutineRepository.saveDay(current, { ex:d.ex, express:d.express, type:d.type, sub:d.sub }); }
const persistRoutineDebounced = debounce(persistRoutine, 400);

/** Recalcula los índices 'base' de la variante exprés tras reordenar/eliminar,
    usando el id del ejercicio (capturado al entrar en edición). Descarta los que
    apunten a un ejercicio eliminado. No-op si el día no define exprés. */
function repairExpress(day){
  if(!Array.isArray(day.express)) return;
  day.express = day.express.map(x => {
    const bid = x._bid || (day.ex[x.base] && day.ex[x.base].id);
    const idx = day.ex.findIndex(e => e.id === bid);
    return idx >= 0 ? Object.assign({}, x, { base:idx, _bid:bid }) : null;
  }).filter(Boolean);
}

/** Entra/sale del modo edición de la rutina del día. */
function toggleEditMode(on){
  editMode = (on === undefined) ? !editMode : !!on;
  if(editMode){
    const day = SCHEDULE[current];
    if(Array.isArray(day.express)) day.express.forEach(x => { x._bid = day.ex[x.base] && day.ex[x.base].id; });
    stopRest();
  } else {
    persistRoutine();          // sella la última edición
  }
  window.scrollTo({ top:0, behavior:'smooth' });
  render();
}

/** Acción estructural del editor: reordenar (up/down) o eliminar (del). */
function routineEditAction(action, i){
  const day = SCHEDULE[current], ex = day.ex;
  if(!ex || !ex[i]) return;
  if(action === 'del'){
    if(ex.length <= 1){ showToast('La rutina necesita al menos un ejercicio.', 'error'); return; }
    ex.splice(i, 1);
  } else if(action === 'up' && i > 0){
    const t = ex[i-1]; ex[i-1] = ex[i]; ex[i] = t;
  } else if(action === 'down' && i < ex.length - 1){
    const t = ex[i+1]; ex[i+1] = ex[i]; ex[i] = t;
  } else { return; }
  repairExpress(day);
  persistRoutine();
  render();
}
/** Añade un ejercicio en blanco al final de la rutina del día. */
function routineAddExercise(){
  SCHEDULE[current].ex.push(newExercise());
  persistRoutine();
  render();
}
/** Duplica la rutina del día actual en otro día (spec §46 · duplicar). */
function routineDuplicateTo(targetDow){
  const src = SCHEDULE[current], tgt = SCHEDULE[targetDow];
  if(!tgt || tgt.rest) return;
  tgt.ex = JSON.parse(JSON.stringify(src.ex));
  if(src.express) tgt.express = JSON.parse(JSON.stringify(src.express));
  freezeExerciseIds();
  RoutineRepository.saveDay(targetDow, { ex:tgt.ex, express:tgt.express, type:tgt.type, sub:tgt.sub });
  showToast(`Rutina copiada a ${tgt.label} ✓`, 'success');
}
/** Restaura el plan por defecto de este día, descartando las ediciones (spec §46). */
async function routineReset(){
  const ok = await confirmDialog('Restaurar plan original',
    `Se descartarán tus cambios en ${SCHEDULE[current].label} y volverá el plan por defecto. ¿Continuar?`, 'Restaurar');
  if(!ok) return;
  SCHEDULE[current] = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE[current]));
  RoutineRepository.removeDay(current);
  freezeExerciseIds();
  render();
  showToast('Plan original restaurado ✓', 'success');
}

/** Vista del editor (reemplaza la vista normal del día en modo edición). */
function renderRoutineEditor(day){
  const rows = day.ex.map((e, i) => `
    <div class="ed-row" data-i="${i}">
      <div class="ed-row-top">
        <span class="ed-idx">${i + 1}</span>
        <input class="ed-name" value="${escapeAttr(e.n)}" data-k="edit" data-i="${i}" data-field="n" placeholder="Nombre del ejercicio" aria-label="Nombre ejercicio ${i + 1}">
        <span class="ed-ops">
          <button class="ed-op" type="button" data-editact="up" data-i="${i}" aria-label="Subir ejercicio ${i + 1}">↑</button>
          <button class="ed-op" type="button" data-editact="down" data-i="${i}" aria-label="Bajar ejercicio ${i + 1}">↓</button>
          <button class="ed-op ed-del" type="button" data-editact="del" data-i="${i}" aria-label="Eliminar ejercicio ${i + 1}">🗑</button>
        </span>
      </div>
      <input class="ed-purpose" value="${escapeAttr(e.p || '')}" data-k="edit" data-i="${i}" data-field="p" placeholder="Énfasis (p. ej. Pecho superior)" aria-label="Énfasis ${i + 1}">
      <div class="ed-fields">
        <label>Series<input value="${escapeAttr(e.s || '')}" data-k="edit" data-i="${i}" data-field="s" placeholder="4" aria-label="Series objetivo ${i + 1}"></label>
        <label>Reps<input value="${escapeAttr(e.r || '')}" data-k="edit" data-i="${i}" data-field="r" placeholder="8–12" aria-label="Reps objetivo ${i + 1}"></label>
        <label>Descanso<input value="${escapeAttr(e.d || '')}" data-k="edit" data-i="${i}" data-field="d" placeholder="90 s" aria-label="Descanso ${i + 1}"></label>
      </div>
    </div>`).join('');
  const dupChips = ORDER.filter(d => d !== current && !SCHEDULE[d].rest)
    .map(d => `<button class="chipbtn" type="button" data-dupday="${d}">${SCHEDULE[d].label}</button>`).join('');
  return `<section class="dayhead"><div class="dayhead-main">
      <div class="daytype">Editar rutina</div>
      <div class="daysub">${day.label} — renombra, añade, quita, reordena o ajusta. Se guarda solo.</div>
    </div></section>
    <div class="ed-meta">
      <label class="ed-metafield">Nombre de la rutina
        <input class="ed-name" value="${escapeAttr(day.type || '')}" data-k="editday" data-field="type" placeholder="Empuje" aria-label="Nombre de la rutina"></label>
      <label class="ed-metafield">Subtítulo
        <input class="ed-purpose" value="${escapeAttr(day.sub || '')}" data-k="editday" data-field="sub" placeholder="Pecho · Hombro · Tríceps" aria-label="Subtítulo de la rutina"></label>
    </div>
    <div class="ed-list">${rows}</div>
    <button class="ed-add" type="button" data-addex>＋ Añadir ejercicio</button>
    <div class="ed-tools">
      <div class="ed-tools-lbl">Duplicar esta rutina en otro día</div>
      <div class="chip-row">${dupChips || '<small>No hay otros días disponibles.</small>'}</div>
      <button class="ed-reset" type="button" data-resetroutine>↺ Restaurar plan original de este día</button>
    </div>
    <button class="finish-btn" type="button" onclick="toggleEditMode(false)">✓ Listo</button>`;
}

function select(d){
  current = d;
  editMode = false;
  closePanels();
  renderDays();
  render();
  window.scrollTo({top:0,behavior:'smooth'});
  Store.save();
}

function openPanel(id){
  editMode = false;
  closePanels();
  if(id === 'progress') renderProgress();   // genera las gráficas al abrir
  if(id === 'settings') renderSettings();   // genera el panel de ajustes
  const p = document.getElementById(id);
  if(!p) return;
  p.hidden = false;
  const body = document.getElementById(id + '-body'); if(body) body.scrollTop = 0;
  setActiveTab(id);
}

function closePanels(){
  ['progress','summary','settings'].forEach(id=>{
    const p = document.getElementById(id);
    if(p) p.hidden = true;
  });
  setActiveTab('train');
}

/** Resalta la pestaña activa de la barra inferior. */
function setActiveTab(id){
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === id));
}
/** Vuelve a la vista de entrenamiento (cierra cualquier hoja abierta). */
function showTrain(){ closePanels(); }

/* --- Feedback moderno: toasts y diálogo de confirmación (sustituyen alert/confirm) --- */
let toastTimer = null;
function showToast(msg, type){
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.hidden = false;
  void t.offsetWidth;                          // reinicia la animación de entrada
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => { t.hidden = true; }, 260); }, 2600);
}
function confirmDialog(title, msg, okLabel){
  return new Promise(resolve => {
    const back = document.getElementById('dialog');
    if(!back){ resolve(window.confirm(msg)); return; }
    document.getElementById('dialog-title').textContent = title || '';
    document.getElementById('dialog-msg').textContent = msg || '';
    const ok = document.getElementById('dialog-ok'), cancel = document.getElementById('dialog-cancel');
    ok.textContent = okLabel || 'Aceptar';
    back.hidden = false; void back.offsetWidth; back.classList.add('show');
    const close = (val) => {
      back.classList.remove('show'); setTimeout(() => { back.hidden = true; }, 200);
      ok.onclick = cancel.onclick = back.onclick = null; resolve(val);
    };
    ok.onclick = () => close(true);
    cancel.onclick = () => close(false);
    back.onclick = (e) => { if(e.target === back) close(false); };
  });
}

/* ----------------------------------------------------------------
   7i. CONFIGURACIÓN  (Fase E · tema, descanso por defecto, datos)
   ---------------------------------------------------------------- */
/** Aplica el tema guardado (claro/oscuro) al documento y a la barra del sistema. */
function applyTheme(){
  document.documentElement.setAttribute('data-theme', theme);
  const m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content', theme === 'light' ? '#F4F5F7' : '#0E0F13');
}
/** Fija el tema, lo aplica y lo persiste. */
function setTheme(t){ theme = (t === 'light') ? 'light' : 'dark'; applyTheme(); syncSettings(); Store.save(); }
/** Fija el descanso por defecto (0 = usar el sugerido por cada ejercicio). */
function setRestDefault(s){ restDefault = +s || 0; syncSettings(); Store.save(); }
/** Fija la unidad de peso mostrada (spec §22/§108). Los datos siguen en kg. */
function setUnit(u){ unit = (u === 'lb') ? 'lb' : 'kg'; syncSettings(); render(); Store.save(); }
/** Fija una meta semanal (spec §81): kind = 'sessions' | 'volume'. 0 = sin meta.
    La meta de volumen se introduce en la unidad elegida y se guarda en kg. */
function setGoal(kind, val){
  let v = Math.max(0, +val || 0);
  if(kind === 'volume') v = toKg(v);
  goals[kind] = Math.round(v);
  syncSettings(); Store.save();
}
/** Re-pinta el panel de ajustes si está abierto (refleja el estado activo). */
function syncSettings(){ const p = document.getElementById('settings'); if(p && !p.hidden) renderSettings(); }
/** Panel de configuración (spec §47/§100/§108). */
function renderSettings(){
  const host = document.getElementById('settings-body'); if(!host) return;
  const presets = [0, 30, 60, 90, 120, 180];
  host.innerHTML = `
    <h3>Apariencia</h3>
    <div class="seg" role="group" aria-label="Tema">
      <button class="seg-btn ${theme === 'dark' ? 'on' : ''}" onclick="setTheme('dark')">🌙 Oscuro</button>
      <button class="seg-btn ${theme === 'light' ? 'on' : ''}" onclick="setTheme('light')">☀️ Claro</button>
    </div>
    <h3>Unidad de peso</h3>
    <p><small>Cambia cómo se muestran los pesos. Tus datos siempre se guardan igual.</small></p>
    <div class="seg" role="group" aria-label="Unidad de peso">
      <button class="seg-btn ${unit === 'kg' ? 'on' : ''}" onclick="setUnit('kg')">kg</button>
      <button class="seg-btn ${unit === 'lb' ? 'on' : ''}" onclick="setUnit('lb')">lb</button>
    </div>
    <h3>Descanso por defecto</h3>
    <p><small>Al marcar una serie el cronómetro usará este tiempo. «Del plan» respeta el descanso sugerido por cada ejercicio.</small></p>
    <div class="chip-row">${presets.map(s => `<button class="chipbtn ${restDefault === s ? 'on' : ''}" onclick="setRestDefault(${s})">${s === 0 ? 'Del plan' : s + 's'}</button>`).join('')}</div>
    <h3>Metas semanales 🎯</h3>
    <p><small>Ponte objetivos y sigue su progreso en la pestaña Progreso. 0 = sin meta.</small></p>
    <label class="goal-field">Sesiones por semana
      <input type="number" inputmode="numeric" min="0" max="14" value="${goals.sessions || ''}" placeholder="0" onchange="setGoal('sessions', this.value)" aria-label="Meta de sesiones por semana"></label>
    <label class="goal-field">Volumen semanal (${wUnit()})
      <input type="number" inputmode="numeric" min="0" step="500" value="${goals.volume ? Math.round(toDisp(goals.volume)) : ''}" placeholder="0" onchange="setGoal('volume', this.value)" aria-label="Meta de volumen semanal"></label>
    <h3>Glosario</h3>
    <details class="acc"><summary><span class="acc-ico">💡</span> ¿Qué es el RIR?</summary><div class="gloss"><b>Repeticiones en reserva.</b> Cuántas repeticiones más podrías haber hecho antes de fallar. RIR 2 = te quedaban 2; RIR 0 = fallo total. Para ganar músculo, apunta a RIR 0–3.</div></details>
    <details class="acc"><summary><span class="acc-ico">🔢</span> ¿Qué son las reps?</summary><div class="gloss"><b>Repeticiones:</b> cuántas veces levantas el peso en una serie. «70 ${wUnit()} × 10» = diez repeticiones con 70 kg. Un grupo de reps seguidas es una <b>serie</b>; descansas entre series.</div></details>
    <details class="acc"><summary><span class="acc-ico">🏷️</span> Tipos de serie</summary><div class="gloss"><b>Efectiva:</b> cuenta para volumen y récords (tus series serias). <b>Calentamiento</b> y <b>Aproximación:</b> preparan el cuerpo, no cuentan. <b>Al fallo · Drop set · Back-off · Rest-pause · Myo-reps · Superserie:</b> técnicas intensas para series puntuales.</div></details>
    <details class="acc"><summary><span class="acc-ico">📈</span> 1RM estimado y volumen</summary><div class="gloss"><b>1RM estimado:</b> el peso que probablemente levantarías una sola vez; la app lo calcula con tu serie (fórmula de Epley), sin que lo pruebes. <b>Volumen:</b> peso × reps sumado de tus series efectivas; subirlo con el tiempo = progreso.</div></details>
    <h3>Tus datos</h3>
    <div class="export-row">
      <button class="pbtn" onclick="exportJSON()">💾 Respaldo</button>
      <button class="pbtn" onclick="importJSON()">♻️ Restaurar</button>
      <button class="pbtn" onclick="exportCSV()">📥 CSV</button>
      <button class="pbtn" onclick="exportPDF()">📄 PDF</button>
    </div>
    <button class="panel-close" onclick="closePanels()">Cerrar ✕</button>`;
}

/* ----------------------------------------------------------------
   7g. PANEL DE PROGRESO  (gráficas de volumen y récords)
   ---------------------------------------------------------------- */
/** Descarga un contenido como archivo (offline). */
function download(content, filename, type){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/** Filas de estadísticas: un ejercicio por récord registrado. */
function statsRows(){
  return Object.keys(bests).map(k => {
    const d = +k.slice(0, k.indexOf('-'));
    const slug = k.slice(k.indexOf('-') + 1);
    const ex = resolveBySlug(d, slug, 'full') || resolveBySlug(d, slug, 'express');
    if(!ex) return null;
    const b = bests[k] || {};
    const hist = exerciseHistory(d, slug);
    const last = hist.length ? hist[hist.length - 1] : null;   // última sesión registrada
    return { dia: (SCHEDULE[d] || {}).label || '', ejercicio: ex.n, record: b.w || 0,
             recDate: b.date || '', peso: last ? last.w : 0, reps: last ? last.reps : 0 };
  }).filter(Boolean).sort((a, b) => b.record - a.record);
}

/** Exporta las estadísticas como CSV (abre en Sheets/Excel/My Files). */
function exportCSV(){
  const lines = ['Dia,Ejercicio,Record (kg),Ultimo peso (kg),Ultimas reps'];
  statsRows().forEach(r =>
    lines.push([r.dia, '"' + r.ejercicio.replace(/"/g, '""') + '"', r.record, r.peso, r.reps].join(',')));
  lines.push('', 'Semana (lunes),Volumen total (kg)');
  const curWk = weekId();
  weeklyVolumes().filter(w => w.weekId < curWk).forEach(w => lines.push([w.weekId, w.volume].join(',')));
  lines.push([curWk + ' (actual)', weekVolume()].join(','));
  download('﻿' + lines.join('\r\n'), 'entreno-v-estadisticas.csv', 'text/csv;charset=utf-8');
  showToast('CSV descargado ✓', 'success');
}

/** Exporta un respaldo JSON completo (para no perder nada / cambiar de móvil). */
function exportJSON(){
  download(DB.read(Store.KEY) || '{}', 'entreno-v-respaldo.json', 'application/json');
  showToast('Respaldo descargado ✓', 'success');
}

/** Exporta un informe imprimible (spec §85). Usa el diálogo de impresión del
    navegador -> "Guardar como PDF" (funciona offline, sin librerías). */
function exportPDF(){
  let host = document.getElementById('printReport');
  if(!host){ host = document.createElement('div'); host.id = 'printReport'; document.body.appendChild(host); }
  const gr = globalRecords(), cs = consistencyStats();
  const weeks = weeklyVolumes().slice(-12);
  const rows = statsRows();
  const u = wUnit();
  const today = new Date().toLocaleDateString('es-ES');
  host.innerHTML = `
    <h1>Entreno V — Informe de progreso</h1>
    <p class="pr-date">Generado el ${today}</p>
    <h2>Resumen</h2>
    <ul>
      <li>Volumen esta semana: <b>${fmtKg(weekVolume())} ${u}</b></li>
      <li>Racha: <b>${cs.streak}</b> semanas · Sesiones este mes: <b>${cs.month}</b> · Total: <b>${cs.total}</b></li>
      <li>1RM máx: <b>${gr.maxRm ? fmtKg(gr.maxRm) + ' ' + u : '—'}</b> · Reps máx: <b>${gr.maxReps || '—'}</b></li>
      <li>Mejor semana: <b>${fmtKg(gr.bestWeek)} ${u}</b> · Mejor mes: <b>${fmtKg(gr.bestMonth)} ${u}</b> · Racha máx: <b>${gr.maxStreak}</b></li>
    </ul>
    <h2>Volumen por semana</h2>
    <table><thead><tr><th>Semana (lunes)</th><th>Volumen (${u})</th></tr></thead><tbody>
      ${weeks.map(w => `<tr><td>${w.weekId}</td><td>${fmtKg(w.volume)}</td></tr>`).join('') || '<tr><td colspan="2">Sin datos</td></tr>'}
    </tbody></table>
    <h2>Récords por ejercicio</h2>
    <table><thead><tr><th>Ejercicio</th><th>Récord (${u})</th><th>Último</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r.ejercicio}</td><td>${fmtKg(r.record)}</td><td>${r.peso ? fmtKg(r.peso) + ' × ' + r.reps : '—'}</td></tr>`).join('') || '<tr><td colspan="3">Registra pesos para ver récords</td></tr>'}
    </tbody></table>
    <p class="pr-foot">Entreno V · PWA de entrenamiento · datos locales del usuario</p>`;
  document.body.classList.add('printing');
  // Espera un frame para que el layout del informe esté listo antes de imprimir.
  setTimeout(() => { window.print(); document.body.classList.remove('printing'); }, 60);
}

/**
 * FASE 0 — Restaurar respaldo (el seguro de vida).
 * Lee un .json descargado con "Respaldo" y lo vuelve a cargar. Si el navegador
 * limpia localStorage (falta de espacio, borrar datos del sitio) o cambias de
 * móvil, recuperas todo. Valida el archivo, PIDE CONFIRMACIÓN y recarga.
 * Detecta el esquema: un respaldo v2 se escribe tal cual; uno v1 se escribe en
 * su clave y se borra la v2 para que la app lo MIGRE al recargar.
 */
function importJSON(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onerror = () => showToast('No pude leer el archivo. Inténtalo de nuevo.', 'error');
    reader.onload = async () => {
      let data;
      try{ data = JSON.parse(reader.result); }
      catch(_){ showToast('Ese archivo no es un respaldo válido (.json ilegible).', 'error'); return; }
      if(!isValidBackup(data)){
        showToast('Ese archivo no parece un respaldo de Entreno V.', 'error');
        return;
      }
      const go = await confirmDialog('Restaurar respaldo',
        'Esto reemplazará tus datos actuales por los del respaldo. ¿Quieres continuar?', 'Restaurar');
      if(!go) return;
      try{
        if(data.schemaVersion === 3){
          DB.write(Store.KEY, JSON.stringify(data));            // respaldo v3: tal cual
        }else if(data.schemaVersion === 2){
          DB.write(Store.KEY_V2, JSON.stringify(data));         // respaldo v2: en su clave
          DB.remove(Store.KEY);                                // fuerza migración v2→v3 al recargar
        }else{
          DB.write(Store.KEY_V1, JSON.stringify(data));         // respaldo v1: en su clave
          DB.remove(Store.KEY);
          DB.remove(Store.KEY_V2);                             // fuerza migración v1→…→v3
        }
      }
      catch(_){ showToast('No pude guardar el respaldo (almacenamiento no disponible).', 'error'); return; }
      showToast('✅ Respaldo restaurado. Recargando…', 'success');
      setTimeout(() => location.reload(), 950);
    };
    reader.readAsText(file);
  });
  input.click();
}

/** Valida, sin ser estricto, que un objeto parece un estado de Entreno V. */
function isValidBackup(d){
  if(!d || typeof d !== 'object' || Array.isArray(d)) return false;
  if('schemaVersion' in d) return true;                                        // respaldo v2 (futuro)
  return ['week','done','loads','notes','bests','history'].some(k => k in d);  // respaldo v1
}

/** Sección "Progreso por ejercicio" (FASE 4): por cada ejercicio con 2+ sesiones,
    su curva de peso y cuánto subió. Es la gráfica estrella del "me veo reflejado". */
function progressByExerciseHtml(){
  const items = [];
  for(const d of ORDER){
    const day = SCHEDULE[d]; if(day.rest || !day.ex) continue;
    day.ex.forEach(e => { const h = exerciseHistory(d, e.id); if(h.length >= 2) items.push({ e, h }); });
  }
  if(!items.length){
    return '<p><small>Registra un mismo ejercicio en 2 o más sesiones y aquí verás su curva de progreso en el tiempo. 📈</small></p>';
  }
  items.sort((a, b) => b.h.length - a.h.length);   // primero los que más historial tienen
  return items.slice(0, 8).map(({ e, h }) => {
    const first = h[0], last = h[h.length - 1], diff = last.w - first.w;
    const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
    return `<div class="exprog">
      <div class="exprog-head"><span class="exprog-name">${e.n}</span>
        <span class="exprog-delta ${cls}">${sign}${fmtKg(Math.abs(diff))} ${wUnit()}</span></div>
      ${svgExerciseCurve(h.slice(-10))}</div>`;
  }).join('');
}

/* --- DASHBOARD 2.0 (Fase D) · constancia, frecuencia muscular e insights --- */
/** Estadísticas de constancia (spec §80): racha de semanas + conteos de sesiones. */
function consistencyStats(){
  const active = {};
  weeklyVolumes().forEach(w => { if(w.volume > 0) active[w.weekId] = true; });
  if(weekVolume() > 0) active[weekId()] = true;
  let streak = 0, cursor = weekId();
  while(active[cursor]){ streak++; cursor = ymd(addDays(parseYmd(cursor), -7)); }
  const ym = ymd(now).slice(0, 7), yy = ymd(now).slice(0, 4);
  let month = 0, year = 0, total = 0;
  for(const date in sessions){ if(sessionVolume(sessions[date]) > 0){ total++; if(date.slice(0,7) === ym) month++; if(date.slice(0,4) === yy) year++; } }
  return { streak, month, year, total };
}
/** Series efectivas por músculo esta semana (mapas de trabajo actuales). */
function muscleSetsThisWeek(){
  const out = {};
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/); if(!m) continue;
    const e = resolveExercise(+m[2], +m[3], m[1] === 'x'); if(!e || !e.m) continue;
    const c = effectiveSetCount(setsMap[key]); if(!c) continue;
    e.m.forEach(mu => { out[mu] = (out[mu] || 0) + c; });
  }
  return out;
}
/** Última fecha (YYYY-MM-DD) en que se entrenó cada músculo (todo el histórico). */
function muscleLastTrained(){
  const out = {};
  for(const date in sessions){
    const s = sessions[date];
    ['full','express'].forEach(mode => {
      const bag = s[mode] && s[mode].ex; if(!bag) return;
      for(const slug in bag){
        if(!setsVolume(bag[slug].sets)) continue;
        const e = resolveBySlug(s.dayType, slug, mode); if(!e || !e.m) continue;
        e.m.forEach(mu => { if(!out[mu] || date > out[mu]) out[mu] = date; });
      }
    });
  }
  return out;
}
/** "hoy" / "ayer" / "hace X d" a partir de una fecha YYYY-MM-DD. */
function daysAgoLabel(date){
  const diff = Math.round((parseYmd(ymd(now)) - parseYmd(date)) / 86400000);
  return diff <= 0 ? 'hoy' : diff === 1 ? 'ayer' : `hace ${diff} d`;
}
/** Tabla de frecuencia muscular (spec §77): series esta semana + última vez. */
function muscleFreqHtml(){
  const setsBy = muscleSetsThisWeek(), lastBy = muscleLastTrained();
  const muscles = Array.from(new Set([...Object.keys(setsBy), ...Object.keys(lastBy)]));
  if(!muscles.length) return '<p><small>Registra series para ver la frecuencia por músculo.</small></p>';
  muscles.sort((a, b) => (setsBy[b] || 0) - (setsBy[a] || 0));
  return `<div class="mfreq">` + muscles.map(mu =>
    `<div class="mfreq-row"><span class="mfreq-name">${MUSCLE_LABEL[mu] || mu}</span>
      <span class="mfreq-sets">${setsBy[mu] || 0} series</span>
      <span class="mfreq-last">${lastBy[mu] ? daysAgoLabel(lastBy[mu]) : '—'}</span></div>`).join('') + `</div>`;
}
/** Mensajes inteligentes basados en datos reales (spec §83). Nunca aleatorios. */
function buildInsights(){
  const out = [];
  const curWk = weekId(), weekNow = weekVolume();
  const prevs = weeklyVolumes().filter(w => w.weekId < curWk);
  const prev = prevs.length ? prevs[prevs.length - 1].volume : 0;
  const maxPrev = prevs.reduce((mx, w) => Math.max(mx, w.volume), 0);
  if(weekNow > 0 && weekNow > maxPrev && maxPrev > 0){ out.push('🔥 Nuevo récord de volumen semanal.'); }
  else if(prev > 0){
    const diff = weekNow - prev, pct = Math.round(diff / prev * 100);
    if(diff > 0) out.push(`📈 Llevas +${pct}% de volumen respecto a la semana pasada.`);
    else if(diff < 0) out.push(`📉 Vas ${pct}% de volumen frente a la semana pasada.`);
  }
  const st = consistencyStats();
  if(st.streak >= 2) out.push(`✅ Racha de ${st.streak} semanas entrenando. ¡Sigue así!`);
  const last = muscleLastTrained();
  let stale = null, staleDays = 10;
  for(const mu in last){ const diff = Math.round((parseYmd(ymd(now)) - parseYmd(last[mu])) / 86400000); if(diff > staleDays){ staleDays = diff; stale = mu; } }
  if(stale) out.push(`💤 Llevas ${staleDays} días sin entrenar ${(MUSCLE_LABEL[stale] || stale).toLowerCase()}.`);
  // Fatiga (spec §60): volumen a la baja varias semanas + RIR muy bajo (cerca del fallo).
  const avgRir = weeklyMetrics().avgRir;
  if(prevs.length >= 2){
    const a = prevs[prevs.length - 1].volume, b = prevs[prevs.length - 2].volume;
    if(a < b && weekNow > 0 && weekNow < a && avgRir != null && avgRir < 1.5){
      out.push('😴 Volumen a la baja con RIR muy bajo: podrías estar acumulando fatiga. Considera una semana más suave.');
    }
  }
  if(!out.length) out.push('💡 Registra tus series y aquí verás análisis de tu progreso.');
  return out.slice(0, 4);
}
/** Logros desbloqueables por datos reales (spec §32/§82). Discretos, no infantiles. */
function buildAchievements(){
  const st = consistencyStats();
  let totalVol = weekVolume();
  weeklyVolumes().filter(w => w.weekId < weekId()).forEach(w => totalVol += w.volume);
  const prCount = Object.keys(bests).length;
  return [
    { icon:'🎯', label:'Primer entreno', ok: st.total >= 1 },
    { icon:'🏆', label:'Primer récord',  ok: prCount >= 1 },
    { icon:'🔥', label:'Racha ×2',       ok: st.streak >= 2 },
    { icon:'💪', label:'10 sesiones',    ok: st.total >= 10 },
    { icon:'🏋️', label:'10 t movidas',  ok: totalVol >= 10000 },
    { icon:'⭐', label:'Racha ×4',       ok: st.streak >= 4 }
  ];
}
function achievementsHtml(){
  return `<div class="ach">` + buildAchievements().map(a =>
    `<div class="ach-badge ${a.ok ? 'on' : ''}"><span class="ach-ico">${a.icon}</span><span>${a.label}</span></div>`).join('') + `</div>`;
}
/** Métricas clave de la semana (spec §75): series efectivas, RIR medio, ejercicios. */
function weeklyMetrics(){
  let effSets = 0, totalSets = 0, rirSum = 0, rirN = 0, wSum = 0, repsSum = 0;
  const exSet = new Set();
  for(const key in setsMap){
    if(!/^(x?)\d+-\d+$/.test(key)) continue;
    (setsMap[key] || []).forEach(s => {
      if(!s) return;
      totalSets++;
      if(s.w > 0 && s.reps > 0 && isEffective(s.type)){
        effSets++; exSet.add(key);
        wSum += s.w; repsSum += s.reps;
        if(s.rir !== '' && s.rir != null){ rirSum += +s.rir; rirN++; }
      }
    });
  }
  return {
    effSets, totalSets, exercises: exSet.size,
    avgRir: rirN ? rirSum / rirN : null,
    avgWeight: effSets ? wSum / effSets : null,
    avgReps: effSets ? repsSum / effSets : null
  };
}

/* --- Gráficas de progreso · rango temporal (spec §73/§74/§84) --- */
let progressRange = 'week';
function setProgressRange(r){ progressRange = r; renderProgress(); }
/** Serie de puntos para la curva de tendencia según el rango elegido. */
function trendData(){
  if(progressRange === 'month') return monthlyVolumes().slice(-12).map(m => ({ label:m.key.slice(5), value:m.volume }));
  if(progressRange === 'year')  return yearlyVolumes().slice(-8).map(y => ({ label:y.key, value:y.volume }));
  const curWk = weekId();
  const t = weeklyVolumes().filter(w => w.weekId < curWk).map(w => ({ label:w.weekId.slice(5).replace('-','/'), value:w.volume }));
  t.push({ label:'ahora', value:weekVolume() });
  return t.slice(-14);
}
/** Volumen y etiqueta del periodo actual para el encabezado de la gráfica. */
function currentPeriodStat(){
  const d = ymd(now);
  if(progressRange === 'month') return { v:(monthlyVolumes().find(m => m.key === d.slice(0,7)) || {}).volume || 0, lbl:'este mes' };
  if(progressRange === 'year')  return { v:(yearlyVolumes().find(y => y.key === d.slice(0,4)) || {}).volume || 0, lbl:'este año' };
  return { v:weekVolume(), lbl:'esta semana' };
}
/** Bloque de comparativas de progreso (spec §74): responde "¿estás progresando?". */
function progressComparisonHtml(){
  const c = progressionComparison();
  const pill = (lbl, pct) => `<div class="cmp ${pct==null?'':pct>=0?'up':'down'}">
    <span class="cmp-v">${pct==null ? '—' : (pct>=0?'▲ +':'▼ ')+pct+'%'}</span><span class="cmp-l">${lbl}</span></div>`;
  return `<div class="cmp-grid">${pill('vs. semana pasada', c.vsLast)}${pill('vs. hace 4 sem', c.vs4)}${pill('vs. hace 3 meses', c.vs12)}</div>`;
}

/** Barra de progreso de una meta (spec §81). Devuelve '' si la meta está en 0. */
function goalBar(label, cur, goal, unit){
  if(!goal) return '';
  const pct = Math.min(100, Math.round(cur / goal * 100));
  const done = cur >= goal;
  return `<div class="goal-row ${done ? 'done' : ''}">
    <div class="goal-top"><span>${label}</span><b>${fmtKg(cur)} / ${fmtKg(goal)}${unit ? ' ' + unit : ''}${done ? ' ✓' : ''}</b></div>
    <div class="goal-track"><i style="width:${pct}%"></i></div></div>`;
}
/** Nº de días de la semana en curso con volumen registrado (para la meta de sesiones). */
function weekSessionsCount(){
  return ORDER.filter(d => !SCHEDULE[d].rest && dayVolumeAnyMode(d) > 0).length;
}

/** Récords históricos globales (spec §28/§76): calculados del historial completo.
    1RM máx, reps máx, volumen de sesión máx, mejor semana, mejor mes y racha máxima. */
function globalRecords(){
  let maxRm = 0, maxReps = 0, maxSessionVol = 0, maxRmName = '';
  for(const date in sessions){
    const s = sessions[date];
    ['full','express'].forEach(mode => {
      const bag = s[mode] && s[mode].ex; if(!bag) return;
      for(const slug in bag){
        const sets = bag[slug] && bag[slug].sets;
        const rm = best1RM(sets);
        if(rm > maxRm){ maxRm = rm; const ex = resolveBySlug(s.dayType, slug, mode); maxRmName = ex ? ex.n : ''; }
        const vol = setsVolume(sets); if(vol > maxSessionVol) maxSessionVol = vol;
        if(Array.isArray(sets)) for(const st of sets){ if(st && isEffective(st.type) && st.w > 0 && st.reps > maxReps) maxReps = st.reps; }
      }
    });
  }
  const curWk = weekId();
  const bestWeek = Math.max(0, weekVolume(), ...weeklyVolumes().map(w => w.volume));
  const byMonth = {};
  for(const date in sessions){ const m = date.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + sessionVolume(sessions[date]); }
  const bestMonth = Math.max(0, ...Object.values(byMonth));
  // Racha máxima de semanas activas consecutivas.
  const active = {}; weeklyVolumes().forEach(w => { if(w.volume > 0) active[w.weekId] = true; });
  if(weekVolume() > 0) active[curWk] = true;
  let maxStreak = 0, run = 0, prev = null;
  Object.keys(active).sort().forEach(wk => {
    run = (prev && ymd(addDays(parseYmd(prev), 7)) === wk) ? run + 1 : 1;
    if(run > maxStreak) maxStreak = run; prev = wk;
  });
  return { maxRm:Math.round(maxRm), maxRmName, maxReps, maxSessionVol:Math.round(maxSessionVol),
           bestWeek:Math.round(bestWeek), bestMonth:Math.round(bestMonth), maxStreak };
}

function renderProgress(){
  const host = document.getElementById('progress-body');
  if(!host) return;
  const cstats = consistencyStats();
  const grec = globalRecords();
  const insights = buildInsights();
  const wm = weeklyMetrics();
  const s1 = wm.effSets === 1 ? '' : 's';
  const metricsLine = `⚡ <b>${wm.effSets}</b> serie${s1} efectiva${s1}`
    + (wm.avgRir != null ? ` · 🎯 RIR medio <b>${wm.avgRir.toFixed(1)}</b>` : '')
    + ` · 🏋️ <b>${wm.exercises}</b> ejercicio${wm.exercises === 1 ? '' : 's'}`;

  // --- Resumen ---
  const rows = statsRows();
  const weekNow = weekVolume();
  const sessCount = ORDER.filter(d => !SCHEDULE[d].rest)
    .filter(d => SCHEDULE[d].ex.length && SCHEDULE[d].ex.every((_, i) => done[`${d}-${i}`])).length;
  const recordCount = Object.keys(bests).length;

  // --- Volumen por día (barras verticales) ---
  const dias = ORDER.filter(d => !SCHEDULE[d].rest)
    .map(d => ({ label: SCHEDULE[d].ab, value: dayVolumeAnyMode(d), hot: d === todayDow }));

  // --- Volumen por músculo (barras horizontales, top 8) ---
  const mv = muscleVolumeThisWeek();
  const muscleRows = Object.keys(mv)
    .map(k => ({ label: MUSCLE_LABEL[k] || k, value: mv[k], valText: fmtKg(mv[k]) }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  // --- Tendencia según rango (semana/mes/año) + periodo actual ---
  const td = trendData();
  const cps = currentPeriodStat();

  // --- Récords (barras horizontales) ---
  const recRows = Object.keys(bests).map(k => {
    const d = +k.slice(0, k.indexOf('-'));
    const slug = k.slice(k.indexOf('-') + 1);
    const ex = resolveBySlug(d, slug, 'full') || resolveBySlug(d, slug, 'express');
    return ex ? { label: ex.n, value: bests[k].w, valText: fmtKg(bests[k].w) + ' ' + wUnit() } : null;
  }).filter(Boolean).sort((a, b) => b.value - a.value).slice(0, 8);

  // --- Constancia (heatmap tipo GitHub): últimas 12 semanas por volumen ---
  const heatHtml = consistencyHeatmap(weekNow);

  host.innerHTML = `
    <h3>Resumen de la semana</h3>
    <div class="stat-cards">
      <div class="scard k1"><b>${fmtKg(weekNow)}</b><span>${wUnit()} volumen</span></div>
      <div class="scard k2"><b>${sessCount}</b><span>sesiones</span></div>
      <div class="scard k3"><b>${recordCount}</b><span>récords</span></div>
      <div class="scard k4"><b>${cstats.streak}</b><span>racha sem.</span></div>
    </div>
    <div class="insights">${insights.map(t => `<div class="insight">${t}</div>`).join('')}</div>
    <div class="metrics">${metricsLine}</div>
    ${(goals.sessions || goals.volume) ? `<h3>Metas 🎯</h3>
      ${goalBar('Sesiones', weekSessionsCount(), goals.sessions, '')}
      ${goalBar('Volumen', weekNow, goals.volume, wUnit())}` : ''}
    <h3>Intensidad de la semana</h3>
    <div class="stat-cards">
      <div class="scard k1"><b>${wm.avgWeight != null ? fmtWeight(wm.avgWeight) : '—'}</b><span>peso medio (${wUnit()})</span></div>
      <div class="scard k2"><b>${wm.avgReps != null ? wm.avgReps.toFixed(1) : '—'}</b><span>reps medias</span></div>
      <div class="scard k3"><b>${wm.avgRir != null ? wm.avgRir.toFixed(1) : '—'}</b><span>RIR medio</span></div>
      <div class="scard k4"><b>${wm.effSets}/${wm.totalSets}</b><span>series ef./tot.</span></div>
    </div>
    <h3>Tu progreso 📈</h3>
    ${progressComparisonHtml()}
    <div class="range-tabs" role="group" aria-label="Rango temporal de la gráfica">
      <button class="rtab ${progressRange==='week'?'on':''}" type="button" onclick="setProgressRange('week')">Semana</button>
      <button class="rtab ${progressRange==='month'?'on':''}" type="button" onclick="setProgressRange('month')">Mes</button>
      <button class="rtab ${progressRange==='year'?'on':''}" type="button" onclick="setProgressRange('year')">Año</button>
    </div>
    <div class="chart-card">
      <div class="chart-cap"><b>${fmtKg(cps.v)}<span class="u">${wUnit()}</span></b><span>${cps.lbl}</span></div>
      ${td.length > 1 ? svgArea(td) : '<p style="margin:4px 2px"><small>Aún no hay suficiente historial para esta vista: la curva crece con cada sesión. 📈</small></p>'}
    </div>
    <h3>Progreso por ejercicio</h3>
    ${progressByExerciseHtml()}
    <h3>Constancia · últimas semanas</h3>
    ${heatHtml}
    <h3>Logros</h3>
    ${achievementsHtml()}
    <h3>Volumen por día</h3>
    <div class="chart-card">${svgBars(dias, 'volumen por día')}</div>
    <h3>Volumen por músculo</h3>
    ${muscleRows.length ? hBars(muscleRows, '--primary') : '<p><small>Registra pesos para ver el reparto por músculo.</small></p>'}
    <h3>Frecuencia muscular</h3>
    ${muscleFreqHtml()}
    <h3>Récords históricos 🏆</h3>
    <div class="stat-cards">
      <div class="scard k3"><b>${grec.maxRm ? fmtKg(grec.maxRm) : '—'}</b><span>1RM máx (${wUnit()})</span></div>
      <div class="scard k1"><b>${grec.maxReps || '—'}</b><span>reps máx</span></div>
      <div class="scard k2"><b>${grec.maxSessionVol ? fmtKg(grec.maxSessionVol) : '—'}</b><span>vol. sesión (${wUnit()})</span></div>
      <div class="scard k1"><b>${grec.bestWeek ? fmtKg(grec.bestWeek) : '—'}</b><span>mejor semana (${wUnit()})</span></div>
      <div class="scard k2"><b>${grec.bestMonth ? fmtKg(grec.bestMonth) : '—'}</b><span>mejor mes (${wUnit()})</span></div>
      <div class="scard k4"><b>${grec.maxStreak || 0}</b><span>racha máx (sem)</span></div>
    </div>
    ${grec.maxRmName ? `<p class="rec-note"><small>Tu mejor 1RM estimado es en <b>${grec.maxRmName}</b>.</small></p>` : ''}
    <h3>Tus récords (peso máximo)</h3>
    ${recRows.length ? hBars(recRows, '--legs') : '<p><small>Registra pesos y aquí verás tus máximos por ejercicio.</small></p>'}
    <h3>Tabla de datos</h3>
    ${rows.length ? `<div class="data-scroll"><table class="data-table">
        <tr><th>Día</th><th>Ejercicio</th><th>Récord</th><th>Últ.</th></tr>
        ${rows.map(r => `<tr><td>${r.dia.slice(0,3)}</td><td>${r.ejercicio}</td><td>${fmtKg(r.record)}</td><td>${r.peso ? fmtKg(r.peso) + '×' + r.reps : '—'}</td></tr>`).join('')}
      </table></div>` : '<p><small>Registra pesos para llenar la tabla.</small></p>'}
    <div class="export-row">
      <button class="pbtn" onclick="exportCSV()">📥 CSV</button>
      <button class="pbtn" onclick="exportPDF()">📄 PDF</button>
      <button class="pbtn" onclick="exportJSON()">💾 Respaldo</button>
      <button class="pbtn" onclick="importJSON()">♻️ Restaurar</button>
    </div>
    <button class="panel-close" onclick="closePanels()">Cerrar ✕</button>`;
}

function dismissBanner(){
  bannerHidden = true;
  const b = document.getElementById('banner');
  if(b) b.remove();
  Store.save();
}

/* ----------------------------------------------------------------
   7c. MODO ESTUDIO 2.0  (cambia el SCHEMA a la rutina exprés)
   ---------------------------------------------------------------- */
function toggleStudy(on){
  studyMode = (on === undefined) ? !studyMode : !!on;   // sin argumento = alterna
  render();        // re-pinta el día (los botones de modo reflejan el estado)
  Store.save();
}

