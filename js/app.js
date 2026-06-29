/* ============================================================
   Entreno V — Lógica de la aplicación
   ------------------------------------------------------------
   Estructura del archivo:
     1. Datos del plan (constantes y SCHEDULE)
     2. Cálculo de fechas / semana actual
     3. Capa de persistencia (Store -> localStorage)
     4. Estado en memoria (done, current) hidratado desde Store
     5. Generación de mapas musculares (SVG)
     6. Render (semana, días, vista del día)
     7. Manejadores de eventos (toggle, reset, select, paneles)
     8. PWA: icono, manifest y service worker
     9. Arranque
   ============================================================ */

/* ----------------------------------------------------------------
   1. DATOS DEL PLAN
   ---------------------------------------------------------------- */
const C = { pull:'--pull', push:'--push', legs:'--legs', upper:'--upper' };
const FRONT = ['frontdelt','sidedelt','chest','biceps','forearms','abs','quads'];
const BACK  = ['reardelt','upperback','lats','triceps','lowerback','glutes','hams','calves'];

const SCHEDULE = {
 1:{label:'Lunes',ab:'LU',type:'Tirón',sub:'Espalda · Bíceps · Deltoides posterior',key:'pull',
   muscles:['lats','upperback','reardelt','biceps','forearms','sidedelt'],
   express:[ {base:0,s:'3',r:'5–8',p:'Dorsal · pesado'},
             {base:1,s:'3',r:'6–8',p:'Espalda · pesado'},
             {base:6,s:'3',r:'12–20',p:'Hombro · prioridad'} ],
   ex:[
    {n:'Jalón al pecho (agarre ancho)',p:'Anchura · dorsal',s:'3',r:'8–12',d:'2 min',m:['lats','biceps'],q:'jalón al pecho agarre ancho técnica',
      tech:['Siéntate con los muslos fijos bajo el rodillo; agarra algo más ancho que los hombros.','Lleva los codos hacia abajo y atrás hasta que la barra toque la parte alta del pecho; aprieta la espalda.','Error a evitar: dar tirones con la espalda baja o encoger los hombros al subir.']},
    {n:'Remo en máquina con apoyo de pecho',p:'Espalda media/alta',s:'3',r:'8–12',d:'2 min',m:['upperback','lats','reardelt','biceps'],q:'remo en máquina apoyo de pecho',
      tech:['Pecho firme contra el respaldo, agarre neutro o prono.','Tira llevando los codos atrás y junta los omóplatos; pausa breve al final.','Error a evitar: despegar el pecho del apoyo o usar impulso.']},
    {n:'Remo unilateral con mancuerna',p:'Dorsal · simetría',s:'3',r:'8–12',d:'90 s',m:['lats','upperback','biceps'],q:'remo unilateral con mancuerna técnica',
      tech:['Apoya rodilla y mano del mismo lado en un banco; espalda plana, casi paralela al suelo.','Tira la mancuerna hacia la cadera llevando el codo atrás; siente el dorsal.','Error a evitar: girar el torso para levantar más peso.']},
    {n:'Curl inclinado con mancuernas',p:'Bíceps · estiramiento',s:'3',r:'8–12',d:'90 s',m:['biceps'],q:'curl inclinado con mancuernas',
      tech:['Banco a 45–60°; deja los brazos colgar rectos detrás del torso (esto estira el bíceps).','Sube flexionando solo el codo, sin mover el hombro hacia adelante.','Baja lento hasta extender del todo; controla el estiramiento.']},
    {n:'Curl martillo',p:'Braquial · grosor',s:'3',r:'10–15',d:'60 s',m:['biceps','forearms'],q:'curl martillo mancuernas',
      tech:['De pie, palmas enfrentadas, codos pegados al costado.','Sube sin balancear y aprieta arriba.','Baja controlado; no uses impulso de cadera.']},
    {n:'Pájaros en máquina (reverse pec deck)',p:'Deltoides posterior',s:'3',r:'12–20',d:'60 s',m:['reardelt','upperback'],q:'pájaros máquina deltoides posterior',
      tech:['Pecho apoyado, brazos al frente con los codos casi rectos.','Abre los brazos hacia atrás llevando los codos (no las manos); junta omóplatos.','Movimiento corto y controlado; no arquees ni uses impulso.']},
    {n:'Elevaciones laterales',p:'Hombro · 3ª dosis',s:'3',r:'12–20',d:'45 s',m:['sidedelt'],q:'elevaciones laterales con mancuernas técnica',
      tech:['De pie, leve inclinación al frente, codos algo flexionados.','Sube hasta la altura de los hombros guiando con el codo, como vertiendo agua; el meñique un poco más alto.','Baja lento; no encojas el trapecio ni des impulso.']}
   ]},
 2:{label:'Martes',ab:'MA',type:'Empuje',sub:'Pecho · Hombro · Tríceps',key:'push',
   muscles:['chest','frontdelt','sidedelt','triceps'],
   express:[ {base:0,s:'4',r:'5–8',p:'Pecho · pesado'},
             {base:4,s:'3',r:'6–10',p:'Hombro · press'},
             {base:2,s:'4',r:'12–20',p:'Hombro · prioridad'} ],
   ex:[
    {n:'Press inclinado (mancuernas o máquina)',p:'Pecho superior',s:'4',r:'8–12',d:'2 min',m:['chest','frontdelt','triceps'],q:'press inclinado con mancuernas técnica',
      tech:['Banco a ~30°; mancuernas a la altura del pecho, codos a ~45° del torso.','Empuja arriba y un poco adentro sin chocar las mancuernas; baja con control sintiendo el pecho.','Error a evitar: bajar los codos demasiado por debajo del banco si molesta el hombro.']},
    {n:'Press de pecho plano (máquina)',p:'Pecho',s:'3',r:'8–12',d:'2 min',m:['chest','frontdelt','triceps'],q:'press de pecho en máquina',
      tech:['Ajusta el asiento para que las manijas queden a la altura media del pecho.','Empuja sin bloquear de golpe; vuelve controlando hasta sentir estiramiento.','Error a evitar: despegar la espalda del respaldo.']},
    {n:'Elevaciones laterales en polea',p:'Hombro · PRIORIDAD',s:'5',r:'12–20',d:'60 s',m:['sidedelt'],q:'elevaciones laterales en polea técnica',
      tech:['De lado a la polea baja; cable cruzando por delante, codo ligeramente flexionado.','Sube hasta la altura del hombro guiando con el codo; tensión constante en todo el recorrido.','Baja lento; no des impulso ni subas el trapecio.']},
    {n:'Aperturas en máquina (pec deck)',p:'Pecho · estiramiento',s:'3',r:'12–15',d:'60 s',m:['chest'],q:'aperturas en máquina pec deck',
      tech:['Espalda apoyada, codos a la altura de los hombros.','Junta los brazos al frente apretando el pecho; pausa breve.','Abre lento controlando; no fuerces el estiramiento.']},
    {n:'Press de hombro (máquina/mancuerna)',p:'Deltoides · tríceps',s:'3',r:'8–12',d:'90 s',m:['frontdelt','sidedelt','triceps'],q:'press de hombro con mancuernas sentado',
      tech:['Espalda apoyada, manijas a la altura de los hombros.','Empuja arriba sin bloquear bruscamente; baja hasta la altura de las orejas.','Error a evitar: arquear la espalda baja para empujar.']},
    {n:'Extensión de tríceps en polea (pushdown)',p:'Tríceps',s:'3',r:'10–15',d:'60 s',m:['triceps'],q:'extensión de tríceps en polea pushdown',
      tech:['Codos pegados al costado, agarre a la barra o cuerda.','Extiende hacia abajo hasta estirar el tríceps; aprieta abajo.','Solo se mueve el antebrazo; los codos no se van hacia adelante.']},
    {n:'Extensión de tríceps sobre la cabeza',p:'Tríceps · cabeza larga',s:'3',r:'12–15',d:'60 s',m:['triceps'],q:'extensión de tríceps sobre la cabeza polea',
      tech:['Lleva el agarre detrás de la cabeza con los codos apuntando arriba (estira la cabeza larga).','Extiende hasta arriba sin abrir los codos; baja controlando el estiramiento.','Mantén los codos quietos; no los abras hacia los lados.']}
   ]},
 3:{label:'Miércoles',ab:'MI',type:'Pierna',sub:'Énfasis cuádriceps',key:'legs',
   muscles:['quads','hams','glutes','calves','abs'],
   express:[ {base:0,s:'4',r:'6–10',p:'Cuádriceps · pesado'},
             {base:1,s:'3',r:'6–10',p:'Cuádriceps'},
             {base:3,s:'3',r:'8–12',p:'Femoral'} ],
   ex:[
    {n:'Prensa de pierna',p:'Cuádriceps · glúteo',s:'4',r:'8–12',d:'2–3 min',m:['quads','glutes','hams'],q:'prensa de pierna técnica',
      tech:['Pies a la anchura de hombros en el centro de la plataforma; espalda y glúteo pegados al asiento.','Baja controlando hasta ~90° de rodilla; empuja con el medio del pie sin bloquear de golpe.','Error a evitar: despegar la cadera del asiento o meter las rodillas hacia adentro.']},
    {n:'Sentadilla hack en máquina',p:'Cuádriceps',s:'3',r:'8–12',d:'2 min',m:['quads','glutes'],q:'sentadilla hack máquina técnica',
      tech:['Espalda apoyada, pies a media plataforma, anchura de hombros.','Baja hasta que el muslo quede paralelo; sube empujando con todo el pie.','Rodillas siguen la línea de los pies; no rebotes abajo. Si no hay máquina, repite prensa con otra postura de pies.']},
    {n:'Extensión de cuádriceps',p:'Cuádriceps · aislado',s:'3',r:'12–20',d:'60 s',m:['quads'],q:'extensión de cuádriceps máquina',
      tech:['Ajusta el respaldo para que el eje quede a la altura de la rodilla.','Extiende hasta casi bloquear apretando el cuádriceps; pausa arriba.','Baja lento; no des tirones.']},
    {n:'Curl femoral sentado',p:'Isquios · estiramiento',s:'3',r:'10–15',d:'90 s',m:['hams'],q:'curl femoral sentado máquina',
      tech:['Respaldo ajustado, almohadilla sobre los gemelos, muslos fijos.','Lleva los talones hacia el glúteo apretando el femoral; pausa breve.','Vuelve controlando; no levantes la cadera del asiento.']},
    {n:'Elevación de gemelos',p:'Gemelos',s:'4',r:'10–15',d:'60 s',m:['calves'],q:'elevación de gemelos de pie',
      tech:['Punta de los pies en el escalón, talones colgando.','Baja el talón hasta sentir estiramiento y sube lo más alto posible; pausa arriba y abajo.','No rebotes; rango completo.']},
    {n:'Crunch en polea (abdomen)',p:'Abdomen',s:'3',r:'10–15',d:'60 s',m:['abs'],q:'crunch en polea abdominales',
      tech:['De rodillas frente a la polea alta, con la cuerda junto a la cara.','Enrolla la columna llevando los codos hacia los muslos con los abdominales, no con los brazos.','La cadera queda fija; el movimiento es de la espalda redondeándose.']},
    {n:'Zancadas con mancuernas',p:'Unilateral · simetría',s:'2',r:'10–12',d:'90 s',m:['quads','glutes','hams'],q:'zancadas con mancuernas técnica',opt:true,
      tech:['Da un paso al frente y baja la rodilla de atrás hacia el suelo, torso erguido.','Empuja con el talón de adelante para subir; alterna piernas.','Opcional: si te incomoda el equilibrio, omítela.']}
   ]},
 4:{label:'Jueves',ab:'JU',rest:true},
 5:{label:'Viernes',ab:'VI',type:'Torso',sub:'Espalda · Hombro · Brazos',key:'upper',
   muscles:['lats','upperback','sidedelt','biceps','chest','triceps'],
   express:[ {base:0,s:'4',r:'5–8',p:'Espalda · pesado'},
             {base:1,s:'3',r:'6–10',p:'Espalda alta'},
             {base:2,s:'4',r:'12–20',p:'Hombro · prioridad'} ],
   ex:[
    {n:'Dominadas asistidas o jalón (neutro)',p:'Anchura · 2ª variante',s:'4',r:'8–12',d:'2 min',m:['lats','biceps'],q:'dominadas asistidas máquina técnica',
      tech:['Agarre neutro (palmas enfrentadas); pecho arriba.','Tira llevando los codos abajo y atrás hasta el mentón sobre la barra (o barra al pecho); aprieta el dorsal.','Baja con control y estira del todo arriba.']},
    {n:'Remo agarre ancho (polea/máquina)',p:'Espalda alta · post.',s:'3',r:'10–15',d:'90 s',m:['upperback','reardelt','lats','biceps'],q:'remo en polea agarre ancho',
      tech:['Agarre ancho y prono; codos abiertos apuntando a los lados.','Tira hacia la parte alta del abdomen llevando los codos atrás; aprieta espalda alta y deltoides posterior.','No encorves; saca el pecho. (Distinto a los remos del lunes.)']},
    {n:'Elevaciones laterales (mancuerna)',p:'Hombro · PRIORIDAD',s:'5',r:'12–20',d:'60 s',m:['sidedelt'],q:'elevaciones laterales con mancuernas técnica',
      tech:['De pie, leve inclinación al frente, codos algo flexionados.','Sube hasta la altura de los hombros guiando con el codo; el meñique un poco más alto.','Baja lento; no encojas el trapecio.']},
    {n:'Press inclinado (máquina/mancuerna)',p:'Pecho · mantener',s:'3',r:'8–12',d:'2 min',m:['chest','frontdelt','triceps'],q:'press inclinado en máquina',
      tech:['Banco/asiento a ~30°, manijas a la altura del pecho alto.','Empuja con control sin bloquear de golpe; baja sintiendo el pecho.','Volumen moderado: aquí solo mantienes el pecho.']},
    {n:'Curl unilateral en polea',p:'Bíceps · simetría',s:'3',r:'10–15',d:'60 s',m:['biceps'],q:'curl unilateral en polea',
      tech:['De lado a la polea baja, un brazo a la vez, codo pegado al costado.','Flexiona apretando el bíceps; controla la bajada con tensión constante.','No gires el cuerpo para ayudar.']},
    {n:'Curl predicador en máquina',p:'Bíceps · pico',s:'3',r:'10–15',d:'60 s',m:['biceps'],q:'curl predicador máquina',
      tech:['Brazos apoyados en el cojín, axilas sobre el borde.','Sube apretando el bíceps; baja hasta casi extender sin soltar la tensión.','No despegues los codos del apoyo.']},
    {n:'Extensión de tríceps en polea',p:'Tríceps · mantener',s:'2',r:'10–15',d:'60 s',m:['triceps'],q:'extensión de tríceps en polea',opt:true,
      tech:['Codos pegados al costado.','Extiende hasta abajo y aprieta el tríceps.','Solo se mueve el antebrazo.']}
   ]},
 6:{label:'Sábado',ab:'SA',type:'Pierna',sub:'Énfasis femoral · glúteo',key:'legs',
   muscles:['hams','glutes','quads','calves','abs'],
   express:[ {base:0,s:'4',r:'6–10',p:'Femoral · pesado'},
             {base:1,s:'3',r:'8–12',p:'Glúteo · pesado'},
             {base:2,s:'3',r:'8–12',p:'Femoral'} ],
   ex:[
    {n:'Peso muerto rumano (mancuernas/barra)',p:'Isquios · glúteo',s:'3–4',r:'8–12',d:'2–3 min',m:['hams','glutes','lowerback'],q:'peso muerto rumano con mancuernas técnica',
      tech:['De pie, peso al frente de los muslos, rodillas algo flexionadas.','Lleva la cadera hacia atrás bajando el peso pegado a las piernas con la espalda recta hasta sentir el femoral.','Sube empujando la cadera al frente. Error a evitar: redondear la espalda baja. Si molesta la lumbar, cámbialo por curl femoral tumbado + extensión de cadera.']},
    {n:'Prensa pies altos o hip thrust',p:'Isquios · glúteo',s:'3',r:'10–15',d:'2 min',m:['glutes','hams'],q:'hip thrust máquina técnica',
      tech:['Prensa: pies altos en la plataforma para cargar más cadena posterior. Hip thrust: espalda alta en el banco, almohadilla en la cadera.','Empuja con los talones y aprieta el glúteo arriba; pausa breve.','No hiperextiendas la espalda baja arriba.']},
    {n:'Curl femoral tumbado',p:'Isquios · 2ª variante',s:'3',r:'10–15',d:'90 s',m:['hams'],q:'curl femoral tumbado máquina',
      tech:['Boca abajo, almohadilla sobre los talones, cadera pegada al banco.','Lleva los talones al glúteo apretando; pausa breve.','No levantes la cadera ni des tirones.']},
    {n:'Extensión de cuádriceps',p:'Cuádriceps · mantener',s:'2',r:'12–20',d:'60 s',m:['quads'],q:'extensión de cuádriceps máquina',opt:true,
      tech:['Eje a la altura de la rodilla.','Extiende apretando el cuádriceps; pausa arriba.','Baja lento.']},
    {n:'Elevación de gemelos sentado',p:'Gemelos · sóleo',s:'4',r:'12–20',d:'60 s',m:['calves'],q:'elevación de gemelos sentado máquina',
      tech:['Sentado, almohadilla sobre los muslos, punta de los pies en el apoyo.','Baja el talón (estiramiento) y sube apretando; la rodilla flexionada enfatiza el sóleo.','Rango completo, sin rebotes.']},
    {n:'Elevación de rodillas colgado',p:'Abdomen inferior',s:'3',r:'10–15',d:'60 s',m:['abs'],q:'elevación de rodillas colgado abdomen',
      tech:['Colgado o en silla romana, hombros activos.','Lleva las rodillas hacia el pecho enrollando un poco la pelvis; controla la bajada.','No te balancees; el abdomen hace el trabajo.']}
   ]},
 0:{label:'Domingo',ab:'DO',rest:true}
};

