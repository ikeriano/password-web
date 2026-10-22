import * as THREE from '../lib/three.module.min.js';
const $=id=>document.getElementById(id);
// ---------------- Opciones ----------------
const DEF={mus:0.7,fx:0.9,voz:1,subs:true,gruas:true,calidad:'baja',reflejo:true,ritmo:5};
const OP=Object.assign({},DEF,JSON.parse(localStorage.getItem('pw_opciones')||'{}'));
const guardar=()=>localStorage.setItem('pw_opciones',JSON.stringify(OP));
// ---------------- Audio (sonidos ORIGINALES del Scratch) ----------------
const AC=new (window.AudioContext||window.webkitAudioContext)();
const gM=AC.createGain(),gF=AC.createGain();gM.connect(AC.destination);gF.connect(AC.destination);
const aplicaVol=()=>{gM.gain.value=OP.mus;gF.gain.value=OP.fx;};aplicaVol();
const SND={};let musica=null;
async function cargaSonidos(){const P=await (await fetch('sb/project.json')).json();const js=[];
  for(const t of P.targets)for(const s of t.sounds)if(!SND[s.name]){SND[s.name]=null;js.push(fetch('sb/'+s.md5ext).then(r=>r.arrayBuffer()).then(b=>new Promise(ok=>AC.decodeAudioData(b,x=>{SND[s.name]=x;ok();},()=>ok()))));}
  await Promise.all(js);}
function sfx(n,mus){const b=SND[n];if(!b)return null;const s=AC.createBufferSource();s.buffer=b;s.connect(mus?gM:gF);s.start();return s;}
function musicaOn(n,loop=true){musicaOff();const s=sfx(n,true);if(s){s.loop=loop;musica=s;}}
function musicaOff(){if(musica){try{musica.stop()}catch(e){}musica=null;}}
document.addEventListener('pointerdown',()=>{if(AC.state!=='running')AC.resume();},true);
// ---------------- Voz TTS ----------------
let vozA=null;
function di(k,bajo){return new Promise(ok=>{if(vozA){vozA.pause();vozA=null;}const t=window.FRASES[k]||'';
  if(OP.subs){$('subTxt').textContent=t;$('sub').classList.remove('oculto');$('sub').classList.toggle('bajo',!!bajo);}
  const a=new Audio('voz/'+k+'.ogg');a.volume=OP.voz;vozA=a;let fin=false;const end=()=>{if(fin)return;fin=true;if(vozA===a){$('sub').classList.add('oculto');}ok();};
  a.onended=end;a.onerror=()=>setTimeout(end,Math.max(1500,t.length*60));a.play().catch(()=>setTimeout(end,Math.max(1500,t.length*60)));
  presentadorHabla=true;a.addEventListener('ended',()=>presentadorHabla=false);});}
