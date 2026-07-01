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
   express:[ {base:0,s:'3',r:'8–12',d:'90 s',p:'Núcleo · dorsal'},
             {base:1,s:'3',r:'8–12',d:'90 s',p:'Núcleo · grosor espalda'},
             {base:3,s:'3',r:'8–12',d:'60 s',p:'Núcleo · bíceps'},
             {base:6,s:'3',r:'12–20',d:'45 s',p:'Extra · hombro lateral',extra:true},
             {base:5,s:'2',r:'12–20',d:'45 s',p:'Extra · deltoides post.',extra:true} ],
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
   express:[ {base:0,s:'3',r:'8–12',d:'90 s',p:'Núcleo · pecho'},
             {base:2,s:'4',r:'12–20',d:'60 s',p:'Núcleo · hombro lateral'},
             {base:5,s:'3',r:'10–15',d:'60 s',p:'Núcleo · tríceps'},
             {base:4,s:'2–3',r:'8–12',d:'90 s',p:'Extra · deltoides',extra:true},
             {base:3,s:'2',r:'12–15',d:'45 s',p:'Extra · pecho estiram.',extra:true} ],
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
   express:[ {base:0,s:'3–4',r:'8–12',d:'2 min',p:'Núcleo · cuádriceps + glúteo'},
             {base:3,s:'3',r:'10–15',d:'90 s',p:'Núcleo · isquios'},
             {base:4,s:'3',r:'10–15',d:'45 s',p:'Núcleo · gemelo'},
             {base:2,s:'2–3',r:'12–20',d:'45 s',p:'Extra · cuádriceps aislado',extra:true},
             {base:5,s:'2',r:'10–15',d:'45 s',p:'Extra · abdomen',extra:true} ],
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
   express:[ {base:0,s:'3',r:'8–12',d:'90 s',p:'Núcleo · dorsal (anchura)'},
             {base:2,s:'4',r:'12–20',d:'60 s',p:'Núcleo · hombro lateral'},
             {base:4,s:'3',r:'8–12',d:'60 s',p:'Núcleo · bíceps'},
             {base:1,s:'2–3',r:'10–15',d:'90 s',p:'Extra · espalda alta',extra:true},
             {base:3,s:'2',r:'8–12',d:'90 s',p:'Extra · pecho mantener',extra:true} ],
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
   express:[ {base:0,s:'3',r:'8–12',d:'2 min',p:'Núcleo · cadena posterior'},
             {base:1,s:'3',r:'10–15',d:'90 s',p:'Núcleo · isquios + glúteo'},
             {base:4,s:'3',r:'12–20',d:'45 s',p:'Núcleo · sóleo'},
             {base:2,s:'2–3',r:'10–15',d:'90 s',p:'Extra · isquios',extra:true},
             {base:5,s:'2',r:'10–15',d:'45 s',p:'Extra · abdomen inferior',extra:true} ],
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
  const weeks = [
    ...Object.keys(history).sort().map(k => ({ id:k, vol:history[k].volume || 0 })),
    { id: weekId(), vol: weekNow, now:true }
  ].slice(-12);
  const max = Math.max(1, ...weeks.map(w => w.vol));
  const level = v => v <= 0 ? 0 : v < max*0.25 ? 1 : v < max*0.5 ? 2 : v < max*0.75 ? 3 : 4;
  const cells = weeks.map(w => {
    const dd = w.id.slice(5).replace('-', '/');   // "MM/DD"
    const txt = w.vol > 0 ? `${dd}: ${fmtKg(w.vol)} kg` : `${dd}: sin registro`;
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
          ${logRow(i)}
          ${bestRow(i, e)}
          <div class="acc-wrap">
            <details class="acc"><summary><span class="acc-ico">📋</span> Cómo hacerlo</summary><ol class="tech-ol">${steps}</ol></details>
            ${noteDetails(i)}
            <a class="acc-link" href="${yt}" target="_blank" rel="noopener"><span class="acc-ico">▶</span> Ver video</a>
          </div>
        </div>
        ${exFig(e.m)}
      </div>
    </div>`;
  }).join('');
  view.innerHTML = `<div class="hero"><div class="hero-text">
      <div class="chev"><span></span><span></span><span></span></div>
      <div class="type">${day.type}</div>
      <div class="sub">${day.label} ${dateForDow(current).getDate()} ${MES[dateForDow(current).getMonth()]} · ${day.sub}</div>
    </div>${heroMap(day.muscles)}</div>
    <div class="progress"><div class="row"><span>Progreso de hoy &nbsp; <b id="pcount">0</b> / ${total}</span>
      <button class="reset" onclick="resetDay()">Reiniciar</button></div>
      <div class="bar"><i id="pbar"></i></div></div>
    <div class="list">${list}</div>
    <div class="volume" id="volume"></div>
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
  } else if(k === 'snote'){
    notes[sessKey()] = el.value;   // feedback general del día (no atado a un ejercicio)
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
let restTimerId = null, restLeft = 0, restEndId = null, restHideId = null;
function startRest(seconds){
  const bar = document.getElementById('restTimer');
  if(!bar) return;
  // Cancela cualquier temporizador pendiente (evita que un descanso anterior
  // oculte el nuevo a mitad de camino: ese era el bug del "reloj que no se va").
  clearInterval(restTimerId); clearTimeout(restEndId); clearTimeout(restHideId);
  restLeft = seconds;
  bar.classList.remove('done');
  bar.hidden = false;
  void bar.offsetWidth;          // fuerza un reflow: fija el estado inicial oculto...
  bar.classList.add('show');     // ...y ahora la transición de entrada arranca sí o sí
  paintRest();
  restTimerId = setInterval(()=>{
    restLeft--;
    if(restLeft <= 0){
      clearInterval(restTimerId);
      restLeft = 0; paintRest();                                 // muestra 00:00 un instante
      if(navigator.vibrate) navigator.vibrate([200,100,200]);   // aviso háptico en móvil
      bar.classList.add('done');
      restEndId = setTimeout(stopRest, 900);   // al llegar a 00:00 se oculta AUTOMÁTICAMENTE
      return;
    }
    paintRest();
  }, 1000);
}
function paintRest(){
  const mm = Math.floor(Math.max(0,restLeft) / 60), ss = Math.max(0,restLeft) % 60;
  const t = document.getElementById('restTime');
  if(t) t.textContent = `${mm}:${String(ss).padStart(2,'0')}`;
}
function stopRest(){
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
  ['progress','calendar'].forEach(id=>{
    const p = document.getElementById(id);
    if(p) p.hidden = true;
  });
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
    const [d, bi] = k.split('-').map(Number);
    const ex = SCHEDULE[d] && SCHEDULE[d].ex && SCHEDULE[d].ex[bi];
    if(!ex) return null;
    const ld = loads[`${d}-${bi}`] || {};
    return { dia: SCHEDULE[d].label, ejercicio: ex.n, record: bests[k].w, peso: ld.w || 0, reps: ld.reps || 0 };
  }).filter(Boolean).sort((a, b) => b.record - a.record);
}