const ORDER = [1,2,3,4,5,6,0];
const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

/* ----------------------------------------------------------------
   2. FECHAS / SEMANA ACTUAL
   ---------------------------------------------------------------- */
const now = new Date();
const todayDow = now.getDay();
const monday = new Date(now);
monday.setDate(now.getDate() + (todayDow === 0 ? -6 : 1 - todayDow));

function dateForDow(dow){
  const idx = (dow === 0 ? 6 : dow - 1);
  const d = new Date(monday);
  d.setDate(monday.getDate() + idx);
  return d;
}

/** Identificador estable de la semana (fecha del lunes en formato YYYY-MM-DD). */
function weekId(){
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2,'0');
  const d = String(monday.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

/* ----------------------------------------------------------------
   3. CAPA DE PERSISTENCIA  (Store -> localStorage)
   ------------------------------------------------------------
   Guardamos un único objeto JSON bajo una sola clave:
     { week, current, done, bannerHidden }
   - "week" ata los checks a la semana en curso. Si al abrir la app
     detectamos una semana distinta, empezamos en limpio (los checks
     de la semana pasada no se arrastran a la nueva rutina).
   - Todo va envuelto en try/catch para que la app no se rompa si el
     navegador bloquea localStorage (modo privado, ciertos file://).
   ---------------------------------------------------------------- */
const Store = {
  KEY: 'entrenoV.state.v1',

  /** Lee el estado persistido y lo concilia con la semana actual. */
  load(){
    const fresh = { week: weekId(), current: todayDow, done: {}, loads: {}, notes: {},
                    bests: {}, studyMode: false, bannerHidden: false, history: {} };
    try{
      const raw = localStorage.getItem(this.KEY);
      if(!raw) return fresh;
      const saved = JSON.parse(raw);
      const history = saved.history || {};
      // Semana nueva -> archivamos un resumen de la anterior y limpiamos checks/cargas.
      if(saved.week !== fresh.week){
        if(saved.week && (Object.keys(saved.done||{}).length || Object.keys(saved.loads||{}).length)){
          history[saved.week] = {
            volume: weekVolume(saved.loads || {}),
            completed: Object.values(saved.done || {}).filter(Boolean).length
          };
        }
        // Conservamos preferencias, récords (no caducan) y el historial.
        return { ...fresh, bests: saved.bests || {},
                 studyMode: !!saved.studyMode, bannerHidden: !!saved.bannerHidden,
                 history: trimHistory(history) };
      }
      return {
        week: fresh.week,
        current: (saved.current in SCHEDULE) ? saved.current : todayDow,
        done: saved.done || {},
        loads: saved.loads || {},
        notes: saved.notes || {},
        bests: saved.bests || {},
        studyMode: !!saved.studyMode,
        bannerHidden: !!saved.bannerHidden,
        history: trimHistory(history)
      };
    }catch(e){
      return fresh;
    }
  },

  /** Persiste el estado en memoria. Se llama tras cada cambio del usuario. */
  save(){
    try{
      localStorage.setItem(this.KEY, JSON.stringify({
        week: weekId(),
        current,
        studyMode,
        bannerHidden,
        done,
        loads,
        notes,
        bests,
        history
      }));
    }catch(e){ /* almacenamiento no disponible: la app sigue en memoria */ }
  }
};

/* ----------------------------------------------------------------
   4. ESTADO EN MEMORIA (hidratado desde el Store)
   ---------------------------------------------------------------- */
const _initial = Store.load();
const done    = _initial.done;       // { "<key>": true }
const loads   = _initial.loads;      // { "<key>": { w:Number, reps:Number } }
const notes   = _initial.notes;      // { "<key>": "texto de la nota" }
const bests   = _initial.bests;      // { "<dia>-<baseIdx>": { w:Number } }  récord histórico por ejercicio
const history = _initial.history;    // { "<weekId>": { volume:Number, completed:Number } }
let current      = _initial.current; // día seleccionado (0–6)
let studyMode    = _initial.studyMode;
let bannerHidden = _initial.bannerHidden;
// "<key>" = `${studyMode?'x':''}${dia}-${indice}` -> el modo exprés guarda
// sus datos en un espacio propio ('x'), sin colisionar con la rutina completa.

/* ----------------------------------------------------------------
   4b. UTILIDADES DE CARGAS / SEGUIMIENTO
   ---------------------------------------------------------------- */
const WEIGHT_STEP = 2.5;  // incremento del stepper de peso (kg)

/** Primer número de un texto: "3" -> 3, "3–4" -> 3, "8–12" -> 8. */
function parseFirstInt(s){ const m = String(s).match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; }

/** Escapa texto para inyectarlo con seguridad dentro de un <textarea>. */
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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
  const ld = loads[exKey(i)];
  if(!ld || !ld.w) return 0;
  const sets = parseFirstInt(e.s) || 1;
  const reps = ld.reps || parseFirstInt(e.r) || 0;
  return sets * reps * ld.w;
}