function callar(){if(vozA){vozA.pause();vozA=null;}$('sub').classList.add('oculto');presentadorHabla=false;}
let presentadorHabla=false;
// ---------------- Plató 3D (inspirado en el de Antena 3) ----------------
const cv=$('plato');
const R=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'low-power'});
const escena=new THREE.Scene();escena.background=new THREE.Color(0x020414);escena.fog=new THREE.Fog(0x020414,30,70);
const cam=new THREE.PerspectiveCamera(50,1,0.1,120);
function tam(){const pr=OP.calidad==='alta'?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,1)*0.75;R.setPixelRatio(pr);R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
addEventListener('resize',tam);
const mundo=new THREE.Group();escena.add(mundo);
escena.add(new THREE.AmbientLight(0x6070c0,0.9));const dl=new THREE.DirectionalLight(0xffffff,0.9);dl.position.set(3,10,8);escena.add(dl);
const M=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const B=(c,o={})=>new THREE.MeshBasicMaterial(Object.assign({color:c},o));
function caja(w,h,d,m,x,y,z,p=mundo){const k=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);k.position.set(x,y,z);p.add(k);return k;}
function texCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return {c,x:c.getContext('2d'),t};}
// suelo y fondo
const sueloTex=texCanvas(256,256);{const x=sueloTex.x,g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(40,60,160,0.55)');g.addColorStop(1,'rgba(4,8,30,0.92)');x.fillStyle=g;x.fillRect(0,0,256,256);x.strokeStyle='rgba(120,170,255,0.5)';x.lineWidth=2;for(let r=30;r<128;r+=24){x.beginPath();for(let i=0;i<=8;i++){const a=i/8*Math.PI*2+Math.PI/8;x.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r);}x.stroke();}sueloTex.t.needsUpdate=true;}
const suelo=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({map:sueloTex.t,transparent:true,opacity:0.86}));suelo.rotation.x=-Math.PI/2;escena.add(suelo);
const sueloOscuro=new THREE.Mesh(new THREE.PlaneGeometry(40,40),B(0x01020a));sueloOscuro.rotation.x=-Math.PI/2;sueloOscuro.position.y=-0.02;
// pared del fondo con líneas de neón azul y marcos octogonales
caja(40,14,0.5,M(0x050a2a),0,7,-12);
function octo(r,col,z,y=5.2,grosor=0.08){const g=new THREE.Group();for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,b=(i+1)/8*Math.PI*2+Math.PI/8;const p1=new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r),p2=new THREE.Vector2(Math.cos(b)*r,Math.sin(b)*r);const L=p1.distanceTo(p2);const m=new THREE.Mesh(new THREE.BoxGeometry(L,grosor,grosor),B(col));m.position.set((p1.x+p2.x)/2,(p1.y+p2.y)/2,0);m.rotation.z=Math.atan2(p2.y-p1.y,p2.x-p1.x);g.add(m);}g.position.set(0,y,z);mundo.add(g);return g;}
const octos=[octo(4.2,0xffffff,-11.6),octo(5.6,0x7fb0ff,-11.65),octo(7.2,0x3060ff,-11.7)];
const neones=[];for(let i=-6;i<=6;i++){if(Math.abs(i)<2)continue;const n=caja(0.08,9,0.08,B(0x2f7bff),i*1.9,5.5,-11.6);n.rotation.z=i*0.06;neones.push(n);}
for(let i=0;i<3;i++)caja(40,0.06,0.06,B(0x2f7bff),0,1+i*0.25,-11.6);
// rayos azules (conos aditivos)
const rayMat=new THREE.MeshBasicMaterial({color:0x3a7bff,transparent:true,opacity:0.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const rayos=[];for(let i=0;i<6;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.4,14,10,1,true),rayMat);c.position.set(-10+i*4,7,-6);c.rotation.z=(i-2.5)*0.12;escena.add(c);rayos.push(c);}
// pantalla central (logo hexagonal morado/dorado)
const pant=texCanvas(512,256);
const pantMesh=new THREE.Mesh(new THREE.PlaneGeometry(6.4,3.2),B(0xffffff,{map:pant.t}));pantMesh.position.set(0,5.2,-11.3);mundo.add(pantMesh);
caja(1.4,3.4,0.2,B(0xff7a00),-4,5.2,-11.35);caja(1.4,3.4,0.2,B(0xff7a00),4,5.2,-11.35);
function dibujaLogo(x,w,h,txt){x.save();x.translate(w/2,h/2);const W=w*0.42,H=h*0.26;x.beginPath();x.moveTo(-W,0);x.lineTo(-W+H,-H);x.lineTo(W-H,-H);x.lineTo(W,0);x.lineTo(W-H,H);x.lineTo(-W+H,H);x.closePath();const g=x.createLinearGradient(0,-H,0,H);g.addColorStop(0,'#8a3ae0');g.addColorStop(1,'#2a0a70');x.fillStyle=g;x.fill();x.lineWidth=8;x.strokeStyle='#f5c542';x.stroke();
  x.font=`800 ${H*0.95}px PixelifyES, monospace`;x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.shadowColor='#ffd040';x.shadowBlur=14;x.fillText(txt||'PASSWORD',0,4);x.restore();}
function pantalla(modo,dato){const x=pant.x;x.fillStyle='#090320';x.fillRect(0,0,512,256);
  if(modo==='logo'){dibujaLogo(x,512,256);}
  else if(modo==='pistas'){x.fillStyle='#f5c542';x.font='700 26px GothicES';x.textAlign='center';x.fillText(dato.tit||'',256,40);dato.p.forEach((t,i)=>{x.fillStyle='#200';x.fillRect(16+i*165,90,150,70);x.strokeStyle='#ff3030';x.lineWidth=4;x.strokeRect(16+i*165,90,150,70);x.fillStyle='#fff';x.font='700 26px PixelifyES';x.fillText(t,91+i*165,135);});}
  else if(modo==='texto'){dibujaLogo(x,512,150);x.fillStyle='#ffe27a';x.font='800 40px PixelifyES';x.textAlign='center';x.fillText(dato,256,215);}
  pant.t.needsUpdate=true;}
