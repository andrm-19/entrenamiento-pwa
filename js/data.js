/* ============================================================
   Entreno V — 1. Datos del plan y fechas
   Arquitectura modular (spec §10/§116): scripts clásicos cargados en orden,
   mismo scope global; sin build. El orden en index.html es significativo.
   ============================================================ */
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