/** Volumen total del día actual (solo lo visible). */
function dayVolume(d){
  const day = SCHEDULE[d];
  if(day.rest) return 0;
  return visibleEx(day).reduce((sum, e, i) => sum + exVolume(d, i, e), 0);
}

/** Volumen de toda una semana a partir de su mapa de cargas guardado. */
function weekVolume(loadsMap){
  let total = 0;
  for(const key in loadsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);    // soporta claves normales y exprés ('x...')
    if(!m) continue;
    const e = resolveExercise(+m[2], +m[3], m[1] === 'x');
    if(!e) continue;
    const ld = loadsMap[key];
    if(!ld || !ld.w) continue;
    const sets = parseFirstInt(e.s) || 1;
    const reps = ld.reps || parseFirstInt(e.r) || 0;
    total += sets * reps * ld.w;
  }
  return Math.round(total);
}

/** Mantiene el historial acotado a las últimas 12 semanas. */
function trimHistory(h){
  const keys = Object.keys(h).sort();
  while(keys.length > 12){ delete h[keys.shift()]; }
  return h;
}

/** Formatea kg con separador de miles en español. */
function fmtKg(n){ return Math.round(n).toLocaleString('es-ES'); }

/** Retrasa la ejecución: agrupa ráfagas de cambios en una sola escritura. */
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }
const debouncedSave = debounce(() => Store.save(), 400);