// atriles enfrentados con pantallas rojas/naranjas
const atriles=[];
function atril(xp,rot,nombre){const g=new THREE.Group();g.position.set(xp,0,-1);g.rotation.y=rot;mundo.add(g);
  caja(3.2,1.2,1,M(0x0b1440),0,0.6,0,g);caja(3.4,0.08,1.2,B(0x4f8cff),0,1.22,0,g);
  const t=texCanvas(256,64);const s=new THREE.Mesh(new THREE.PlaneGeometry(3,0.9),B(0xffffff,{map:t.t}));s.position.set(0,0.62,0.51);g.add(s);
  const pinta=(pts,act)=>{const x=t.x;const gr=x.createLinearGradient(0,0,0,64);gr.addColorStop(0,act?'#ffb000':'#ff5a00');gr.addColorStop(1,'#a01800');x.fillStyle=gr;x.fillRect(0,0,256,64);x.fillStyle='#fff';x.font='700 20px GothicES';x.textAlign='left';x.fillText(nombre,10,40);x.font='800 36px PixelifyES';x.textAlign='right';x.fillText(String(pts),246,46);t.t.needsUpdate=true;};pinta(0);
  const a={g,pinta};atriles.push(a);return a;}
const atA=atril(-4.2,Math.PI/2.6,'TÚ + LOLA'),atB=atril(4.2,-Math.PI/2.6,'MARCOS + PACO');
// personas sencillas
function persona(col,piel,x,z,ry,alto=1){const g=new THREE.Group();const cuerpo=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.34,1.3*alto,8),M(col));cuerpo.position.y=1.4*alto;g.add(cuerpo);const cab=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8),M(piel));cab.position.y=2.25*alto;g.add(cab);const pel=new THREE.Mesh(new THREE.SphereGeometry(0.23,10,6,0,Math.PI*2,0,1.3),M(0x2a1608));pel.position.y=2.29*alto;g.add(pel);const pier=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.8*alto,6),M(0x111122));pier.position.y=0.4*alto;g.add(pier);g.position.set(x,0,z);g.rotation.y=ry;mundo.add(g);g.userData.cab=cab;return g;}
const pA=[persona(0x2a6bff,0xf1c27d,-5,-1.6,Math.PI/2.6),persona(0xd02a8a,0xe0ac69,-3.6,-0.2,Math.PI/2.6)];
const pB=[persona(0x22aa55,0xf1c27d,5,-1.6,-Math.PI/2.6),persona(0x9a2ad0,0xc68642,3.6,-0.2,-Math.PI/2.6)];
const presentador=persona(0x101010,0xf1c27d,0,-4.6,0,1.05);
// público instanciado en las gradas laterales con barras LED naranjas inclinadas
const pubGeo=new THREE.CylinderGeometry(0.22,0.26,0.9,6);const pubMat=M(0xffffff);
const N=OP.calidad==='alta'?160:90;const pub=new THREE.InstancedMesh(pubGeo,pubMat,N);const mt=new THREE.Matrix4(),col=new THREE.Color();const pubBase=[];
for(let i=0;i<N;i++){const lado=i%2?1:-1;const fila=Math.floor(i/2)%4,k=Math.floor(i/8);const x=lado*(9+fila*1.3),y=0.45+fila*0.7,z=-8+k*1.3;pubBase.push([x,y,z]);mt.makeTranslation(x,y,z);pub.setMatrixAt(i,mt);col.setHSL(Math.random(),0.5,0.45);pub.setColorAt(i,col);}
mundo.add(pub);
for(const l of[-1,1])for(let f=0;f<4;f++){caja(1.2,0.3,16,M(0x0b0f30),l*(9+f*1.3),f*0.7,-1.6);const led=caja(0.06,0.06,16,B(0xff7a00),l*(8.4+f*1.3),f*0.7+0.18,-1.6);}
for(let i=0;i<8;i++)for(const l of[-1,1]){const b=caja(0.12,2.6,0.12,B(0xff6a00),l*(7.6+(i%2)*0.5),1.6,-9+i*2.2);b.rotation.z=l*0.5;}
// reflejo de espejo: copia invertida del mundo bajo el suelo semitransparente
const espejo=new THREE.Group();
function haceEspejo(){espejo.clear();const c=mundo.clone(true);espejo.add(c);espejo.scale.y=-1;escena.add(espejo);escena.add(sueloOscuro);espejo.visible=OP.reflejo;sueloOscuro.position.y=-0.03;}
// grúas: planos de cámara
const PLANOS=[
 {d:[[0,3.2,11],[0,6.5,15]],m:[[0,3,-6],[0,3.4,-8]]},
 {d:[[-12,7,8],[12,7,8]],m:[[0,2,-3],[0,2,-3]]},
 {d:[[8,2.4,2],[6,3,4]],m:[[-4,1.8,-1],[-4,1.8,-1]]},
 {d:[[-8,2.4,2],[-6,3,4]],m:[[4,1.8,-1],[4,1.8,-1]]},
 {d:[[0,1.2,4],[0,2.6,1]],m:[[0,4.6,-11],[0,5,-11]]},
 {d:[[0,12,6],[0,9,10]],m:[[0,0,-3],[0,0,-3]]},
];
let plano=0,tPlano=0,camFija=null,camLibre=false;const v1=new THREE.Vector3(),v2=new THREE.Vector3();
function aPlano(i){plano=i;tPlano=0;}
function camara(dt){if(camLibre)return;
  if(camFija){cam.position.lerp(v1.set(...camFija.p),Math.min(1,dt*2));const m=v2.set(...camFija.m);cam.lookAt(m);return;}
  tPlano+=dt/(OP.gruas?9:1e9);if(tPlano>=1){aPlano((plano+1)%PLANOS.length);}
  const P=PLANOS[plano],k=OP.gruas?(0.5-Math.cos(tPlano*Math.PI)/2):0.5;v1.set(...P.d[0]).lerp(v2.set(...P.d[1]),k);cam.position.copy(v1);v1.set(...P.m[0]).lerp(v2.set(...P.m[1]),k);cam.lookAt(v1);}
