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
// Congelamos un id estable en cada ejercicio del plan (una sola vez, al arrancar).
ORDER.forEach(d => { const day = SCHEDULE[d]; if(day.ex) day.ex.forEach(e => { e.id = slugify(e.n); }); });

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

const Store = {
  KEY:    'entrenoV.state.v3',
  KEY_V2: 'entrenoV.state.v2',
  KEY_V1: 'entrenoV.state.v1',

  /** Carga la v3 (o migra en cadena v1→v2→v3) y deja todo hidratado en memoria.
      Las versiones anteriores NO se borran: quedan como respaldo silencioso. */
  load(){
    try{
      const rawV3 = DB.read(this.KEY);
      if(rawV3){ applyState(JSON.parse(rawV3)); return; }

      // v2 → v3: el esquema de sesiones es compatible (las series ya eran array).
      // applyState hidrata (type='efectiva' por defecto) y save() sella la v3.
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

  /** Vuelca los mapas de trabajo a 'sessions' y persiste el objeto v3. */
  save(){
    try{
      syncSessionsFromWorking();
      DB.write(this.KEY, JSON.stringify({
        schemaVersion: 3,
        ui: { current, studyMode, bannerHidden, theme, restDefault },
        sessions,
        bests,
        legacyHistory
      }));
    }catch(e){ /* almacenamiento no disponible: la app sigue en memoria */ }
  }
};

/** Copia un estado v2 (leído o recién migrado) a las variables en memoria. */
function applyState(st){
  const ui = (st && st.ui) || {};
  current      = (ui.current in SCHEDULE) ? ui.current : todayDow;
  studyMode    = !!ui.studyMode;
  bannerHidden = !!ui.bannerHidden;
  theme        = (ui.theme === 'light') ? 'light' : 'dark';
  restDefault  = +ui.restDefault || 0;
  Object.assign(sessions, (st && st.sessions) || {});
  Object.assign(bests, (st && st.bests) || {});
  Object.assign(legacyHistory, (st && st.legacyHistory) || {});
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
        startedAt: meta.startedAt || null, finishedAt: meta.finishedAt || null, snapshot: meta.snapshot || null };
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
let current = todayDow, studyMode = false, bannerHidden = false, theme = 'dark', restDefault = 0;
Store.load();         // hidrata todo lo anterior (migra v1->v2 la primera vez)

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

/** Formatea kg con separador de miles en español. */
function fmtKg(n){ return Math.round(n).toLocaleString('es-ES'); }

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
  for(const key in setsMap){
    const m = key.match(/^(x?)(\d+)-(\d+)$/);
    if(!m || +m[2] !== d) continue;
    total += setsVolume(setsMap[key]);
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
          ${lastTimeHint(i, e)}
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
    <button class="finish-btn" onclick="finishCurrentSession()">✅ Finalizar entrenamiento</button>
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
  return `<div class="lasttime">Última vez <b>${fmtKg(ref.w)} kg × ${ref.reps || '—'}</b> <span>· ${ref.date.slice(5).replace('-', '/')}</span></div>`;
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

/** HTML de una fila de serie: nº · peso · reps · RIR · tipo · (eliminar si hay varias). */
function setRow(i, si, s, count){
  const wv = (s.w === '' || s.w == null) ? '' : s.w;
  const rv = (s.reps === '' || s.reps == null) ? '' : s.reps;
  const rr = (s.rir === '' || s.rir == null) ? '' : s.rir;
  const type = s.type || 'efectiva';
  const opts = SET_TYPES.map(([v, lbl]) => `<option value="${v}"${type === v ? ' selected' : ''}>${lbl}</option>`).join('');
  return `<div class="setrow${isEffective(type) ? '' : ' warm'}" data-row="${si}">
    <span class="set-idx">${si + 1}</span>
    <div class="log-field">
      <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="w" data-delta="-${WEIGHT_STEP}" aria-label="Bajar peso serie ${si + 1}">−</button>
      <span class="log-box"><input class="log-input" type="number" inputmode="decimal" min="0" step="${WEIGHT_STEP}" value="${wv}" placeholder="0" data-k="set" data-i="${i}" data-s="${si}" data-field="w" aria-label="Peso serie ${si + 1} (kg)"><span class="log-unit">kg</span></span>
      <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="w" data-delta="${WEIGHT_STEP}" aria-label="Subir peso serie ${si + 1}">+</button>
    </div>
    <div class="log-field">
      <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="reps" data-delta="-1" aria-label="Bajar reps serie ${si + 1}">−</button>
      <span class="log-box"><input class="log-input" type="number" inputmode="numeric" min="0" step="1" value="${rv}" placeholder="reps" data-k="set" data-i="${i}" data-s="${si}" data-field="reps" aria-label="Reps serie ${si + 1}"><span class="log-unit">rps</span></span>
      <button class="step" type="button" data-step data-i="${i}" data-s="${si}" data-field="reps" data-delta="1" aria-label="Subir reps serie ${si + 1}">+</button>
    </div>
    <label class="set-rir"><span>RIR</span><input class="log-input" type="number" inputmode="numeric" min="0" max="10" step="1" value="${rr}" placeholder="—" data-k="set" data-i="${i}" data-s="${si}" data-field="rir" aria-label="RIR serie ${si + 1}"></label>
    <select class="set-type" data-k="set" data-i="${i}" data-s="${si}" data-field="type" aria-label="Tipo de serie ${si + 1}">${opts}</select>
    ${count > 1 ? `<button class="set-del" type="button" data-delset data-i="${i}" data-s="${si}" aria-label="Eliminar serie ${si + 1}">✕</button>` : ''}
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
    ? `📈 1RM estimado: <b>${fmtKg(rm)} kg</b>`
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
    ? `<div class="hist-delta ${diff>=0?'up':'down'}">${diff>=0?'▲':'▼'} ${diff>=0?'Subiste':'Bajaste'} <b>${fmtKg(Math.abs(diff))} kg</b> desde ${first.date.slice(5).replace('-','/')} · ${fmtKg(first.w)} → ${fmtKg(last.w)} kg</div>`
    : `<div class="hist-delta">Primer registro: <b>${fmtKg(first.w)} kg</b>. Registra otra sesión para ver tu curva.</div>`;
  const bestW = (bests[bestKeyFor(i, e)] || {}).w || 0;
  const rows = hist.slice(-8).map(h => {
    const isPr = h.w > 0 && h.w >= bestW;
    return `<li${isPr ? ' class="pr"' : ''}><span>${h.date.slice(5).replace('-','/')}</span><b>${fmtKg(h.w)} kg</b> × ${h.reps || '—'}${isPr ? ' 🏆' : ''}</li>`;
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
      row[field] = num;
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
let restTimerId = null, restLeft = 0, restEndId = null, restHideId = null;
function startRest(seconds){
  const bar = document.getElementById('restTimer');
  if(!bar) return;
  if(restDefault > 0) seconds = restDefault;   // Fase E: descanso por defecto configurable
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
  const s = (sessions[date] || (sessions[date] = { dayType:d, full:{ex:{},note:''}, express:{ex:{},note:''}, startedAt:null, finishedAt:null, snapshot:null }));
  if(!s.startedAt) s.startedAt = Date.now();
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
/** Snapshot permanente del entreno (spec §65): resumen para cargar el dashboard rápido. */
function buildSnapshot(d, s){
  const day = SCHEDULE[d];
  let sets = 0, exercises = 0, records = 0, topRm = 0;
  visibleEx(day).forEach((e, i) => {
    const arr = setsMap[exKey(i)];
    const c = effectiveSetCount(arr);
    if(c){ exercises++; sets += c; }
    const rm = best1RM(arr); if(rm > topRm) topRm = rm;
    const cur = (topSet(arr) || {}).w || 0, best = (bests[bestKeyFor(i, e)] || {}).w || 0;
    if(cur > 0 && cur >= best) records++;
  });
  const dur = (s.startedAt && s.finishedAt) ? (s.finishedAt - s.startedAt) : 0;
  return { date: dateOfDay(d), dayType:d, volume: dayVolumeAnyMode(d), sets, exercises, records, oneRm: Math.round(topRm), durationMs: dur };
}
/** Finaliza la sesión del día actual: sella la hora, calcula el snapshot y muestra el resumen. */
function finishCurrentSession(){
  const d = current;
  if(!dayHasProgress(d)) return;                 // nada que finalizar todavía
  ensureSessionStarted(d);
  const date = dateOfDay(d), s = sessions[date];
  s.finishedAt = Date.now();
  s.snapshot = buildSnapshot(d, s);
  Store.save();
  stopRest();
  renderSummary(d, s.snapshot);
  openPanel('summary');
  confettiBurst();
}
/** Resumen final del entreno (spec §43/§163). */
function renderSummary(d, snap){
  const host = document.getElementById('summary'); if(!host) return;
  const day = SCHEDULE[d] || {};
  const curWk = weekId();
  const prev = weeklyVolumes().filter(w => w.weekId < curWk).slice(-1)[0];
  const weekNow = weekVolume();
  let cmp = '';
  if(prev && prev.volume > 0){
    const diff = weekNow - prev.volume, pct = Math.round(diff / prev.volume * 100);
    cmp = `<div class="sum-cmp ${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '▲' : '▼'} ${diff >= 0 ? '+' : ''}${pct}% volumen vs. semana anterior</div>`;
  }
  host.innerHTML = `
    <div class="sum-hero"><div class="sum-emoji">🎉</div>
      <div class="sum-title">Entrenamiento completado</div>
      <div class="sum-sub">${day.type || ''} · ${day.label || ''}</div></div>
    <div class="sum-grid">
      <div class="sum-card"><b>${fmtDuration(snap.durationMs)}</b><span>duración</span></div>
      <div class="sum-card"><b>${fmtKg(snap.volume)}</b><span>kg volumen</span></div>
      <div class="sum-card"><b>${snap.sets}</b><span>series</span></div>
      <div class="sum-card"><b>${snap.exercises}</b><span>ejercicios</span></div>
      <div class="sum-card"><b>${snap.oneRm ? fmtKg(snap.oneRm) : '—'}</b><span>1RM máx</span></div>
      <div class="sum-card${snap.records ? ' gold' : ''}"><b>${snap.records}</b><span>récords 🏆</span></div>
    </div>
    ${cmp}
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
  bar.querySelector('.rec-go').addEventListener('click', () => { bar.remove(); if(typeof cand.s.dayType === 'number') select(cand.s.dayType); });
  bar.querySelector('.rec-skip').addEventListener('click', () => { cand.s.finishedAt = Date.now(); Store.save(); bar.remove(); });
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

/** Pinta "Total volumen levantado: X kg" (+ comparación con la semana previa). */
function updateVolume(){
  const el = document.getElementById('volume');
  if(!el) return;
  const v = dayVolume(current);
  let extra = '';
  const curWk = weekId();
  const prevWeeks = weeklyVolumes().filter(w => w.weekId < curWk);
  if(prevWeeks.length){
    const prev = prevWeeks[prevWeeks.length - 1].volume || 0;
    const weekNow = weekVolume();
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
  if(id === 'settings') renderSettings();   // genera el panel de ajustes
  const p = document.getElementById(id);
  p.hidden = false;
  p.scrollIntoView({behavior:'smooth',block:'start'});
}

function closePanels(){
  ['progress','calendar','summary','settings'].forEach(id=>{
    const p = document.getElementById(id);
    if(p) p.hidden = true;
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
/** Re-pinta el panel de ajustes si está abierto (refleja el estado activo). */
function syncSettings(){ const p = document.getElementById('settings'); if(p && !p.hidden) renderSettings(); }
/** Panel de configuración (spec §47/§100/§108). */
function renderSettings(){
  const host = document.getElementById('settings'); if(!host) return;
  const presets = [0, 30, 60, 90, 120, 180];
  host.innerHTML = `
    <h3>Apariencia</h3>
    <div class="seg" role="group" aria-label="Tema">
      <button class="seg-btn ${theme === 'dark' ? 'on' : ''}" onclick="setTheme('dark')">🌙 Oscuro</button>
      <button class="seg-btn ${theme === 'light' ? 'on' : ''}" onclick="setTheme('light')">☀️ Claro</button>
    </div>
    <h3>Descanso por defecto</h3>
    <p><small>Al marcar una serie el cronómetro usará este tiempo. «Del plan» respeta el descanso sugerido por cada ejercicio.</small></p>
    <div class="chip-row">${presets.map(s => `<button class="chipbtn ${restDefault === s ? 'on' : ''}" onclick="setRestDefault(${s})">${s === 0 ? 'Del plan' : s + 's'}</button>`).join('')}</div>
    <h3>Glosario</h3>
    <details class="acc"><summary><span class="acc-ico">💡</span> ¿Qué es el RIR?</summary><div class="gloss"><b>Repeticiones en reserva.</b> Cuántas repeticiones más podrías haber hecho antes de fallar. RIR 2 = te quedaban 2; RIR 0 = fallo total. Para ganar músculo, apunta a RIR 0–3.</div></details>
    <details class="acc"><summary><span class="acc-ico">🔢</span> ¿Qué son las reps?</summary><div class="gloss"><b>Repeticiones:</b> cuántas veces levantas el peso en una serie. «70 kg × 10» = diez repeticiones con 70 kg. Un grupo de reps seguidas es una <b>serie</b>; descansas entre series.</div></details>
    <details class="acc"><summary><span class="acc-ico">🏷️</span> Tipos de serie</summary><div class="gloss"><b>Efectiva:</b> cuenta para volumen y récords (tus series serias). <b>Calentamiento</b> y <b>Aproximación:</b> preparan el cuerpo, no cuentan. <b>Al fallo · Drop set · Back-off · Rest-pause · Myo-reps · Superserie:</b> técnicas intensas para series puntuales.</div></details>
    <details class="acc"><summary><span class="acc-ico">📈</span> 1RM estimado y volumen</summary><div class="gloss"><b>1RM estimado:</b> el peso que probablemente levantarías una sola vez; la app lo calcula con tu serie (fórmula de Epley), sin que lo pruebes. <b>Volumen:</b> peso × reps sumado de tus series efectivas; subirlo con el tiempo = progreso.</div></details>
    <h3>Tus datos</h3>
    <div class="export-row">
      <button class="pbtn" onclick="exportJSON()">💾 Respaldo</button>
      <button class="pbtn" onclick="importJSON()">♻️ Restaurar</button>
      <button class="pbtn" onclick="exportCSV()">📥 CSV</button>
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
}

/** Exporta un respaldo JSON completo (para no perder nada / cambiar de móvil). */
function exportJSON(){
  download(DB.read(Store.KEY) || '{}', 'entreno-v-respaldo.json', 'application/json');
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
    reader.onerror = () => alert('No pude leer el archivo. Inténtalo de nuevo.');
    reader.onload = () => {
      let data;
      try{ data = JSON.parse(reader.result); }
      catch(_){ alert('Ese archivo no es un respaldo válido (no es un .json legible).'); return; }
      if(!isValidBackup(data)){
        alert('Ese archivo no parece un respaldo de Entreno V.\nUsa el .json que descargaste con el botón "Respaldo".');
        return;
      }
      if(!confirm('Esto REEMPLAZA tus datos actuales por los del respaldo.\n¿Quieres continuar?')) return;
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
      catch(_){ alert('No pude guardar el respaldo (almacenamiento no disponible en este navegador).'); return; }
      alert('✅ Respaldo restaurado. La app se recargará para aplicarlo.');
      location.reload();
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
        <span class="exprog-delta ${cls}">${sign}${fmtKg(Math.abs(diff))} kg</span></div>
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
  let effSets = 0, rirSum = 0, rirN = 0; const exSet = new Set();
  for(const key in setsMap){
    if(!/^(x?)\d+-\d+$/.test(key)) continue;
    (setsMap[key] || []).forEach(s => {
      if(s && s.w > 0 && s.reps > 0 && isEffective(s.type)){
        effSets++; exSet.add(key);
        if(s.rir !== '' && s.rir != null){ rirSum += +s.rir; rirN++; }
      }
    });
  }
  return { effSets, avgRir: rirN ? rirSum / rirN : null, exercises: exSet.size };
}

function renderProgress(){
  const host = document.getElementById('progress');
  if(!host) return;
  const cstats = consistencyStats();
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

  // --- Tendencia (semanas del histórico + resúmenes v1 + ahora) ---
  const curWk = weekId();
  const trend = weeklyVolumes().filter(w => w.weekId < curWk)
    .map(w => ({ label: w.weekId.slice(5).replace('-', '/'), value: w.volume }));
  trend.push({ label: 'ahora', value: weekNow });

  // --- Récords (barras horizontales) ---
  const recRows = Object.keys(bests).map(k => {
    const d = +k.slice(0, k.indexOf('-'));
    const slug = k.slice(k.indexOf('-') + 1);
    const ex = resolveBySlug(d, slug, 'full') || resolveBySlug(d, slug, 'express');
    return ex ? { label: ex.n, value: bests[k].w, valText: fmtKg(bests[k].w) + ' kg' } : null;
  }).filter(Boolean).sort((a, b) => b.value - a.value).slice(0, 8);

  // --- Constancia (heatmap tipo GitHub): últimas 12 semanas por volumen ---
  const heatHtml = consistencyHeatmap(weekNow);

  host.innerHTML = `
    <h3>Resumen de la semana</h3>
    <div class="stat-cards">
      <div class="scard k1"><b>${fmtKg(weekNow)}</b><span>kg volumen</span></div>
      <div class="scard k2"><b>${sessCount}</b><span>sesiones</span></div>
      <div class="scard k3"><b>${recordCount}</b><span>récords</span></div>
      <div class="scard k4"><b>${cstats.streak}</b><span>racha sem.</span></div>
    </div>
    <div class="insights">${insights.map(t => `<div class="insight">${t}</div>`).join('')}</div>
    <div class="metrics">${metricsLine}</div>
    <h3>Progreso por ejercicio</h3>
    ${progressByExerciseHtml()}
    <h3>Volumen semanal</h3>
    <div class="chart-card">
      <div class="chart-cap"><b>${fmtKg(weekNow)}<span class="u">kg</span></b><span>esta semana</span></div>
      ${trend.length > 1 ? svgArea(trend) : '<p style="margin:4px 2px"><small>Aún no hay semanas anteriores: esta gráfica de líneas crece cada lunes. 📈</small></p>'}
    </div>
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
    <h3>Tus récords (peso máximo)</h3>
    ${recRows.length ? hBars(recRows, '--legs') : '<p><small>Registra pesos y aquí verás tus máximos por ejercicio.</small></p>'}
    <h3>Tabla de datos</h3>
    ${rows.length ? `<div class="data-scroll"><table class="data-table">
        <tr><th>Día</th><th>Ejercicio</th><th>Récord</th><th>Últ.</th></tr>
        ${rows.map(r => `<tr><td>${r.dia.slice(0,3)}</td><td>${r.ejercicio}</td><td>${fmtKg(r.record)}</td><td>${r.peso ? fmtKg(r.peso) + '×' + r.reps : '—'}</td></tr>`).join('')}
      </table></div>` : '<p><small>Registra pesos para llenar la tabla.</small></p>'}
    <div class="export-row">
      <button class="pbtn" onclick="exportCSV()">📥 CSV</button>
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
applyTheme();                              // Fase E: aplica el tema guardado antes de pintar
renderWeek();
renderBanner();
syncExpressBtn();                          // refleja la preferencia guardada en el botón Express
bindObservers();                           // Observer registrado UNA sola vez
renderDays();
render();
registerSW();
Store.save(); // fija la semana en curso (y archiva la anterior si cambió)
checkRecovery();  // Fase C: avisa de un entrenamiento sin finalizar de esta semana