/* ----------------------------------------------------------------
   4c. RÉCORDS, DESCANSO Y GRÁFICAS
   ---------------------------------------------------------------- */
/** Clave del récord: identidad del ejercicio (compartida entre completo y exprés). */
function bestKeyFor(i, e){ return `${current}-${studyMode && e && 'base' in e ? e.base : i}`; }

/** Texto de la pista de récord para un ejercicio. */
function bestCueContent(best, cur){
  if(!best) return '⚡ Registra el peso para marcar tu primer récord';
  if(cur && cur >= best) return `🏆 ¡Récord nuevo! <b>${fmtKg(cur)} kg</b>`;
  return `Récord: <b>${fmtKg(best)} kg</b> · te faltan ${fmtKg(best - cur)} kg`;
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
  for(const key in loads){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m || +m[2] !== d) continue;
    const e = resolveExercise(d, +m[3], m[1] === 'x');
    const ld = loads[key];
    if(!e || !ld || !ld.w) continue;
    total += (parseFirstInt(e.s) || 1) * (ld.reps || parseFirstInt(e.r) || 0) * ld.w;
  }
  return Math.round(total);
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
  for(const key in loads){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m) continue;
    const e = resolveExercise(+m[2], +m[3], m[1] === 'x');
    const ld = loads[key];
    if(!e || !ld || !ld.w || !e.m || !e.m.length) continue;
    const v = (parseFirstInt(e.s) || 1) * (ld.reps || parseFirstInt(e.r) || 0) * ld.w;
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
  const W = 300, H = 120, pad = 24, top = 14;
  const max = Math.max(1, ...points.map(p => p.value));
  const n = points.length;
  const xAt = i => pad + (n === 1 ? (W - 2*pad)/2 : i * (W - 2*pad) / (n - 1));
  const yAt = v => H - pad - (v / max) * (H - pad - top);
  const pts = points.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`);
  const area = `M ${xAt(0).toFixed(1)},${H-pad} L ${pts.join(' L ')} L ${xAt(n-1).toFixed(1)},${H-pad} Z`;
  const dots = points.map((p, i) =>
    `<circle class="area-dot" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.value).toFixed(1)}" r="3"/>
     <text class="clbl" x="${xAt(i).toFixed(1)}" y="${H-7}" text-anchor="middle">${p.label}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tendencia semanal">
    <path class="area-fill" d="${area}"/><path class="area-line" d="M ${pts.join(' L ')}"/>${dots}</svg>`;
}

/* ----------------------------------------------------------------
   5. MAPAS MUSCULARES (SVG)
   ---------------------------------------------------------------- */
function hasAny(m, set){ return m.some(x => set.includes(x)); }
function clsF(t, m){ return m.includes(t) ? 'muscle on' : 'muscle'; }

function frontSVG(m){const f=t=>clsF(t,m);return `<svg viewBox="0 0 100 230" aria-hidden="true">
 <circle class="ghost" cx="50" cy="20" r="13"/><rect class="ghost" x="32" y="34" width="36" height="72" rx="11"/>
 <rect class="ghost" x="9" y="38" width="13" height="64" rx="6"/><rect class="ghost" x="78" y="38" width="13" height="64" rx="6"/>
 <rect class="ghost" x="34" y="104" width="14" height="112" rx="7"/><rect class="ghost" x="52" y="104" width="14" height="112" rx="7"/>
 <ellipse class="${f('frontdelt')}" cx="30" cy="44" rx="10" ry="8"/><ellipse class="${f('frontdelt')}" cx="70" cy="44" rx="10" ry="8"/>
 <ellipse class="${f('sidedelt')}" cx="18" cy="46" rx="5.5" ry="8"/><ellipse class="${f('sidedelt')}" cx="82" cy="46" rx="5.5" ry="8"/>
 <ellipse class="${f('chest')}" cx="40" cy="60" rx="11" ry="9"/><ellipse class="${f('chest')}" cx="60" cy="60" rx="11" ry="9"/>
 <ellipse class="${f('biceps')}" cx="16" cy="66" rx="6" ry="13"/><ellipse class="${f('biceps')}" cx="84" cy="66" rx="6" ry="13"/>
 <ellipse class="${f('forearms')}" cx="14" cy="92" rx="5" ry="14"/><ellipse class="${f('forearms')}" cx="86" cy="92" rx="5" ry="14"/>
 <rect class="${f('abs')}" x="41" y="74" width="18" height="30" rx="5"/>
 <ellipse class="${f('quads')}" cx="41" cy="142" rx="9" ry="28"/><ellipse class="${f('quads')}" cx="59" cy="142" rx="9" ry="28"/></svg>`;}

function backSVG(m){const f=t=>clsF(t,m);return `<svg viewBox="0 0 100 230" aria-hidden="true">
 <circle class="ghost" cx="50" cy="20" r="13"/><rect class="ghost" x="32" y="34" width="36" height="72" rx="11"/>
 <rect class="ghost" x="9" y="38" width="13" height="64" rx="6"/><rect class="ghost" x="78" y="38" width="13" height="64" rx="6"/>
 <rect class="ghost" x="34" y="104" width="14" height="112" rx="7"/><rect class="ghost" x="52" y="104" width="14" height="112" rx="7"/>
 <ellipse class="${f('reardelt')}" cx="30" cy="44" rx="10" ry="8"/><ellipse class="${f('reardelt')}" cx="70" cy="44" rx="10" ry="8"/>
 <rect class="${f('upperback')}" x="38" y="40" width="24" height="22" rx="6"/>
 <ellipse class="${f('lats')}" cx="36" cy="78" rx="9" ry="16"/><ellipse class="${f('lats')}" cx="64" cy="78" rx="9" ry="16"/>
 <ellipse class="${f('triceps')}" cx="16" cy="66" rx="6" ry="13"/><ellipse class="${f('triceps')}" cx="84" cy="66" rx="6" ry="13"/>
 <rect class="${f('lowerback')}" x="43" y="98" width="14" height="14" rx="4"/>
 <ellipse class="${f('glutes')}" cx="41" cy="122" rx="10" ry="11"/><ellipse class="${f('glutes')}" cx="59" cy="122" rx="10" ry="11"/>
 <ellipse class="${f('hams')}" cx="41" cy="152" rx="9" ry="24"/><ellipse class="${f('hams')}" cx="59" cy="152" rx="9" ry="24"/>
 <ellipse class="${f('calves')}" cx="41" cy="196" rx="7" ry="17"/><ellipse class="${f('calves')}" cx="59" cy="196" rx="7" ry="17"/></svg>`;}

function heroMap(m){return `<div class="map"><div class="fig">${frontSVG(m)}<small>Frente</small></div><div class="fig">${backSVG(m)}<small>Espalda</small></div></div>`;}
function miniMap(m){let h='';if(hasAny(m,FRONT))h+=frontSVG(m);if(hasAny(m,BACK))h+=backSVG(m);return `<div class="mini">${h}</div>`;}

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
    const accentVar = day.rest ? '--rest' : C[day.key];
    const dt = dateForDow(d).getDate();
    return `<button class="day-btn ${isActive?'active':''} ${isToday?'today':''}" style="${isActive?`--accent:var(${accentVar})`:''}" onclick="select(${d})" aria-label="${day.label} ${dt}${isToday?' (hoy)':''}">
      <span class="ab">${day.ab}</span><span class="date">${dt}</span><span class="dot"></span></button>`;
  }).join('');
  const t = nav.querySelector('.day-btn.today'); if(t) t.scrollIntoView({inline:'center',block:'nearest'});
}

function render(){
  const day = SCHEDULE[current], view = document.getElementById('view');
  const accentVar = day.rest ? '--rest' : C[day.key];
  view.style.setProperty('--accent', `var(${accentVar})`);
  if(day.rest){
    view.innerHTML = `<div class="rest-card" style="--accent:var(--rest)">
      <div class="big">Día de descanso</div>
      <p>El músculo no crece en el gimnasio, crece mientras te recuperas. Hoy toca cargar baterías: duerme bien, mantén la proteína alta e hidrátate.</p>
      <button class="rbtn" onclick="openPanel('nutri')">Ver alimentación y sueño</button>
    </div>`; return;
  }
  const exList = visibleEx(day);
  const total = exList.length;
  const list = exList.map((e,i)=>{
    const isDone = !!done[exKey(i)];
    const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.q)}`;
    const steps = e.tech.map(t=>`<li>${t}</li>`).join('');
    return `<div class="ex ${e.opt?'opt':''} ${isDone?'done':''}" id="ex-${i}">
      <div class="ex-top">
        <label class="check" aria-label="Marcar ${e.n}">
          <input type="checkbox" class="check-box" data-k="done" data-i="${i}" ${isDone?'checked':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#0B0B0F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 6.5"/></svg>
        </label>
        <div class="ex-main">
          <div class="ex-head">
            <div><div class="name">${e.n}${e.opt?'<span class="tag-opt">OPCIONAL</span>':''}</div><div class="purpose">${e.p}</div></div>
            ${miniMap(e.m)}
          </div>
          <div class="stats">
            <span class="stat"><span>Series</span>${e.s}</span>
            <span class="stat"><span>Reps</span>${e.r}</span>
            <button class="stat stat-rest" type="button" data-rest="${parseRestSeconds(e.d)}" aria-label="Iniciar descanso de ${e.d}">⏱ <span>Descanso</span>${e.d}</button>
          </div>
          ${logRow(i)}
          ${bestRow(i, e)}
          ${noteRow(i)}
          <div class="tech"><div class="tech-label">📋 Cómo hacerlo</div><ol>${steps}</ol></div>
          <a class="video" href="${yt}" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Ver video
          </a>
        </div>
      </div>
    </div>`;
  }).join('');
  view.innerHTML = `<div class="hero"><div class="hero-text">
      <div class="chev"><span></span><span></span><span></span></div>
      <div class="type">${day.type}</div>
      <div class="sub">${day.label} ${dateForDow(current).getDate()} ${MES[dateForDow(current).getMonth()]} · ${day.sub}</div>
    </div>${heroMap(day.muscles)}</div>
    <div class="focus">${day.sub.split(' · ').map(x=>`<span class="chip">${x}</span>`).join('')}</div>
    <div class="progress"><div class="row"><span>Progreso de hoy &nbsp; <b id="pcount">0</b> / ${total}</span>
      <button class="reset" onclick="resetDay()">Reiniciar</button></div>
      <div class="bar"><i id="pbar"></i></div></div>
    <div class="list">${list}</div>
    <div class="volume" id="volume"></div>`;
  view.querySelectorAll('.note-input').forEach(autoGrow);  // ajusta alto de las notas guardadas
  updateProgress();
  updateVolume();
}