// cámara libre (arrastrar)
let yaw=0,pitch=0.25,dist=16,arr=null;
cv.addEventListener('pointerdown',e=>{if(camLibre)arr=[e.clientX,e.clientY];});addEventListener('pointerup',()=>arr=null);
cv.addEventListener('pointermove',e=>{if(!arr)return;yaw-= (e.clientX-arr[0])*0.006;pitch=Math.max(0.03,Math.min(1.3,pitch+(e.clientY-arr[1])*0.004));arr=[e.clientX,e.clientY];});
cv.addEventListener('wheel',e=>{dist=Math.max(5,Math.min(28,dist+e.deltaY*0.01));});
let reloj3=new THREE.Clock(),pausa3=false,tAcc=0;
function bucle(){requestAnimationFrame(bucle);if(pausa3)return;const dt=Math.min(reloj3.getDelta(),0.1);tAcc+=dt;
  if(camLibre){cam.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,1+Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist-2);cam.lookAt(0,2,-3);}else camara(dt);
  octos.forEach((o,i)=>o.rotation.z=Math.sin(tAcc*0.3+i)*0.05);rayos.forEach((r,i)=>r.rotation.z=Math.sin(tAcc*0.5+i)*0.25);
  presentador.userData.cab.position.y=2.36+(presentadorHabla?Math.abs(Math.sin(tAcc*12))*0.03:0);
  if(espejo.visible&&espejo.children[0]){const c=espejo.children[0];c.children.forEach((ch,i)=>{const o=mundo.children[i];if(o){ch.position.copy(o.position);ch.rotation.copy(o.rotation);}});}
  R.render(escena,cam);}