/** Exporta las estadísticas como CSV (abre en Sheets/Excel/My Files). */
function exportCSV(){
  const lines = ['Dia,Ejercicio,Record (kg),Ultimo peso (kg),Ultimas reps'];
  statsRows().forEach(r =>
    lines.push([r.dia, '"' + r.ejercicio.replace(/"/g, '""') + '"', r.record, r.peso, r.reps].join(',')));
  lines.push('', 'Semana (lunes),Volumen total (kg),Ejercicios completados');
  Object.keys(history).sort().forEach(k =>
    lines.push([k, history[k].volume || 0, history[k].completed || 0].join(',')));
  lines.push([weekId() + ' (actual)', weekVolume(loads), Object.values(done).filter(Boolean).length].join(','));
  download('﻿' + lines.join('\r\n'), 'entreno-v-estadisticas.csv', 'text/csv;charset=utf-8');
}

/** Exporta un respaldo JSON completo (para no perder nada / cambiar de móvil). */
function exportJSON(){
  download(localStorage.getItem(Store.KEY) || '{}', 'entreno-v-respaldo.json', 'application/json');
}

function renderProgress(){
  const host = document.getElementById('progress');
  if(!host) return;

  // --- Resumen ---
  const rows = statsRows();
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

  // --- Constancia (heatmap tipo GitHub): últimas 12 semanas por volumen ---
  const heatHtml = consistencyHeatmap(weekNow);

  host.innerHTML = `
    <h3>Resumen de la semana</h3>
    <div class="stat-cards">
      <div class="scard k1"><b>${fmtKg(weekNow)}</b><span>kg volumen</span></div>
      <div class="scard k2"><b>${sessions}</b><span>sesiones</span></div>
      <div class="scard k3"><b>${recordCount}</b><span>récords</span></div>
    </div>
    <h3>Volumen semanal</h3>
    <div class="chart-card">
      <div class="chart-cap"><b>${fmtKg(weekNow)}<span class="u">kg</span></b><span>esta semana</span></div>
      ${trend.length > 1 ? svgArea(trend) : '<p style="margin:4px 2px"><small>Aún no hay semanas anteriores: esta gráfica de líneas crece cada lunes. 📈</small></p>'}
    </div>
    <h3>Constancia · últimas semanas</h3>
    ${heatHtml}
    <h3>Volumen por día</h3>
    <div class="chart-card">${svgBars(dias, 'volumen por día')}</div>
    <h3>Volumen por músculo</h3>
    ${muscleRows.length ? hBars(muscleRows, '--primary') : '<p><small>Registra pesos para ver el reparto por músculo.</small></p>'}
    <h3>Tus récords (peso máximo)</h3>
    ${recRows.length ? hBars(recRows, '--legs') : '<p><small>Registra pesos y aquí verás tus máximos por ejercicio.</small></p>'}
    <h3>Tabla de datos</h3>
    ${rows.length ? `<div class="data-scroll"><table class="data-table">
        <tr><th>Día</th><th>Ejercicio</th><th>Récord</th><th>Últ.</th></tr>
        ${rows.map(r => `<tr><td>${r.dia.slice(0,3)}</td><td>${r.ejercicio}</td><td>${fmtKg(r.record)}</td><td>${r.peso ? fmtKg(r.peso) + '×' + r.reps : '—'}</td></tr>`).join('')}
      </table></div>` : '<p><small>Registra pesos para llenar la tabla.</small></p>'}
    <div class="export-row">
      <button class="pbtn" onclick="exportCSV()">📥 CSV (tabla)</button>
      <button class="pbtn" onclick="exportJSON()">💾 Respaldo JSON</button>
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
  syncExpressBtn();
  render();        // re-pinta el día con el schema exprés o el completo
  Store.save();
}

/** Refleja el estado del Modo Express en el botón grande del dock. */
function syncExpressBtn(){
  const btn = document.getElementById('expressBtn');
  if(!btn) return;
  btn.setAttribute('aria-pressed', studyMode ? 'true' : 'false');
  const st = document.getElementById('expressState');
  if(st) st.textContent = studyMode ? 'Activo · rutina exprés' : 'Rutina completa';
}

/* ----------------------------------------------------------------
   7d. RECORDATORIOS DE CALENDARIO
   ------------------------------------------------------------
   Dos vías, ambas sin servidor:
   - Google Calendar: enlace "Añadir" con evento semanal pre-cargado.
   - Otros calendarios: descarga de un .ics estándar (se importa al calendario).
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
    <h3>¿Otro calendario?</h3>
    <p><small>Descarga el archivo .ics y ábrelo con tu app (Samsung Calendar y Google Calendar lo importan solo).</small></p>
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
syncExpressBtn();                          // refleja la preferencia guardada en el botón Express
bindObservers();                           // Observer registrado UNA sola vez
renderDays();
render();
registerSW();
Store.save(); // fija la semana en curso (y archiva la anterior si cambió)