/** HTML del registro de carga (peso + reps). Sin handlers inline: solo data-*. */
function logRow(i){
  const ld = loads[exKey(i)] || {};
  const wv = ld.w || '', rv = ld.reps || '';
  return `<div class="log">
    <div class="log-field">
      <button class="step" type="button" data-step data-i="${i}" data-field="w" data-delta="-${WEIGHT_STEP}" aria-label="Bajar peso">−</button>
      <span class="log-box"><input id="w-${i}" class="log-input" type="number" inputmode="decimal" min="0" step="${WEIGHT_STEP}" value="${wv}" placeholder="0" data-k="load" data-i="${i}" data-field="w" aria-label="Peso en kg"><span class="log-unit">kg</span></span>
      <button class="step" type="button" data-step data-i="${i}" data-field="w" data-delta="${WEIGHT_STEP}" aria-label="Subir peso">+</button>
    </div>
    <div class="log-field">
      <button class="step" type="button" data-step data-i="${i}" data-field="reps" data-delta="-1" aria-label="Bajar reps">−</button>
      <span class="log-box"><input id="reps-${i}" class="log-input" type="number" inputmode="numeric" min="0" step="1" value="${rv}" placeholder="reps" data-k="load" data-i="${i}" data-field="reps" aria-label="Repeticiones"><span class="log-unit">rps</span></span>
      <button class="step" type="button" data-step data-i="${i}" data-field="reps" data-delta="1" aria-label="Subir reps">+</button>
    </div>
  </div>`;
}