// ---------------- Pantallas de la app ----------------
const vistas=['menu','clasico','hud','panel'];
function ver(v){vistas.forEach(x=>$(x).classList.toggle('oculto',x!==v));}
function panel(tit,html,alCerrar){$('pTit').textContent=tit;$('pCuerpo').innerHTML=html;ver('panel');$('pCerrar').onclick=()=>{callar();alCerrar?alCerrar():aMenu();};}
function aMenu(){$('panel').classList.remove('hist');callar();musicaOff();camFija=null;camLibre=false;stopProg();pantalla('logo');ver('menu');pausa3=false;musicaOn('Trilha');}
// ---- Clásico (el Scratch de Iker) ----
let eng=null;
async function clasico(){musicaOff();ver('clasico');pausa3=true;if(!eng){eng=new ScratchEngine($('sc'),{ac:AC,vMus:OP.mus,vFx:OP.fx});await eng.load();window.__eng=eng;}eng.setVol(OP.mus,OP.fx);eng.running=false;eng.start();}
$('scSalir').onclick=()=>{if(eng)eng.stop();aMenu();};
// ---- Historia ----
async function historia(){ver('panel');$('panel').classList.add('hist');$('pTit').textContent='La historia de Password';$('pCuerpo').innerHTML='<p>Escucha al presentador. Las frases son voz sintética <span class="tts">🔊 TTS</span>.</p><p id="hTxt"></p>';
  let vivo=true;$('pCerrar').onclick=()=>{vivo=false;aMenu();};musicaOff();
  const planos=[{p:[0,3,4],m:[0,2.2,-4.6]},{p:[0,5,9],m:[0,5,-11]},{p:[-9,5,6],m:[0,2,-3]},{p:[8,2.5,2],m:[-4,1.8,-1]},{p:[0,2.6,2],m:[0,5.2,-11]},{p:[0,11,8],m:[0,0,-3]}];
  for(let i=1;i<=11&&vivo;i++){camFija=planos[i%planos.length];if(i===4)pantalla('texto','CUATRO · 2008');else if(i===9)pantalla('texto','ANTENA 3 · 2023');else if(i===10)pantalla('texto','MEGA SENHA');else pantalla('logo');
    $('hTxt').textContent='Parte '+i+' de 11';await di('h'+i,true);}
  if(vivo){$('hTxt').textContent='¡Fin! Pulsa «Volver».';}}
// ---- Reglas / créditos / opciones ----
function reglas(){panel('Reglas',`<p><b>Clásico</b>: el juego de Scratch de Iker, igual que el original. Ronda clasificatoria: acierta 5 palabras. Después, 6 rondas con cada vez menos intentos (10, 9, 8, 7, 6 y 5) hasta 1 MILLÓN. Cada palabra tiene 3 pistas; escribe la respuesta con el teclado y pulsa CONFIRMAR.</p>
<p><b>Programa 3D</b> (reglas del Password de España):</p><ul><li>Dos parejas: un concursante y un famoso. Uno ve la palabra secreta y da pistas de <b>una sola palabra</b>; el otro la adivina.</li><li>Prohibido dar pistas de la misma familia (para «abrazar» no vale «brazo»).</li><li>Ronda clasificatoria: 4 turnos de 30 segundos, hasta 5 passwords por turno. Acertar con la 1.ª pista da 10 puntos, con la 2.ª 8 y con la 3.ª 6.</li><li>Ronda final: 90 segundos por nivel, máximo 3 pistas por palabra. 5 de 10 → 500 €, 5 de 9 → 1.000 €, 5 de 8 → 2.500 € (seguro), 5 de 7 → 5.000 €, 5 de 6 → 7.500 €, 5 de 5 → bote de 30.000 €. Tras cada nivel puedes plantarte.</li></ul>`);}
function creditos(){panel('Créditos',`<p><b>Juego original</b>: «Mega Senha - Jogo», proyecto de Scratch de Iker (ikeriano). Gráficos, sonidos y música originales de ese proyecto.</p><p><b>Traducción al castellano y versión 3D</b>: hecha para Iker por Grok Bot.</p><p><b>Voz del presentador</b>: voz sintética <span class="tts">🔊 TTS</span> (Piper, es_ES davefx).</p><p><b>Formato</b>: Password (CBS, 1961). En España: Cuatro (2008-2010, Luján Argüelles y Ana Milán) y Antena 3 (2023, Cristina Pedroche). Mega Senha: RedeTV! (2010). Esta app es un juego de fans sin relación con las cadenas.</p><p>3D: three.js. Fuentes: Pixelify Sans, Gothic A1.</p>`);}
function opciones(){const sl=(k,t)=>`<div class="op"><span>${t}</span><input type="range" min="0" max="1" step="0.05" data-k="${k}" value="${OP[k]}"></div>`;const ck=(k,t)=>`<div class="op"><span>${t}</span><input type="checkbox" data-k="${k}" ${OP[k]?'checked':''}></div>`;
  panel('Opciones',sl('mus','Volumen de la música')+sl('fx','Volumen de los efectos')+sl('voz','Volumen de la voz')+ck('subs','Subtítulos del presentador')+ck('gruas','Cámaras grúa en movimiento')+ck('reflejo','Reflejo del suelo (espejo)')+`<div class="op"><span>Calidad gráfica</span><select data-k="calidad"><option value="baja">Baja (recomendada en Redmi A2)</option><option value="alta">Alta</option></select></div><div class="op"><span>Segundos entre pistas (Programa)</span><input type="range" min="3" max="9" step="1" data-k="ritmo" value="${OP.ritmo}"></div><p><button id="opReset">Restablecer</button></p>`);
  const c=$('pCuerpo');c.querySelector('select').value=OP.calidad;
  c.querySelectorAll('[data-k]').forEach(e=>e.oninput=e.onchange=()=>{const k=e.dataset.k;OP[k]=e.type==='checkbox'?e.checked:e.type==='range'?+e.value:e.value;guardar();aplicaVol();espejo.visible=OP.reflejo;if(k==='calidad')tam();});
  $('opReset').onclick=()=>{Object.assign(OP,DEF);guardar();aplicaVol();espejo.visible=OP.reflejo;tam();opciones();};}
