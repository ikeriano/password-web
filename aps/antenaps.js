/* =====================================================================================
   📺 AntenaPlayStation · módulo de TELE dentro del juego · v1.0 (🆕 INVENTADO)
   Módulo REUTILIZABLE: no depende de three.js ni del juego. Se usa así en cualquier juego
   (Pasapalabra 3D, Saber y Ganar 3D, Uno para ganar…):
     <script src="aps/antenaps.js"></script>
     AntenaPS.init({base:'aps/', game:'Pasapalabra 3D', hooks:{ canPlay(p){…}, play(p){ return Promise } , onClose(){…} }});
     AntenaPS.open();
   Más canales: AntenaPS.addChannel({id:'nuevo',name:'Nombre',logo:'archivo.png',grid:{lab:[…],fin:[…]}})
   (Iker mandará los nombres de los demás canales: aquí solo está AntenaPlayStation.)
   Logo: el de Iker (forma de Antena 3 a propósito + PlayStation), fondo hecho transparente.
   Todo lo que es contenido inventado lleva la marca «🆕 INVENTADO».
   Rendimiento (Redmi A2): solo HTML/CSS; animaciones con transform/opacity/clip-path (Web Animations API).
   ===================================================================================== */
(function(){
'use strict';
const INV='🆕 INVENTADO';
const CFG={base:'aps/',game:'',hooks:{},key:'antenaps.v1'};
// ---------------- datos guardados ----------------
const DEF_ANIM=()=>({in:{t:'none',d:.6},out:{t:'none',d:.6},combo:{t:'none',d:1.6},L:{t:'none',d:.05}});
const DEF={hashtags:['#AntenaPlayStation','#Pasapalabra3D','#ElRoscoMaldito'],tag:-1,promoEvery:40,
 anim:{mosca:DEF_ANIM(),tag:DEF_ANIM(),plogo:DEF_ANIM(),ptext:DEF_ANIM()},ch:0};
let S=null;
function load(){try{S=Object.assign(JSON.parse(JSON.stringify(DEF)),JSON.parse(localStorage.getItem(CFG.key)||'{}'));}catch(e){S=JSON.parse(JSON.stringify(DEF));}
 for(const k in DEF.anim){S.anim[k]=Object.assign(DEF_ANIM(),S.anim[k]||{});}}
function save(){try{localStorage.setItem(CFG.key,JSON.stringify(S));}catch(e){}}
// ---------------- logos de Iker (logos_transparentes) ----------------
const LOGOS={aps:'antenaps_simbolo_512.png',apsFull:'antenaps_logo_512.png',pasapalabra:'logos/pasapalabra_texto_blanco_v1.png',pasapalabra2:'logos/pasapalabra_texto_blanco_v2.png',
 ahoracaigo:'logos/ahora_caigo_hd.png',ruleta:'logos/la_ruleta_de_la_suerte.png',ruletaN:'logos/la_ruleta_de_la_suerte_noche.png',millonario:'logos/quien_quiere_ser_millonario.png',
 reaccion:'logos/reaccion_en_cadena.png',caza:'logos/la_caza.png',chase:'logos/the_chase.png',juegos:'logos/juego_de_juegos.png',abismo:'logos/acierta_o_abismo.png',acerte:'logos/acerte_ou_caia.png',
 rueda:'logos/rueda_la_letra_texto.png',allatu:'logos/alla_tu.png',showtime:'logos/showtime_tv_azul.png',tp:'logos/calificacion_tp_circulo.png',mas7:'logos/calificacion_mas7.png'};
const ALL_LOGOS=['acerte_ou_caia','acierta_o_abismo','ahora_caigo_hd','ahora_caigo_v1','ahora_caigo_v2','alla_tu','antena3_blanco','antena3_blanco_v2','antena3_rosa','atresplayer','boing','calificacion_mas7','calificacion_tp_circulo','calificacion_tp_cuadrado','cuatro','cuatro_hd','divinity','divinity_esfera','fdf_hd','juego_de_juegos','la_caza','la_ruleta_de_la_suerte','la_ruleta_de_la_suerte_noche','mediaset_infinity_blanco','pasapalabra_texto_blanco_v1','pasapalabra_texto_blanco_v2','quien_quiere_ser_millonario','reaccion_en_cadena','rueda_la_letra_ruleta','rueda_la_letra_texto','showtime_tv_azul','showtime_tv_oscuro','telecinco_2_dos','telecinco_anillo_azul','telecinco_circulo_azul','telecinco_hd','the_chase'];
// ---------------- PROGRAMACIÓN (horarios tipo TDT española) ----------------
// k: news (informativo) · game (concurso) · series (serie de comedia) · film (cine) · music
// Informativos a las horas reales de la TDT: 06:15 (mañana), 15:00 y 21:00; Pasapalabra a las 20:00 como en la tele.
const P=(h,t,k,o={})=>Object.assign({h,t,k},o);
const GRID_LAB=[
 P('06:15','APS Noticias de la mañana','news',{tag:'#APSNoticias',inv:1}),
 P('08:55','Aquí no hay quien gane','series',{tag:'#AquíNoHayQuienGane',inv:1,ep:'T1 · «El rosco de la comunidad»'}),
 P('10:30','Pasapalabra · Clásicos','game',{tag:'#Pasapalabra3D',logo:'pasapalabra',rec:[2,3,4,5,6,7,8]}),
 P('12:00','La ruleta de la suerte','game',{tag:'#LaRuleta',logo:'ruleta',ph:1}),
 P('13:00','¡Ahora caigo!','game',{tag:'#AhoraCaigo',logo:'ahoracaigo',ph:1}),
 P('14:00','Los del plató','series',{tag:'#LosDelPlató',inv:1,ep:'T2 · «El pulsador no funciona»'}),
 P('15:00','APS Noticias 1','news',{tag:'#APSNoticias1',inv:1}),
 P('15:45','APS Deportes y El tiempo','news',{tag:'#APSDeportes',inv:1,sub:'dep'}),
 P('16:00','Cine de sobremesa: El concurso del siglo','film',{tag:'#CineAPS',inv:1,syn:'Una familia entera se presenta a un concurso de la tele para ganar el bote… y la abuela es la que más sabe.'}),
 P('17:45','¿Quién quiere ser millonario?','game',{tag:'#Millonario',logo:'millonario',ph:1}),
 P('19:00','Reacción en cadena','game',{tag:'#ReacciónEnCadena',logo:'reaccion',ph:1}),
 P('20:00','Pasapalabra','game',{tag:'#Pasapalabra',logo:'pasapalabra',rec:[0,1,9,10,11,12,13,14,15,16,17,18]}),
 P('21:00','APS Noticias 2','news',{tag:'#APSNoticias2',inv:1}),
 P('21:35','APS Deportes y El tiempo','news',{tag:'#APSDeportes',inv:1,sub:'dep'}),
 P('21:45','Aquí no hay quien gane','series',{tag:'#AquíNoHayQuienGane',inv:1,ep:'T1 · «La vecina del 5.º se apunta a Pasapalabra»'}),
 P('22:45','Cine: Pasapalabra y El Rosco maldito','film',{tag:'#ElRoscoMaldito',inv:1,logo:'pasapalabra',syn:'Un rosco antiguo aparece en el plató: cada letra que se falla apaga una luz. Los concursantes tienen que acertar las 25 antes de medianoche para romper la maldición.'}),
 P('00:45','APS Noticias de la noche','news',{tag:'#APSNoticias',inv:1}),
 P('01:15','Pasapalabra (repetición)','game',{tag:'#Pasapalabra',logo:'pasapalabra',rec:[2,3,4,5,6]}),
 P('02:30','Minutos musicales','music',{tag:'#AntenaPlayStation',inv:1})];
const GRID_FIN=[
 P('07:00','Concursos de madrugada','game',{tag:'#Pasapalabra3D',logo:'pasapalabra',rec:[2,3,4,5]}),
 P('09:30','Los del plató (maratón)','series',{tag:'#LosDelPlató',inv:1,ep:'Maratón de fin de semana'}),
 P('12:30','La ruleta de la suerte','game',{tag:'#LaRuleta',logo:'ruleta',ph:1}),
 P('14:00','Cine: Uno para ganar, la película','film',{tag:'#CineAPS',inv:1,syn:'Un concursante tiene un minuto para cada reto… y solo una vida.'}),
 P('15:00','APS Noticias 1 fin de semana','news',{tag:'#APSNoticias1',inv:1}),
 P('15:45','APS Deportes y El tiempo','news',{tag:'#APSDeportes',inv:1,sub:'dep'}),
 P('16:00','Multicine: El rosco de oro','film',{tag:'#CineAPS',inv:1,syn:'Dos amigos se preparan todo el verano para el rosco de su vida.'}),
 P('18:00','Pasapalabra · Especial','game',{tag:'#Pasapalabra',logo:'pasapalabra',rec:[0,1,9,10,11]}),
 P('21:00','APS Noticias 2 fin de semana','news',{tag:'#APSNoticias2',inv:1}),
 P('21:45','Cine: Pasapalabra y El Rosco maldito','film',{tag:'#ElRoscoMaldito',inv:1,logo:'pasapalabra',syn:'Un rosco antiguo aparece en el plató: cada letra que se falla apaga una luz. Los concursantes tienen que acertar las 25 antes de medianoche para romper la maldición.'}),
 P('23:45','APS Noticias de la noche','news',{tag:'#APSNoticias',inv:1}),
 P('00:15','Pasapalabra (repetición)','game',{tag:'#Pasapalabra',logo:'pasapalabra',rec:[2,3,4]}),
 P('02:30','Minutos musicales','music',{tag:'#AntenaPlayStation',inv:1})];
const CHANNELS=[{id:'aps',name:'AntenaPlayStation',logo:'antenaps_simbolo_512.png',inv:1,grid:{lab:GRID_LAB,fin:GRID_FIN}}];
// ---------------- utilidades de tiempo ----------------
const mins=h=>{const [a,b]=h.split(':').map(Number);return a*60+b;};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60;};
const isFin=()=>{const d=new Date().getDay();return d==0||d==6;};
function grid(ch){const c=CHANNELS[ch]||CHANNELS[0];const g=(isFin()&&c.grid.fin)?c.grid.fin:c.grid.lab;return g.map((p,i)=>{const s=mins(p.h);let e=mins(g[(i+1)%g.length].h);if(e<=s)e+=1440;return Object.assign({},p,{s,e,i});});}
function slotAt(ch,m){const g=grid(ch);for(const p of g){let mm=m;if(mm<p.s)mm+=1440;if(mm>=p.s&&mm<p.e)return p;}return g[0];}
const nextOf=(ch,p)=>{const g=grid(ch);return g[(p.i+1)%g.length];};
const fmtH=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
// ---------------- MOTOR DE ANIMACIÓN (como InShot: Marcar / Desmarcar / Combo) ----------------
const FX=[['none','Ninguna','⛔'],['fade','Fundido','🌫️'],['zoomIn','Zoom +','🔍'],['zoomOut','Zoom −','🔎'],['slideL','Deslizar ⬅','⬅️'],['slideR','Deslizar ➡','➡️'],['slideU','Deslizar ⬆','⬆️'],['slideD','Deslizar ⬇','⬇️'],['swipeL','Barrido ⬅','◧'],['swipeR','Barrido ➡','◨'],['shake','Temblor','〰️']];
const LFX=[['none','Ninguna','⛔'],['type','Máquina de escribir','⌨️'],['fade','Fundido','🌫️'],['bounce','Salto','🦘'],['zoom','Zoom','🔍'],['drop','Caída','⬇️'],['wave','Ola (bucle)','🌊']];
function kIn(t){switch(t){
 case'fade':return[{opacity:0},{opacity:1}];case'zoomIn':return[{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1)'}];case'zoomOut':return[{opacity:0,transform:'scale(1.9)'},{opacity:1,transform:'scale(1)'}];
 case'slideL':return[{opacity:0,transform:'translateX(-120%)'},{opacity:1,transform:'none'}];case'slideR':return[{opacity:0,transform:'translateX(120%)'},{opacity:1,transform:'none'}];
 case'slideU':return[{opacity:0,transform:'translateY(120%)'},{opacity:1,transform:'none'}];case'slideD':return[{opacity:0,transform:'translateY(-120%)'},{opacity:1,transform:'none'}];
 case'swipeL':return[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}];case'swipeR':return[{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0)'}];
 case'shake':return[{opacity:0,transform:'translateX(-14px) rotate(-4deg)'},{opacity:1,transform:'translateX(12px) rotate(3deg)'},{transform:'translateX(-8px) rotate(-2deg)'},{transform:'translateX(5px)'},{transform:'none'}];}
 return null;}
function kCombo(t){switch(t){
 case'fade':return[{opacity:1},{opacity:.45}];case'zoomIn':return[{transform:'scale(1)'},{transform:'scale(1.12)'}];case'zoomOut':return[{transform:'scale(1)'},{transform:'scale(.88)'}];
 case'slideL':case'slideR':return[{transform:'translateX(0)'},{transform:`translateX(${t=='slideL'?-10:10}px)`}];case'slideU':case'slideD':return[{transform:'translateY(0)'},{transform:`translateY(${t=='slideU'?-8:8}px)`}];
 case'swipeL':case'swipeR':return[{filter:'brightness(1)'},{filter:'brightness(1.6)'}];case'shake':return[{transform:'rotate(-3deg)'},{transform:'rotate(3deg)'}];}
 return null;}
const W=(el,k,o)=>{try{return el.animate(k,o);}catch(e){return null;}};
function stopAll(el){(el.getAnimations?el.getAnimations({subtree:true}):[]).forEach(a=>a.cancel());}
function lettersPrep(el,text){el.textContent='';const sp=[];for(const ch of String(text)){const s=document.createElement('span');s.textContent=ch==' '?'\u00a0':ch;s.style.display='inline-block';el.appendChild(s);sp.push(s);}return sp;}
function lettersIn(el,L,text){if(!L||L.t=='none'||L.t=='wave'){el.textContent=text;return 0;}const sp=lettersPrep(el,text);const st=L.d*1000;
 const k={type:[{opacity:0},{opacity:0,offset:.99},{opacity:1}],fade:[{opacity:0},{opacity:1}],bounce:[{opacity:0,transform:'translateY(-60%)'},{opacity:1,transform:'translateY(12%)'},{transform:'none'}],
  zoom:[{opacity:0,transform:'scale(2.4)'},{opacity:1,transform:'scale(1)'}],drop:[{opacity:0,transform:'translateY(-140%) rotate(-20deg)'},{opacity:1,transform:'none'}]}[L.t];
 sp.forEach((s,i)=>W(s,k,{duration:L.t=='type'?Math.max(20,st):Math.max(180,st*5),delay:i*st,fill:'backwards',easing:'ease-out'}));return sp.length*st+(L.t=='type'?st:st*5);}
function lettersWave(el,L){if(!L||L.t!='wave')return;const txt=el.textContent;const sp=lettersPrep(el,txt);sp.forEach((s,i)=>W(s,[{transform:'translateY(0)'},{transform:'translateY(-18%)'},{transform:'translateY(0)'}],{duration:900,delay:i*Math.max(30,L.d*1000),iterations:Infinity}));}
// muestra un elemento con su animación de entrada (+ letras) y deja el combo en bucle
function show(el,A,text){stopAll(el);el.style.visibility='visible';const txt=el.querySelector('.apsT');let extra=0;if(txt&&text!=null)extra=lettersIn(txt,A.L,text);
 const k=kIn(A.in.t);const d=A.in.d*1000;if(k)W(el,k,{duration:d,easing:'cubic-bezier(.2,.8,.2,1)'});
 const start=Math.max(k?d:0,extra);setTimeout(()=>{if(el.style.visibility!='visible')return;const c=kCombo(A.combo.t);if(c)W(el,c,{duration:A.combo.d*1000,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});if(txt)lettersWave(txt,A.L);},start);
 return new Promise(r=>setTimeout(r,start));}
function hide(el,A){stopAll(el);const k=kIn(A.out.t);const d=A.out.d*1000;if(!k){el.style.visibility='hidden';return Promise.resolve();}
 const a=W(el,k,{duration:d,direction:'reverse',easing:'cubic-bezier(.6,0,.8,.2)',fill:'forwards'});return new Promise(r=>setTimeout(()=>{el.style.visibility='hidden';if(a)a.cancel();r();},d));}
// ---------------- CSS ----------------
const CSS=`#aps{position:fixed;inset:0;z-index:75;font-family:N,Arial,sans-serif;color:#fff;background:#000;overflow:hidden;user-select:none;-webkit-user-select:none}
#aps.over{background:transparent;pointer-events:none}#aps.over .scr,#aps.over .bar,#aps.over .pane{display:none}#aps.over .ovl{pointer-events:none}#aps.over .exit3d{display:block}
#aps .scr{position:absolute;inset:0;overflow:hidden}#aps .ovl{position:absolute;inset:0;pointer-events:none}
#aps .mosca{position:absolute;right:2.2%;bottom:3.5%;width:9.5vmin;height:9.5vmin;opacity:.9;visibility:hidden;will-change:transform,opacity}#aps .mosca img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
#aps .htag{position:absolute;left:2.2%;top:3.5%;font-weight:900;font-size:3.6vmin;text-shadow:0 2px 3px rgba(0,0,0,.75);visibility:hidden;will-change:transform,opacity;white-space:nowrap}
#aps .promo{position:absolute;right:2.2%;top:3%;display:flex;align-items:center;gap:1.2vmin;background:linear-gradient(90deg,rgba(10,30,90,.0),rgba(10,30,90,.82) 18%);padding:.8vmin 1.4vmin .8vmin 4vmin;border-radius:1vmin;visibility:hidden}
#aps .promo .pl{width:13vmin;height:8vmin;visibility:hidden;will-change:transform,opacity}#aps .promo .pl img{width:100%;height:100%;object-fit:contain}
#aps .promo .pt{visibility:hidden;text-align:right;line-height:1.1;will-change:transform,opacity}#aps .promo .pt small{display:block;font-size:2.1vmin;color:#ffd23a;font-weight:800}#aps .promo .pt .apsT{font-size:3vmin;font-weight:900}
#aps .bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:1vmin;justify-content:center;flex-wrap:wrap;padding:1.2vmin;background:linear-gradient(transparent,rgba(0,0,0,.85));transition:opacity .4s}
#aps .bar.hid{opacity:0;pointer-events:none}
#aps button{font:inherit;font-weight:800;font-size:2.8vmin;border:0;border-radius:3vmin;padding:1.2vmin 2.2vmin;background:#1a50d0;color:#fff;box-shadow:0 2px 0 rgba(0,0,0,.35)}
#aps button.y{background:#e8a40a;color:#1a1a1a}#aps button.g{background:#2aa83a}#aps button.r{background:#b02020}#aps button.on{outline:.5vmin solid #ffd23a}
#aps .exit3d{display:none;position:absolute;left:2%;bottom:3%;pointer-events:auto;opacity:.8}
#aps .pane{position:absolute;inset:0;background:rgba(4,12,40,.96);overflow:auto;padding:2.4vmin 3vmin 12vmin;display:none}#aps .pane.on{display:block}
#aps h2{margin:.4em 0;font-size:4.4vmin}#aps h3{margin:.8em 0 .3em;font-size:3.4vmin;color:#ffd23a}#aps .nt{opacity:.85;font-size:2.6vmin}
#aps .row{display:flex;gap:1vmin;flex-wrap:wrap;align-items:center;margin:.8vmin 0}
#aps .epg{display:flex;align-items:center;gap:1.6vmin;padding:1.2vmin;border-radius:1.4vmin;background:rgba(255,255,255,.07);margin:.8vmin 0;font-size:2.8vmin}
#aps .epg.now{background:rgba(232,164,10,.25);outline:.4vmin solid #e8a40a}#aps .epg b.h{font-size:3.4vmin;min-width:10vmin}#aps .epg img{height:6vmin;width:12vmin;object-fit:contain}
#aps .inv{display:inline-block;background:#b0207a;color:#fff;font-size:2vmin;font-weight:900;border-radius:1vmin;padding:.2vmin 1vmin;margin-left:1vmin}
#aps input[type=text]{font:inherit;font-size:3vmin;padding:1vmin;border-radius:1vmin;border:0;min-width:40vmin}#aps input[type=range]{width:50vmin}
#aps .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(18vmin,1fr));gap:1.4vmin}#aps .gal div{background:#223;border-radius:1vmin;padding:1vmin;text-align:center;font-size:1.8vmin}#aps .gal img{width:100%;height:10vmin;object-fit:contain}
/* contenidos de relleno */
#aps .cnt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}
#aps .cnt .ttl{font-size:6vmin;font-weight:900;text-shadow:0 3px 8px rgba(0,0,0,.6)}#aps .cnt .sub{font-size:3vmin;opacity:.9;margin-top:1vmin}
#aps .invb{position:absolute;left:50%;top:13%;transform:translateX(-50%);background:rgba(176,32,122,.9);padding:.6vmin 2vmin;border-radius:2vmin;font-weight:900;font-size:2.4vmin}
#aps .news{background:radial-gradient(circle at 30% 30%,#2a62d8,#06184a)}#aps .news .desk{position:absolute;left:20%;right:20%;bottom:18%;height:16%;background:linear-gradient(#e8eef8,#9aa8c0);border-radius:2vmin 2vmin 0 0}
#aps .news .anchor{position:absolute;left:50%;bottom:30%;width:16vmin;height:24vmin;transform:translateX(-50%);background:radial-gradient(circle at 50% 18%,#e0b090 0 16%,transparent 17%),linear-gradient(transparent 32%,#1c2540 32%);border-radius:8vmin 8vmin 1vmin 1vmin;animation:apsBob 3s ease-in-out infinite}
#aps .news .lt{position:absolute;left:6%;right:6%;bottom:6%;background:#fff;color:#0a2a7a;border-left:2vmin solid #e8a40a;font-weight:900;font-size:3.4vmin;padding:1vmin 2vmin;text-align:left}
#aps .news .tk{position:absolute;left:0;right:0;bottom:0;height:5%;background:#0a2a7a;overflow:hidden;font-size:2.4vmin;line-height:5vh;white-space:nowrap}#aps .news .tk span{display:inline-block;padding-left:100%;animation:apsTk 30s linear infinite}
#aps .series{background:linear-gradient(#f6d58a 0 62%,#9b5a2a 62%)}#aps .series .sofa{position:absolute;left:28%;right:28%;bottom:24%;height:14%;background:#b0303a;border-radius:3vmin}
#aps .series .p1,#aps .series .p2{position:absolute;bottom:32%;width:10vmin;height:20vmin;border-radius:5vmin 5vmin 1vmin 1vmin;animation:apsBob 2.2s ease-in-out infinite}#aps .series .p1{left:36%;background:radial-gradient(circle at 50% 18%,#f0c8a0 0 18%,transparent 19%),linear-gradient(transparent 34%,#2a8a5a 34%)}
#aps .series .p2{right:36%;background:radial-gradient(circle at 50% 18%,#c89870 0 18%,transparent 19%),linear-gradient(transparent 34%,#3a4ac0 34%);animation-delay:.6s}
#aps .series .bub{position:absolute;top:24%;left:50%;transform:translateX(-50%);background:#fff;color:#222;border-radius:3vmin;padding:1.4vmin 2.4vmin;font-size:3.2vmin;font-weight:800;max-width:70%}
#aps .series .laugh{position:absolute;bottom:8%;width:100%;text-align:center;font-size:2.6vmin;color:#3a1a00;font-weight:900}
#aps .film{background:#000}#aps .film .sc{position:absolute;left:0;right:0;top:12%;bottom:12%;background:radial-gradient(circle at 50% 60%,#5a1020,#120008);overflow:hidden}
#aps .film .moon{position:absolute;left:62%;top:14%;width:14vmin;height:14vmin;border-radius:50%;background:#f4e6c0;box-shadow:0 0 6vmin #f4e6c0}
#aps .film .ring{position:absolute;left:50%;top:56%;width:36vmin;height:36vmin;margin:-18vmin;border-radius:50%;border:2vmin dashed rgba(80,160,255,.8);animation:apsSpin 14s linear infinite}
#aps .film .syn{position:absolute;left:8%;right:8%;bottom:16%;font-size:2.8vmin;text-shadow:0 2px 4px #000}
#aps .game{background:radial-gradient(circle at 50% 40%,#3a7af0,#0a1e6a)}#aps .game img.lg{width:46vmin;max-height:30vmin;object-fit:contain;animation:apsBob 3s ease-in-out infinite}
#aps .music{background:linear-gradient(120deg,#1a0a4a,#4a0a6a,#0a3a6a);background-size:300% 300%;animation:apsGr 10s ease infinite}#aps .music .eq{display:flex;gap:1vmin;align-items:flex-end;height:20vmin}#aps .music .eq i{width:3vmin;background:#e8a40a;animation:apsEq 1s ease-in-out infinite alternate}
@keyframes apsBob{50%{transform:translate(-50%,-3%)}}#aps .game img.lg,#aps .series .p1,#aps .series .p2{--x:0}#aps .series .p1,#aps .series .p2,#aps .game img.lg{animation-name:apsBob2}@keyframes apsBob2{50%{transform:translateY(-4%)}}
@keyframes apsTk{to{transform:translateX(-100%)}}@keyframes apsSpin{to{transform:rotate(360deg)}}@keyframes apsGr{50%{background-position:100% 50%}}@keyframes apsEq{from{height:15%}to{height:100%}}`;
// ---------------- interfaz ----------------
let R=null,cur=null,live=true,stopped=false,watchSlot=null,promoT=null,hideT=null,clockT=null,playing3D=false,opened=false;
const $=s=>R.querySelector(s);
const img=n=>CFG.base+(LOGOS[n]||n);
function build(){if(R)return;const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 R=document.createElement('div');R.id='aps';R.innerHTML=`<div class="scr"></div><div class="ovl"><div class="htag"><span class="apsT"></span></div>
  <div class="promo"><div class="pl"><img alt=""></div><div class="pt"><small>A CONTINUACIÓN</small><span class="apsT"></span></div></div><div class="mosca"><img alt="AntenaPlayStation"></div></div>
  <div class="bar"><button data-k="prev">◀ Canal</button><button data-k="next">Canal ▶</button><button class="y" data-k="guia">📋 Guía</button><button data-k="skip">⏭ Siguiente</button><button data-k="tags"># Hashtags</button><button data-k="anim">✨ Animación</button><button data-k="logos">🖼️ Logos</button><button class="r" data-k="x">✖ Salir</button></div>
  <div class="pane"></div><button class="exit3d r" data-k="stop3d">📺 Volver a la tele</button>`;
 document.body.appendChild(R);
 R.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-k]');if(b){e.preventDefault();act(b.dataset.k,b);return;}if(!e.target.closest('.pane'))pokeBar();});}
function pokeBar(){const b=$('.bar');b.classList.remove('hid');clearTimeout(hideT);hideT=setTimeout(()=>b.classList.add('hid'),5000);}
function chan(){return CHANNELS[S.ch]||CHANNELS[0];}
function act(k,b){if(k=='x')return close();if(k=='guia')return pane('guia');if(k=='tags')return pane('tags');if(k=='anim')return pane('anim');if(k=='logos')return pane('logos');if(k=='closep')return pane(null);
 if(k=='prev'||k=='next'){live=true;S.ch=(S.ch+(k=='next'?1:CHANNELS.length-1))%CHANNELS.length;save();return tune(slotAt(S.ch,nowMin()));}
 if(k=='skip'){live=false;return tune(nextOf(S.ch,watchSlot||slotAt(S.ch,nowMin())));}if(k=='stop3d'){stopped=true;}if(k=='replay'){return play3D(watchSlot);}if(k=='stop3d'){try{CFG.hooks.stop&&CFG.hooks.stop();}catch(e){}return;}
 const d=b&&b.dataset;if(!d)return;
 if(k=='watch'){pane(null);live=false;return tune(grid(S.ch)[+d.i]);}
 if(k=='tagset'){S.tag=+d.i;save();refreshTag();return pane('tags');}
 if(k=='tagdel'){S.hashtags.splice(+d.i,1);if(S.tag>=S.hashtags.length)S.tag=-1;save();refreshTag();return pane('tags');}
 if(k=='tagadd'){const v=$('#apsNew').value.trim();if(v){S.hashtags.push(v[0]=='#'?v:'#'+v);save();}return pane('tags');}
 if(k=='tagedit'){const inp=$('#apsE'+d.i);const v=inp&&inp.value.trim();if(v){S.hashtags[+d.i]=v[0]=='#'?v:'#'+v;save();refreshTag();}return pane('tags');}
 if(k=='el'){EDIT.el=d.v;return pane('anim');}if(k=='ph'){EDIT.ph=d.v;return pane('anim');}
 if(k=='fx'){const A=S.anim[EDIT.el];A[EDIT.ph].t=d.v;save();return pane('anim');}
 if(k=='lfx'){S.anim[EDIT.el].L.t=d.v;save();return pane('anim');}
 if(k=='prev1'){return preview(EDIT.el);}if(k=='reset'){S.anim[EDIT.el]=DEF_ANIM();save();return pane('anim');}
 if(k=='demo'){S.anim={mosca:{in:{t:'zoomIn',d:.7},out:{t:'fade',d:.5},combo:{t:'none',d:1.6},L:{t:'none',d:.05}},tag:{in:{t:'swipeL',d:.6},out:{t:'slideL',d:.5},combo:{t:'none',d:1.6},L:{t:'type',d:.06}},
   plogo:{in:{t:'zoomOut',d:.6},out:{t:'zoomIn',d:.5},combo:{t:'zoomIn',d:1.4},L:{t:'none',d:.05}},ptext:{in:{t:'slideR',d:.6},out:{t:'fade',d:.5},combo:{t:'none',d:1.6},L:{t:'bounce',d:.05}}};save();return pane('anim');}}
const EDIT={el:'mosca',ph:'in'};
const ELN={mosca:'Mosca (logo abajo-derecha)',tag:'Hashtag (texto arriba-izquierda)',plogo:'Autopromo · logo',ptext:'Autopromo · texto'};
const PHN={in:['MARCAR','entrada'],out:['DESMARCAR','salida'],combo:['COMBO','en bucle']};
function pane(n){const p=$('.pane');if(!n){p.classList.remove('on');p.innerHTML='';return;}p.classList.add('on');const x='<div class="row"><button class="r" data-k="closep">⟵ Volver a la tele</button></div>';
 if(n=='guia'){const g=grid(S.ch);const now=slotAt(S.ch,nowMin());p.innerHTML=x+`<h2>📋 Guía de ${chan().name} <span class="inv">${INV}</span></h2><div class="nt">${isFin()?'Programación de fin de semana':'Programación de lunes a viernes'} · horarios tipo TDT: informativos a las 06:15, 15:00 y 21:00 y Pasapalabra a las 20:00. Toca un programa para verlo.</div>`+
  g.map(q=>`<div class="epg ${q.i==now.i?'now':''}"><b class="h">${q.h}</b>${q.logo?`<img src="${img(q.logo)}">`:'<span style="width:12vmin;text-align:center;font-size:5vmin">'+({news:'📰',series:'😂',film:'🎬',music:'🎵',game:'🎮'}[q.k])+'</span>'}<div style="flex:1"><b>${q.t}</b>${q.inv||q.ph?`<span class="inv">${INV}</span>`:''}<br><span class="nt">${q.h}–${fmtH(q.e)} · ${({news:'Informativo',series:'Serie de comedia',film:'Cine (película de concursos)',music:'Música',game:q.rec?'Concurso · recreación 3D de Pasapalabra':'Concurso · contenido provisional'})[q.k]} · ${q.tag||''}</span></div><button data-k="watch" data-i="${q.i}">${q.i==now.i?'▶ AHORA':'▶ Ver'}</button></div>`).join('');}
 if(n=='tags'){p.innerHTML=x+`<h2># Hashtags (arriba a la izquierda)</h2><div class="nt">Elige cuál se ve. «Del programa» usa el hashtag de cada programa.</div>
  <div class="row"><button class="${S.tag<0?'on':''}" data-k="tagset" data-i="-1">Del programa</button></div>`+S.hashtags.map((h,i)=>`<div class="row"><button class="${S.tag==i?'on':''}" data-k="tagset" data-i="${i}">Usar</button><input type="text" id="apsE${i}" value="${h.replace(/"/g,'&quot;')}"><button class="g" data-k="tagedit" data-i="${i}">💾 Guardar</button><button class="r" data-k="tagdel" data-i="${i}">🗑</button></div>`).join('')+
  `<h3>Añadir hashtag</h3><div class="row"><input type="text" id="apsNew" placeholder="#NuevoHashtag"><button class="g" data-k="tagadd">➕ Añadir</button></div>`;}
 if(n=='anim'){const A=S.anim[EDIT.el];const isT=EDIT.el=='tag'||EDIT.el=='ptext';
  p.innerHTML=x+`<h2>✨ ANIMACIÓN <span class="inv">${INV}</span></h2><div class="nt">Como en InShot: <b>MARCAR</b> = cómo entra · <b>DESMARCAR</b> = cómo sale · <b>COMBO</b> = movimiento en bucle mientras está. Al principio todo está en «Ninguna».</div>
  <h3>1 · ¿Qué quieres animar?</h3><div class="row">${Object.keys(ELN).map(k=>`<button class="${EDIT.el==k?'on y':''}" data-k="el" data-v="${k}">${ELN[k]}</button>`).join('')}</div>
  <h3>2 · Tipo</h3><div class="row">${Object.keys(PHN).map(k=>`<button class="${EDIT.ph==k?'on y':''}" data-k="ph" data-v="${k}">${PHN[k][0]} <small>(${PHN[k][1]}: ${FX.find(f=>f[0]==A[k].t)[1]})</small></button>`).join('')}</div>
  <h3>3 · Efecto de ${PHN[EDIT.ph][0]}</h3><div class="row">${FX.map(f=>`<button class="${A[EDIT.ph].t==f[0]?'on g':''}" data-k="fx" data-v="${f[0]}">${f[2]} ${f[1]}</button>`).join('')}</div>
  <h3>4 · Duración: <span id="apsDv">${A[EDIT.ph].d.toFixed(1)} s</span></h3><input type="range" id="apsD" min="0.2" max="3" step="0.1" value="${A[EDIT.ph].d}">`+
  (isT?`<h3>5 · Texto LETRA A LETRA</h3><div class="row">${LFX.map(f=>`<button class="${A.L.t==f[0]?'on g':''}" data-k="lfx" data-v="${f[0]}">${f[2]} ${f[1]}</button>`).join('')}</div><h3>Velocidad por letra: <span id="apsLv">${Math.round(A.L.d*1000)} ms</span></h3><input type="range" id="apsL" min="0.02" max="0.3" step="0.01" value="${A.L.d}">`:'')+
  `<div class="row" style="margin-top:2vmin"><button class="y" data-k="prev1">▶ Probar en la tele</button><button class="r" data-k="reset">Quitar animaciones de este</button><button data-k="demo">Poner animaciones de ejemplo (todas)</button></div>`;
  const d=$('#apsD');d.oninput=()=>{A[EDIT.ph].d=+d.value;$('#apsDv').textContent=(+d.value).toFixed(1)+' s';save();};const l=$('#apsL');if(l)l.oninput=()=>{A.L.d=+l.value;$('#apsLv').textContent=Math.round(l.value*1000)+' ms';save();};}
 if(n=='logos'){p.innerHTML=x+`<h2>🖼️ Logos de Iker</h2><div class="nt">Logo de AntenaPlayStation (fondo transparente; forma de Antena 3 a propósito) y los ${ALL_LOGOS.length} logos de logos_transparentes.</div><div class="gal"><div><img src="${img('aps')}">AntenaPlayStation</div><div><img src="${img('apsFull')}">AntenaPlayStation (completo)</div>${ALL_LOGOS.map(n=>`<div><img loading="lazy" src="${CFG.base}logos/${n}.png">${n}</div>`).join('')}</div>`;}}
async function preview(k){pane(null);const A=S.anim[k];const el=k=='mosca'?$('.mosca'):k=='tag'?$('.htag'):k=='plogo'?$('.promo .pl'):$('.promo .pt');
 if(k=='plogo'||k=='ptext'){setPromo();$('.promo').style.visibility='visible';const o=k=='plogo'?$('.promo .pt'):$('.promo .pl');o.style.visibility='visible';}
 await hide(el,A);await new Promise(r=>setTimeout(r,250));await show(el,A,k=='tag'?tagText():k=='ptext'?promoText():null);await new Promise(r=>setTimeout(r,2500));await hide(el,A);await new Promise(r=>setTimeout(r,300));
 if(k=='plogo'||k=='ptext'){$('.promo').style.visibility='hidden';$('.promo .pl').style.visibility=$('.promo .pt').style.visibility='hidden';}else show(el,A,k=='tag'?tagText():null);pane('anim');}
function tagText(){return S.tag>=0&&S.hashtags[S.tag]?S.hashtags[S.tag]:((watchSlot&&watchSlot.tag)||S.hashtags[0]||'');}
function refreshTag(){const el=$('.htag');if(el.style.visibility=='visible')show(el,S.anim.tag,tagText());}
let promoNext=null;function promoText(){const n=promoNext||nextOf(S.ch,watchSlot||slotAt(S.ch,nowMin()));return `${n.h} · ${n.t}`;}
function setPromo(){const n=promoNext=nextOf(S.ch,watchSlot||slotAt(S.ch,nowMin()));$('.promo .pl img').src=img(n.logo||'aps');}
async function promoCycle(){if(!opened)return;setPromo();const pr=$('.promo');pr.style.visibility='visible';await show($('.promo .pl'),S.anim.plogo,null);await show($('.promo .pt'),S.anim.ptext,promoText());
 await new Promise(r=>setTimeout(r,7000));await Promise.all([hide($('.promo .pt'),S.anim.ptext),hide($('.promo .pl'),S.anim.plogo)]);pr.style.visibility='hidden';}
// ---------------- contenido de cada programa ----------------
const HEAD=['Pasapalabra 3D estrena nueva versión con pruebas jugables','Un concursante acierta las 25 letras del rosco en el último segundo','La ruleta de la suerte bate su récord de gajos en una tarde','El tiempo: sol en casi toda España y alguna nube en el norte','Deportes: el equipo azul gana al naranja en la final de El Pulsador','Cultura: abre un museo dedicado a los concursos de la tele'];
const JOKES=['—¿Has visto mi rosco? —¿El de la merienda o el de Pasapalabra?','—Pasapalabra. —¡Pero si solo te he dicho buenos días!','—Me he apuntado a un concurso. —¿De qué? —De quién duerme más la siesta.','—¿Por qué la letra Ñ nunca se pierde? —¡Porque siempre lleva su gorrito!','—Cariño, ¿qué hay de cena? —Una de cuatro: tortilla, tortilla, tortilla o tortilla.'];
let cntT=null;
function render(p,noAuto){const sc=$('.scr');clearInterval(cntT);const ib=(p.inv||p.ph)?`<div class="invb">${INV} · contenido provisional</div>`:'';
 if(p.k=='news'){const dep=p.sub=='dep';sc.innerHTML=`<div class="cnt news"><div class="anchor"></div><div class="desk"></div><div class="lt">${dep?'DEPORTES · EL TIEMPO':p.t.toUpperCase()}</div><div class="tk"><span>${HEAD.map(h=>'● '+h).join('   ')}   (titulares ${INV})</span></div>${ib}</div>`;
  let i=0;const lt=sc.querySelector('.lt');cntT=setInterval(()=>{i=(i+1)%HEAD.length;lt.textContent=HEAD[i].toUpperCase();},6000);}
 else if(p.k=='series'){sc.innerHTML=`<div class="cnt series"><div class="sofa"></div><div class="p1"></div><div class="p2"></div><div class="bub"></div><div class="laugh">(risas enlatadas)</div><div style="position:absolute;top:4%;left:0;right:0;text-align:center;color:#3a1a00;font-weight:900;font-size:3vmin;top:auto;bottom:2%">${p.t} · ${p.ep||''}</div>${ib}</div>`;
  let i=0;const b=sc.querySelector('.bub');b.textContent=JOKES[0];cntT=setInterval(()=>{i=(i+1)%JOKES.length;b.textContent=JOKES[i];},5000);}
 else if(p.k=='film'){sc.innerHTML=`<div class="cnt film"><div class="sc"><div class="moon"></div><div class="ring"></div><div class="ttl" style="position:absolute;top:8%;left:0;right:0">${p.t.replace(/^.*?: /,'')}</div><div class="syn">${p.syn||''}</div></div>${ib}</div>`;}
 else if(p.k=='music'){sc.innerHTML=`<div class="cnt music"><div class="eq">${[...Array(12)].map((_,i)=>`<i style="animation-delay:${(i*.13)%1}s"></i>`).join('')}</div><div class="ttl">${p.t}</div>${ib}</div>`;}
 else{const can=p.rec&&CFG.hooks.canPlay&&CFG.hooks.canPlay(p);sc.innerHTML=`<div class="cnt game">${p.logo?`<img class="lg" src="${img(p.logo)}">`:''}<div class="ttl">${p.t}</div><div class="sub">${can?'Recreación 3D del programa (vídeos de Iker) · empieza enseguida':'Concurso · aquí irá el programa cuando esté hecho'}</div>${can?'':ib}${can&&noAuto?'<div class="row" style="justify-content:center;margin-top:2vmin"><button class="y" data-k="replay">▶ Ver otra vez</button><button data-k="guia">📋 Guía</button></div>':''}</div>`;
  if(can&&!noAuto){setTimeout(()=>{if(watchSlot===p&&opened&&!playing3D)play3D(p);},2500);}}}
async function play3D(p){if(!p||playing3D)return;stopped=false;playing3D=true;R.classList.add('over');try{await CFG.hooks.play(p);}catch(e){console.error(e);}playing3D=false;if(!opened)return;R.classList.remove('over');p._n=(p._n||0)+1;
 const n=nowMin();if(watchSlot===p){let mm=n;if(mm<p.s)mm+=1440;if(live&&!stopped&&mm>=p.e)tune(slotAt(S.ch,n));else render(p,stopped);}}
function tune(p){watchSlot=p;render(p);refreshTag();const m=$('.mosca img');m.src=img(chan().logo||'aps');}
// ---------------- abrir / cerrar ----------------
function open(){load();build();opened=true;R.style.display='block';R.classList.remove('over');pane(null);live=true;const p=slotAt(S.ch,nowMin());tune(p);
 show($('.mosca'),S.anim.mosca,null);show($('.htag'),S.anim.tag,tagText());pokeBar();
 clearInterval(promoT);promoT=setInterval(()=>{if(opened)promoCycle();},Math.max(15,S.promoEvery)*1000);setTimeout(()=>{if(opened)promoCycle();},4000);
 clearInterval(clockT);clockT=setInterval(()=>{if(!opened||playing3D||!watchSlot||!live)return;let mm=nowMin();if(mm<watchSlot.s)mm+=1440;if(mm>=watchSlot.e&&!$('.pane').classList.contains('on'))tune(slotAt(S.ch,nowMin()));},20000);}
function close(){opened=false;clearInterval(promoT);clearInterval(clockT);clearInterval(cntT);if(R){R.style.display='none';$('.scr').innerHTML='';}try{CFG.hooks.onClose&&CFG.hooks.onClose();}catch(e){}}
window.AntenaPS={version:'1.0',INV,init(o){Object.assign(CFG,o||{});if(o&&o.hooks)CFG.hooks=o.hooks;load();return this;},open,close,addChannel(c){CHANNELS.push(c);},channels:CHANNELS,grid,slotAt,
 anim:{show,hide,FX,LFX},get state(){return S;},isOpen:()=>opened,markStopped:()=>{stopped=true;},is3D:()=>playing3D,_tune:p=>{live=false;tune(p);},_pane:p=>pane(p),_promo:promoCycle,_preview:preview};
})();