/** Pista de récord histórico del ejercicio (progreso de sobrecarga). */
function bestRow(i, e){
  const best = (bests[bestKeyFor(i, e)] || {}).w || 0;
  const cur  = (loads[exKey(i)] || {}).w || 0;
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
  const cur  = (loads[exKey(i)] || {}).w || 0;
  el.classList.toggle('pr', !!(cur && cur >= best));
  el.innerHTML = bestCueContent(best, cur);
}

/** HTML de la nota rápida del ejercicio (textarea autoguardado). */
function noteRow(i){
  const val = notes[exKey(i)] || '';
  return `<div class="note">
    <textarea class="note-input" rows="1" data-k="note" data-i="${i}"
      placeholder="📝 Nota rápida: cómo te sentiste, subir peso la próxima…"
      aria-label="Nota del ejercicio">${escapeHtml(val)}</textarea>
  </div>`;
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

  if(k === 'done'){
    done[key] = el.checked;
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
  } else if(k === 'load'){
    let num = parseFloat(el.value);
    if(isNaN(num) || num < 0) num = 0;
    (loads[key] || (loads[key] = { w:0, reps:0 }))[el.dataset.field] = num;
    if(el.dataset.field === 'w'){
      const ex = visibleEx(SCHEDULE[current])[i];
      const bk = bestKeyFor(i, ex);
      if(num > ((bests[bk] || {}).w || 0)) bests[bk] = { w: num };  // récord nuevo
      updateBestCue(i);
    }
    updateVolume();
  } else if(k === 'note'){
    notes[key] = el.value;
    autoGrow(el);
  }
  debouncedSave();   // Silent-Save: una sola escritura tras la ráfaga de cambios
}