function camaraLibre(){camLibre=true;ver('hud');['marcador','pistas','resp','teclado','opciones3','escalera'].forEach(i=>$(i).classList.add('oculto'));$('hudSalir').onclick=aMenu;}
// ---------------- Programa (reglas de España) ----------------
const espera=ms=>new Promise(r=>setTimeout(r,ms));let progVivo=0;
function stopProg(){progVivo++;clearInterval(relojInt);}
let relojInt=null;
function barajar(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
let mazo=[];function palabra(){if(!mazo.length)mazo=barajar(window.PALABRAS);return mazo.pop();}
function pistas(arr,abiertas,secreta){const p=$('pistas');p.innerHTML='';if(secreta){const d=document.createElement('div');d.className='secreta';d.textContent=secreta;p.appendChild(d);}arr.forEach((t,i)=>{const d=document.createElement('div');d.textContent=i<abiertas?t:'·';if(i>=abiertas)d.className='cerrada';p.appendChild(d);});}
let teclaCb=null,txt='';
function teclado(on){const T=$('teclado');T.classList.toggle('oculto',!on);$('resp').classList.toggle('oculto',!on);$('opciones3').classList.add('oculto');if(!on)return;txt='';$('resp').textContent='';
  if(!T.children.length){['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach(f=>{const r=document.createElement('div');r.className='fila';for(const ch of f){const b=document.createElement('button');b.textContent=ch;b.onclick=()=>tecla(ch);r.appendChild(b);}T.appendChild(r);});
    const r=document.createElement('div');r.className='fila';[['BORRAR','<'],['PASAR','>'],['CONFIRMAR','=']].forEach(([n,c])=>{const b=document.createElement('button');b.className='ancho'+(c==='='?' ok':'');b.textContent=n;b.onclick=()=>tecla(c);r.appendChild(b);});T.appendChild(r);}}
function tecla(c){if(c==='<'){txt=txt.slice(0,-1);sfx('saltar');}else if(c==='='||c==='>'){teclaCb&&teclaCb(c==='>'?null:txt);txt='';}else if(txt.length<12){txt+=c;sfx('saltar');}$('resp').textContent=txt;}
addEventListener('keydown',e=>{if($('teclado').classList.contains('oculto'))return;if(/^[a-zA-Z]$/.test(e.key))tecla(e.key.toUpperCase());else if(e.key==='Backspace')tecla('<');else if(e.key==='Enter')tecla('=');});
function opcionesBotones(lst){const o=$('opciones3');o.innerHTML='';o.classList.remove('oculto');$('teclado').classList.add('oculto');$('resp').classList.add('oculto');return new Promise(ok=>lst.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{o.classList.add('oculto');ok(i);};o.appendChild(b);}));}
function cuenta(s,cb){clearInterval(relojInt);let t=s;$('reloj').textContent=t;relojInt=setInterval(()=>{t--;$('reloj').textContent=Math.max(0,t);if(t<=5&&t>0)sfx('Gc1');if(t<=0){clearInterval(relojInt);cb();}},1000);return()=>t;}
const azar=a=>a[Math.floor(Math.random()*a.length)];
let pts=[0,0];function marcador(){$('ptA').textContent=pts[0];$('ptB').textContent=pts[1];atA.pinta(pts[0]);atB.pinta(pts[1]);}
// un turno de clasificatoria: modo 'adivinas' | 'pistas' | 'rival'
function turno(modo,id){return new Promise(async fin=>{let acabado=false,n=0;const salir=()=>{if(acabado)return;acabado=true;clearInterval(relojInt);teclaCb=null;fin();};
  $('eqA').classList.toggle('activo',modo!=='rival');$('eqB').classList.toggle('activo',modo==='rival');
  cuenta(30,()=>{sfx('Erro');salir();});musicaOn(Math.random()<.5?'SuspenseF1':'SuspenseF2');
  while(!acabado&&n<5&&id===progVivo){n++;const w=palabra();let k=1,ok=false;
    if(modo==='adivinas'){camFija={p:[0,3.4,7],m:[0,3.6,-8]};teclado(true);pistas(w.c,1);pantalla('pistas',{tit:'Lola da las pistas',p:[w.c[0],'','']});
      ok=await new Promise(res=>{let tmo;const sig=()=>{tmo=setTimeout(()=>{if(acabado)return res(false);if(k<3){k++;pistas(w.c,k);pantalla('pistas',{tit:'Lola da las pistas',p:w.c.map((c,i)=>i<k?c:'')});sig();}else res(false);},OP.ritmo*1000);};sig();
        const chk=setInterval(()=>{if(acabado){clearInterval(chk);clearTimeout(tmo);res(false);}},200);
        teclaCb=r=>{if(r===null){clearTimeout(tmo);clearInterval(chk);sfx('Pass');res(false);return;}if(r.toLowerCase()===w.p.toLowerCase()){clearTimeout(tmo);clearInterval(chk);res(true);}else{sfx('Erro');if(k<3){k++;pistas(w.c,k);clearTimeout(tmo);sig();}else{clearTimeout(tmo);clearInterval(chk);res(false);}}};});}
    else if(modo==='pistas'){camFija={p:[-1,2.6,3],m:[-4.2,1.8,-1]};pistas([],0,w.p);pantalla('texto',w.p);
      const usadas=[];for(k=1;k<=3&&!acabado;k++){const libres=w.c.filter(c=>!usadas.includes(c));const i=await opcionesBotones(acabado?[]:libres.map(c=>'Pista: '+c));if(acabado)break;usadas.push(libres[i]);pistas(usadas,usadas.length,w.p);await espera(1200);
        if(Math.random()<[0.5,0.72,0.92][k-1]){ok=true;break;}else{sfx('Erro');}}}
    else{camFija={p:[1,2.6,3],m:[4.2,1.8,-1]};teclado(false);$('opciones3').classList.add('oculto');for(k=1;k<=3&&!acabado;k++){pistas(w.c,k);pantalla('pistas',{tit:'Paco da las pistas',p:w.c.map((c,i)=>i<k?c:'')});await espera(OP.ritmo*600);if(acabado)break;if(Math.random()<[0.4,0.6,0.85][k-1]){ok=true;break;}else sfx('Erro');}}
    if(acabado||id!==progVivo)break;
    if(ok){const p=[10,8,6][k-1];pts[modo==='rival'?1:0]+=p;marcador();sfx('Acerto');pistas(w.c,3,w.p);pantalla('texto',w.p);if(modo!=='rival')di(azar(['ok1','ok2','ok3']));await espera(1300);}
    else{pistas(w.c,3,w.p);pantalla('texto',w.p);if(modo!=='rival'&&Math.random()<.5)di(azar(['ko1','ko2','ko3']));await espera(1300);}}
  salir();});}
async function programa(){const id=++progVivo;pts=[0,0];marcador();ver('hud');['marcador','pistas','resp'].forEach(i=>$(i).classList.remove('oculto'));teclado(false);$('escalera').classList.add('oculto');$('hudSalir').onclick=aMenu;pistas([],0);
  musicaOff();sfx('Intro',true);pantalla('logo');camFija={p:[0,3,6],m:[0,2.2,-4.6]};await di('intro');if(id!==progVivo)return;await di('pareja');if(id!==progVivo)return;await di('reglas');
  const R4=[['r1','adivinas'],['r2','rival'],['r3','pistas'],['r4','rival']];
  for(const[f,m]of R4){if(id!==progVivo)return;sfx('Nova Rodada',true);camFija={p:[0,3,6],m:[0,2.2,-4.6]};pantalla('logo');await di(f);if(id!==progVivo)return;await turno(m,id);musicaOff();teclado(false);}
  if(id!==progVivo)return;
  if(pts[0]===pts[1]){await di('empate');if(id!==progVivo)return;await turno('adivinas',id);if(pts[0]===pts[1])pts[1]+=1;marcador();}
  if(id!==progVivo)return;camFija={p:[0,3,6],m:[0,2.2,-4.6]};
  if(pts[0]>pts[1]){sfx('Vence a Rodada',true);await di('gana_clas');if(id!==progVivo)return;final(id);}else{sfx('FimDeJogo');await di('pierde_clas');if(id!==progVivo)return;await di('adios');if(id===progVivo)aMenu();}}