/** Clics dentro de #view: steppers +/− y cronómetro de descanso. */
function onViewClick(e){
  const rest = e.target.closest('[data-rest]');
  if(rest){ startRest(+rest.dataset.rest); return; }

  const btn = e.target.closest('[data-step]');
  if(!btn) return;
  const i = +btn.dataset.i, field = btn.dataset.field, delta = parseFloat(btn.dataset.delta);
  const input = document.getElementById((field === 'w' ? 'w-' : 'reps-') + i);
  let num = parseFloat(input.value);
  if(isNaN(num)) num = 0;
  num = Math.max(0, +(num + delta).toFixed(2));
  input.value = (field === 'w') ? num : Math.round(num);
  input.dispatchEvent(new Event('input', { bubbles:true }));  // -> pasa por onFieldChange
}

/* ----------------------------------------------------------------
   7e. CRONÓMETRO DE DESCANSO  (toca "Descanso" para iniciarlo)
   ---------------------------------------------------------------- */
let restTimerId = null, restLeft = 0;
function startRest(seconds){
  const bar = document.getElementById('restTimer');
  if(!bar) return;
  restLeft = seconds;
  bar.hidden = false;
  paintRest();
  clearInterval(restTimerId);
  restTimerId = setInterval(()=>{
    restLeft--;
    paintRest();
    if(restLeft <= 0){
      clearInterval(restTimerId);
      if(navigator.vibrate) navigator.vibrate([200,100,200]);   // aviso háptico en móvil
      bar.classList.add('done');
      setTimeout(stopRest, 1500);
    }
  }, 1000);
}
function paintRest(){
  const mm = Math.floor(Math.max(0,restLeft) / 60), ss = Math.max(0,restLeft) % 60;
  const t = document.getElementById('restTime');
  if(t) t.textContent = `${mm}:${String(ss).padStart(2,'0')}`;
}
function stopRest(){
  clearInterval(restTimerId);
  const bar = document.getElementById('restTimer');
  if(bar){ bar.hidden = true; bar.classList.remove('done'); }
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

/** Pinta "Total volumen levantado: X kg" (+ comparación con la semana previa). */
function updateVolume(){
  const el = document.getElementById('volume');
  if(!el) return;
  const v = dayVolume(current);
  let extra = '';
  const past = Object.keys(history).sort();
  if(past.length){
    const prev = history[past[past.length - 1]].volume || 0;
    const weekNow = weekVolume(loads);
    if(prev > 0){
      const diff = weekNow - prev;
      const sign = diff >= 0 ? '+' : '−';
      extra = ` · semana ${fmtKg(weekNow)} kg (${sign}${fmtKg(Math.abs(diff))} vs. anterior)`;
    }
  }
  el.innerHTML = v > 0
    ? `🏋️ Total volumen levantado: <b>${fmtKg(v)} kg</b>${extra}`
    : `🏋️ Registra peso y reps para ver tu volumen total`;
}

function select(d){
  current = d;
  closePanels();
  renderDays();
  render();
  window.scrollTo({top:0,behavior:'smooth'});
  Store.save();
}

function openPanel(id){
  closePanels();
  if(id === 'progress') renderProgress();   // genera las gráficas al abrir
  if(id === 'calendar') renderCalendar();   // genera los enlaces de recordatorio
  const p = document.getElementById(id);
  p.hidden = false;
  p.scrollIntoView({behavior:'smooth',block:'start'});
}

function closePanels(){
  ['guide','nutri','progress','calendar'].forEach(id=>{
    const p = document.getElementById(id);
    if(p) p.hidden = true;
  });
}

/* ----------------------------------------------------------------
   7g. PANEL DE PROGRESO  (gráficas de volumen y récords)
   ---------------------------------------------------------------- */
function renderProgress(){
  const host = document.getElementById('progress');
  if(!host) return;

  // --- Resumen ---
  const weekNow = weekVolume(loads);
  const sessions = ORDER.filter(d => !SCHEDULE[d].rest)
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

  // --- Tendencia (semanas archivadas + ahora) ---
  const trend = Object.keys(history).sort()
    .map(k => ({ label: k.slice(5).replace('-', '/'), value: history[k].volume || 0 }));
  trend.push({ label: 'ahora', value: weekNow });

  // --- Récords (barras horizontales) ---
  const recRows = Object.keys(bests).map(k => {
    const [d, bi] = k.split('-').map(Number);
    const ex = SCHEDULE[d] && SCHEDULE[d].ex && SCHEDULE[d].ex[bi];
    return ex ? { label: ex.n, value: bests[k].w, valText: fmtKg(bests[k].w) + ' kg' } : null;
  }).filter(Boolean).sort((a, b) => b.value - a.value).slice(0, 8);

  host.innerHTML = `
    <h3>Resumen de la semana</h3>
    <div class="stat-cards">
      <div class="scard k1"><b>${fmtKg(weekNow)}</b><span>kg volumen</span></div>
      <div class="scard k2"><b>${sessions}</b><span>sesiones</span></div>
      <div class="scard k3"><b>${recordCount}</b><span>récords</span></div>
    </div>
    <h3>Volumen por día</h3>
    ${svgBars(dias, 'volumen por día')}
    <h3>Volumen por músculo</h3>
    ${muscleRows.length ? hBars(muscleRows, '--pull') : '<p><small>Registra pesos para ver el reparto por músculo.</small></p>'}
    <h3>Tendencia semanal</h3>
    ${trend.length > 1 ? svgArea(trend) : '<p><small>Aún no hay semanas anteriores: esta gráfica crece cada lunes. 📈</small></p>'}
    <h3>Tus récords (peso máximo)</h3>
    ${recRows.length ? hBars(recRows, '--legs') : '<p><small>Registra pesos y aquí verás tus máximos por ejercicio.</small></p>'}
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
  studyMode = !!on;
  render();        // re-pinta el día con el schema exprés o el completo
  Store.save();
}

/* ----------------------------------------------------------------
   7d. RECORDATORIOS DE CALENDARIO
   ------------------------------------------------------------
   Dos vías, ambas sin servidor:
   - Google Calendar: enlace "Añadir" con evento semanal pre-cargado.
   - Apple/otros: descarga de un .ics estándar (se importa al calendario).
   ---------------------------------------------------------------- */
const CAL_HOUR = 18;   // hora por defecto del entreno (18:00)

/** Enlace para añadir el entreno de un día a Google Calendar (recurrente). */
function googleCalendarUrl(d){
  const day = SCHEDULE[d];
  const date = dateForDow(d);
  const pad = n => String(n).padStart(2, '0');
  const fmt = (hh, mm) => `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${pad(hh)}${pad(mm)}00`;
  const desc = day.ex.map((e, k) => `${k+1}. ${e.n} — ${e.s}x${e.r}`).join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🏋️ Entreno · ${day.type}`,
    dates: `${fmt(CAL_HOUR, 0)}/${fmt(CAL_HOUR + 1, 0)}`,
    details: `${day.sub}\n\n${desc}`,
    recur: 'RRULE:FREQ=WEEKLY'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Pinta el panel de recordatorios (enlaces de Google + descarga .ics). */
function renderCalendar(){
  const host = document.getElementById('calendar');
  if(!host) return;
  const links = ORDER.filter(d => !SCHEDULE[d].rest).map(d => {
    const day = SCHEDULE[d];
    return `<a class="cal-link" href="${googleCalendarUrl(d)}" target="_blank" rel="noopener">
      <span><b>${day.label}</b> · ${day.type}</span><span class="cal-go">➕ Google</span></a>`;
  }).join('');
  host.innerHTML = `
    <h3>Añade tus entrenos al calendario</h3>
    <p><small>Recordatorios <b>semanales</b> a las ${CAL_HOUR}:00. Toca un día y se abre Google
      Calendar con todo pre-cargado: solo pulsa <b>Guardar</b>.</small></p>
    <div class="cal-list">${links}</div>
    <h3>¿iPhone u otro calendario?</h3>
    <p><small>Descarga el archivo y ábrelo con tu app (Apple Calendar lo importa solo).</small></p>
    <button class="pbtn" onclick="descargarICS()" style="margin-top:4px">📥 Descargar .ics</button>
    <button class="panel-close" onclick="closePanels()">Cerrar</button>`;
}

/** Genera y descarga un .ics estándar con los entrenos de la semana (offline). */
function descargarICS(){
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const fmtLocal = (d, hh, mm) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');

  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Entreno V//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  ORDER.forEach(d=>{
    const day = SCHEDULE[d];
    if(day.rest) return;                       // los días de descanso no van al calendario
    const date = dateForDow(d);
    const desc = day.ex.map((e,k)=>`${k+1}. ${e.n} — ${e.s}x${e.r}`).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:entrenov-${d}-${weekId()}@local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtLocal(date,CAL_HOUR,0)}`,    // hora local "flotante"
      `DTEND:${fmtLocal(date,CAL_HOUR+1,0)}`,    // 1 h de duración
      'RRULE:FREQ=WEEKLY',                     // se repite cada semana
      `SUMMARY:${esc('🏋️ Entreno · ' + day.type)}`,
      `DESCRIPTION:${esc(day.sub + '\n\n' + desc)}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'entreno-v.ics';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

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
renderWeek();
renderBanner();
const _toggle = document.getElementById('studyToggle');
if(_toggle) _toggle.checked = studyMode;   // refleja la preferencia guardada
bindObservers();                           // Observer registrado UNA sola vez
renderDays();
render();
registerSW();
Store.save(); // fija la semana en curso (y archiva la anterior si cambió)