const NIV=[[10,500],[9,1000],[8,2500],[7,5000],[6,7500],[5,30000]];
const eur=n=>n.toLocaleString('es-ES').replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' €';
function escalera(act,ok){const e=$('escalera');e.classList.remove('oculto');e.innerHTML=NIV.map(([n,v],i)=>`<div class="${i===act?'act':''} ${i<ok?'ok':''} ${i===2?'seg':''}">5/${n} · ${i===5?'BOTE ':''}${eur(v)}</div>`).join('');}
async function final(id){$('marcador').classList.add('oculto');await di('final');let ganado=0,seguro=0;
  for(let L=0;L<NIV.length;L++){if(id!==progVivo)return;escalera(L,L);const[nw,val]=NIV[L];let ac=0,usadas=0,fin=false;sfx('Nova Rodada',true);musicaOn('Trilha');
    const tmr=new Promise(r=>cuenta(90,()=>{fin=true;r();}));$('marcador').classList.remove('oculto');$('eqA').classList.add('activo');$('eqB').classList.remove('activo');$('ptA').textContent='0/5';$('ptB').textContent=(nw)+' pal.';
    while(!fin&&ac<5&&usadas<nw&&nw-usadas>=5-ac&&id===progVivo){usadas++;$('ptB').textContent=(nw-usadas)+' quedan';const w=palabra();let k=1;camFija={p:[0,3.4,7],m:[0,3.6,-8]};teclado(true);pistas(w.c,1);pantalla('pistas',{tit:eur(val),p:[w.c[0],'','']});
      const ok=await new Promise(res=>{const chk=setInterval(()=>{if(fin||id!==progVivo){clearInterval(chk);res(false);}},200);teclaCb=r=>{if(r===null){clearInterval(chk);sfx('Pass');res(false);return;}if(r.toLowerCase()===w.p.toLowerCase()){clearInterval(chk);res(true);}else{sfx('Erro');if(k<3){k++;pistas(w.c,k);pantalla('pistas',{tit:eur(val),p:w.c.map((c,i)=>i<k?c:'')});}else{clearInterval(chk);res(false);}}};});
      teclaCb=null;if(ok){ac++;$('ptA').textContent=ac+'/5';sfx('Acerto');}pistas(w.c,3,w.p);await espera(700);}
    clearInterval(relojInt);teclado(false);musicaOff();if(id!==progVivo)return;camFija={p:[0,3,6],m:[0,2.2,-4.6]};
    if(ac<5){sfx('FimDeJogo');pantalla('texto',eur(seguro));await di('pierde');if(id!==progVivo)return;return finFinal(seguro,id);}
    ganado=val;if(L===2)seguro=val;escalera(L+1,L+1);pantalla('texto',eur(val));
    if(L===5){musicaOn('Vence',false);await di('bote');return finFinal(ganado,id);}
    sfx('Vence a Rodada',true);await di(L===2?'seguro':'nivel');if(id!==progVivo)return;
    const d=await opcionesBotones(['Seguir jugando','Plantarse con '+eur(val)]);if(d===1){sfx('Vence',true);await di('planta');return finFinal(ganado,id);}}}
async function finFinal(premio,id){if(id!==progVivo)return;pantalla('texto',eur(premio));pistas([],0);$('pistas').innerHTML=`<div class="secreta">PREMIO: ${eur(premio)}</div>`;await di('adios');if(id!==progVivo)return;await espera(1500);if(id===progVivo)aMenu();}
// ---------------- Arranque ----------------
document.querySelectorAll('#menuBtns button').forEach(b=>b.onclick=()=>{sfx('Gc2');({clasico,programa,historia,reglas,opciones,creditos,camara:camaraLibre})[b.dataset.a]();});
(async()=>{tam();await document.fonts.load('800 40px PixelifyES').catch(()=>{});await document.fonts.load('20px GothicES').catch(()=>{});pantalla('logo');haceEspejo();aPlano(0);bucle();
  $('cargaBar').style.width='40%';await cargaSonidos();$('cargaBar').style.width='100%';$('carga').classList.add('oculto');aMenu();})();
window.__pw={ver,programa,historia,opciones,clasico,aMenu,OP};
