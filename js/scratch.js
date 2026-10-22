// Mini intérprete de Scratch 3 para «Mega Senha - Jogo» (proyecto de Iker), en español.
// Ejecuta el project.json ORIGINAL (mismos bloques, mismos tiempos, mismos sonidos) con los disfraces traducidos.
(function(){
const BASE='sb/';
function num(v){ const n=Number(v); return isNaN(n)?0:n; }
function isWS(s){ return typeof s==='string' && s.trim()===''; }
function cmp(a,b){ let n1=Number(a),n2=Number(b); if(isNaN(n1)||isNaN(n2)||isWS(a)||isWS(b)){ const s1=String(a).toLowerCase(),s2=String(b).toLowerCase(); return s1<s2?-1:s1>s2?1:0;} return n1-n2; }
class Engine{
  constructor(canvas,opts){ this.cv=canvas; this.ctx=canvas.getContext('2d'); this.o=opts||{}; this.threads=[]; this.vars={}; this.lists={}; this.running=false; this.sprites=[]; this.byName={}; this.bcache=new Map(); }
  async load(onProg){
    const P=await (await fetch(BASE+'project.json')).json(); this.P=P;
    const map=await (await fetch(BASE+'es_map.json')).json();
    const AC=window.AudioContext||window.webkitAudioContext; this.ac=this.o.ac||new AC();
    this.gMus=this.ac.createGain(); this.gFx=this.ac.createGain(); this.gMus.connect(this.ac.destination); this.gFx.connect(this.ac.destination); this.setVol(this.o.vMus??0.8,this.o.vFx??0.9);
    const imgP={}, sndP={}; const loadImg=f=>imgP[f]||(imgP[f]=new Promise(r=>{const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=BASE+f;}));
    const loadSnd=f=>sndP[f]||(sndP[f]=fetch(BASE+f).then(r=>r.arrayBuffer()).then(b=>new Promise((ok)=>this.ac.decodeAudioData(b,ok,()=>ok(null)))));
    let total=0,done=0; const tick=()=>{done++; onProg&&onProg(done/total);};
    const jobs=[];
    for(const t of P.targets){
      const s={name:t.name,t,blocks:t.blocks,isStage:t.isStage,ci:t.currentCostume||0,x:t.x||0,y:t.y||0,size:t.size||100,visible:!!t.visible,layer:t.layerOrder||0,fx:{ghost:0,brightness:0},costumes:[],sounds:{},play:{}};
      if(t.isStage){ for(const v in t.variables) this.vars[v]=t.variables[v][1]; for(const l in t.lists) this.lists[l]=t.lists[l][1].slice(); }
      for(const l in (t.lists||{})) if(!t.isStage) this.lists[l]=t.lists[l][1].slice();
      if(t.name==='Palavras'){
        const base=loadImg('pistas_base.png'); total++; jobs.push(base.then(img=>{tick(); s.costumes=window.PALABRAS.map(w=>({name:w.p,clues:w.c,base:img,cx:480,cy:-140,res:2,img:null}));}));
      } else for(const c of t.costumes){
        const k=t.name+'/'+c.name; const f=map[k]||c.md5ext; const co={name:c.name,cx:c.rotationCenterX,cy:c.rotationCenterY,res:c.bitmapResolution||1,img:null};
        s.costumes.push(co); total++; jobs.push(loadImg(f).then(i=>{co.img=i;tick();}));
      }
      for(const so of t.sounds){ total++; jobs.push(loadSnd(so.md5ext).then(b=>{s.sounds[so.name]={buf:b,mus:/Trilha|Suspense|Intro|^Vence$|Nova Rodada|Vence a Rodada/.test(so.name)};tick();})); }
      this.sprites.push(s); this.byName[t.name]=s;
    }
    await Promise.all(jobs);
    this.order=this.sprites.slice().sort((a,b)=>a.layer-b.layer);
  }
  setVol(m,f){ if(this.gMus){this.gMus.gain.value=m; this.gFx.gain.value=f;} }
  clueImg(c){ if(c.img) return c.img; const cv=document.createElement('canvas'); cv.width=c.base.width; cv.height=c.base.height; const x=cv.getContext('2d'); x.drawImage(c.base,0,0);
    x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle'; const cx=[182,481,782];
    c.clues.forEach((t,i)=>{ let fs=40; do{ x.font=`700 ${fs}px PixelifyES, "Pixelify Sans", monospace`; fs--; }while(x.measureText(t).width>250 && fs>14); x.fillText(t,cx[i],74); });
    this._clueLRU=(this._clueLRU||[]); this._clueLRU.push(c); if(this._clueLRU.length>3){ const o=this._clueLRU.shift(); if(o!==c) o.img=null; }
    return c.img=cv; }
  // ---------- hilos ----------
  hats(op,pred){ const r=[]; for(const s of this.sprites) for(const id in s.blocks){ const b=s.blocks[id]; if(b&&b.topLevel&&b.opcode===op&&(!pred||pred(b))) r.push([s,id]); } return r; }
  startHat(s,id){ let th=this.threads.find(t=>t.s===s&&t.top===id&&!t.dead&&!t.done); if(th){ th.gen=this.stack(s,s.blocks[id].next,th); th.wait=null; return th; }
    th={s,top:id,dead:false,done:false}; th.gen=this.stack(s,s.blocks[id].next,th); this.threads.push(th); return th; }
  broadcast(name){ const n=String(name).toLowerCase(); const hs=this.hats('event_whenbroadcastreceived',b=>String(b.fields.BROADCAST_OPTION[0]).toLowerCase()===n); return hs.map(([s,id])=>this.startHat(s,id)); }
  greenFlag(){ this.stopAll(); for(const s of this.sprites){ /* estado inicial del proyecto */ } this.hats('event_whenflagclicked').forEach(([s,id])=>this.startHat(s,id)); }
  stopAll(){ this.threads.forEach(t=>t.dead=true); this.threads=[]; for(const s of this.sprites) for(const k in s.play){ try{s.play[k].stop();}catch(e){} } }
  start(){ if(this.running) return; this.running=true; this.greenFlag(); let acc=0,last=performance.now(); const loop=(now)=>{ if(!this.running) return; acc+=Math.min(now-last,200); last=now; let n=0; while(acc>=1000/30 && n<3){ this.step(); acc-=1000/30; n++; } if(n) this.render(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    this._pd=e=>this.pointer(e); this.cv.addEventListener('pointerdown',this._pd); }
  stop(){ this.running=false; this.stopAll(); this.cv.removeEventListener('pointerdown',this._pd); }
  step(){ this.now=performance.now(); const list=this.threads.slice(); for(const th of list){ if(th.dead||th.done) continue; this.cur=th; const r=th.gen.next(); if(r.done) th.done=true; } this.threads=this.threads.filter(t=>!t.dead&&!t.done); }
  // ---------- evaluación ----------
  inp(s,b,k){ const v=b.inputs[k]; if(!v) return ''; const x=v[1]; if(typeof x==='string') return this.ev(s,s.blocks[x]); if(x==null) return ''; return this.prim(x); }
  prim(x){ switch(x[0]){ case 4:case 5:case 6:case 7:case 8: return x[1]; case 9:case 10: return x[1]; case 11: return x[1]; case 12: return this.vars[x[2]]; case 13: return (this.lists[x[2]]||[]).join(' '); } return ''; }
  menu(s,b,k,f){ const v=b.inputs[k]; if(!v) return ''; const x=v[1]; if(typeof x==='string'){ const mb=s.blocks[x]; if(mb.fields&&mb.fields[f]) return mb.fields[f][0]; return this.ev(s,mb);} return this.prim(x); }
  list(b){ return this.lists[b.fields.LIST[1]]||(this.lists[b.fields.LIST[1]]=[]); }
  idx(v,len){ if(v==='last') return len-1; if(v==='random'||v==='any') return Math.floor(Math.random()*len); const n=Math.floor(num(v)); return n-1; }
  ev(s,b){ if(!b) return ''; switch(b.opcode){
    case 'operator_equals': return cmp(this.inp(s,b,'OPERAND1'),this.inp(s,b,'OPERAND2'))===0;
    case 'operator_gt': return cmp(this.inp(s,b,'OPERAND1'),this.inp(s,b,'OPERAND2'))>0;
    case 'operator_not': return !this.bool(this.inp(s,b,'OPERAND'));
    case 'operator_join': return String(this.inp(s,b,'STRING1'))+String(this.inp(s,b,'STRING2'));
    case 'operator_letter_of': { const str=String(this.inp(s,b,'STRING')); const i=num(this.inp(s,b,'LETTER'))-1; return (i<0||i>=str.length)?'':str[i]; }
    case 'operator_random': { const a=this.inp(s,b,'FROM'),c=this.inp(s,b,'TO'); let lo=Math.min(num(a),num(c)),hi=Math.max(num(a),num(c)); if(Number.isInteger(+a)&&Number.isInteger(+c)&&!String(a).includes('.')&&!String(c).includes('.')) return lo+Math.floor(Math.random()*(hi-lo+1)); return lo+Math.random()*(hi-lo); }
    case 'data_itemoflist': { const L=this.list(b); const i=this.idx(this.inp(s,b,'INDEX'),L.length); return (i>=0&&i<L.length)?L[i]:''; }
    case 'data_lengthoflist': return this.list(b).length;
    case 'data_listcontainsitem': { const it=String(this.inp(s,b,'ITEM')).toLowerCase(); return this.list(b).some(x=>String(x).toLowerCase()===it); }
    case 'looks_costumenumbername': return b.fields.NUMBER_NAME[0]==='number'? s.ci+1 : s.costumes[s.ci].name;
    case 'sensing_of': { const on=this.menu(s,b,'OBJECT','OBJECT'); const o=this.byName[on]; const pr=b.fields.PROPERTY[0]; if(!o) return 0; if(pr==='costume name') return o.costumes[o.ci].name; if(pr==='costume #') return o.ci+1; if(pr==='x position') return o.x; if(pr==='y position') return o.y; return 0; }
    case 'looks_costume': return b.fields.COSTUME[0];
    case 'sound_sounds_menu': return b.fields.SOUND_MENU[0];
    case 'event_broadcast_menu': return b.fields.BROADCAST_OPTION[0];
    case 'sensing_of_object_menu': return b.fields.OBJECT[0];
  } return ''; }
  bool(v){ if(typeof v==='boolean') return v; if(v===0||v==='0'||v===''||String(v).toLowerCase()==='false') return false; return true; }
  setCostume(s,v){ const n=s.costumes.length; if(typeof v==='number'){ s.ci=((Math.round(v)-1)%n+n)%n; return; } const sv=String(v); const i=s.costumes.findIndex(c=>c.name===sv); if(i>=0){ s.ci=i; return; }
    if(sv==='next costume'){ s.ci=(s.ci+1)%n; return; } if(sv==='previous costume'){ s.ci=(s.ci-1+n)%n; return; } if(sv.trim()!==''&&!isNaN(Number(sv))){ s.ci=((Math.round(Number(sv))-1)%n+n)%n; } }
  playSound(s,name,th){ const so=s.sounds[name]; if(!so||!so.buf) return 0; if(s.play[name]){ try{s.play[name].stop();}catch(e){} } const src=this.ac.createBufferSource(); src.buffer=so.buf; src.connect(so.mus?this.gMus:this.gFx); src.start(); s.play[name]=src; const tok={end:false}; src.onended=()=>{tok.end=true; if(s.play[name]===src) delete s.play[name];}; return tok; }
  // ---------- ejecución (generadores) ----------
  *stack(s,id,th){ while(id){ const b=s.blocks[id]; yield* this.ex(s,b,th); if(th.dead) return; id=b.next; } }
  *sub(s,b,k,th){ const v=b.inputs[k]; if(v&&typeof v[1]==='string') yield* this.stack(s,v[1],th); }
  *wait(ms){ const end=performance.now()+ms; yield; while(performance.now()<end) yield; }
  *ex(s,b,th){ const E=this; switch(b.opcode){
    case 'motion_gotoxy': s.x=num(E.inp(s,b,'X')); s.y=num(E.inp(s,b,'Y')); break;
    case 'motion_changeyby': s.y+=num(E.inp(s,b,'DY')); break;
    case 'motion_glidesecstoxy': { const d=num(E.inp(s,b,'SECS'))*1000, x0=s.x,y0=s.y,x1=num(E.inp(s,b,'X')),y1=num(E.inp(s,b,'Y')); const t0=performance.now(); if(d<=0){s.x=x1;s.y=y1;break;} yield; for(;;){ const k=(performance.now()-t0)/d; if(k>=1){s.x=x1;s.y=y1;break;} s.x=x0+(x1-x0)*k; s.y=y0+(y1-y0)*k; yield; } break; }
    case 'looks_switchcostumeto': { const v=b.inputs.COSTUME[1]; let val; if(typeof v==='string'){ const mb=s.blocks[v]; val= mb.opcode==='looks_costume'? mb.fields.COSTUME[0] : E.ev(s,mb); } else val=E.prim(v); E.setCostume(s,val); break; }
    case 'looks_nextcostume': s.ci=(s.ci+1)%s.costumes.length; break;
    case 'looks_show': s.visible=true; break; case 'looks_hide': s.visible=false; break;
    case 'looks_seteffectto': { const e=b.fields.EFFECT[0].toLowerCase(); E.setFx(s,e,num(E.inp(s,b,'VALUE'))); break; }
    case 'looks_changeeffectby': { const e=b.fields.EFFECT[0].toLowerCase(); E.setFx(s,e,(s.fx[e]||0)+num(E.inp(s,b,'CHANGE'))); break; }
    case 'looks_setsizeto': s.size=Math.max(0,num(E.inp(s,b,'SIZE'))); break;
    case 'looks_changesizeby': s.size=Math.max(0,s.size+num(E.inp(s,b,'CHANGE'))); break;
    case 'sound_play': E.playSound(s,E.menu(s,b,'SOUND_MENU','SOUND_MENU'),th); break;
    case 'sound_playuntildone': { const tok=E.playSound(s,E.menu(s,b,'SOUND_MENU','SOUND_MENU'),th); if(!tok) break; yield; while(!tok.end){ if(th.dead) return; yield; } break; }
    case 'control_wait': yield* E.wait(num(E.inp(s,b,'DURATION'))*1000); break;
    case 'control_repeat': { const n=Math.round(num(E.inp(s,b,'TIMES'))); for(let i=0;i<n;i++){ yield* E.sub(s,b,'SUBSTACK',th); if(th.dead) return; yield; } break; }
    case 'control_forever': for(;;){ yield* E.sub(s,b,'SUBSTACK',th); if(th.dead) return; yield; }
    case 'control_repeat_until': while(!E.bool(E.inp(s,b,'CONDITION'))){ yield* E.sub(s,b,'SUBSTACK',th); if(th.dead) return; yield; } break;
    case 'control_if': if(E.bool(E.inp(s,b,'CONDITION'))) yield* E.sub(s,b,'SUBSTACK',th); break;
    case 'control_if_else': if(E.bool(E.inp(s,b,'CONDITION'))) yield* E.sub(s,b,'SUBSTACK',th); else yield* E.sub(s,b,'SUBSTACK2',th); break;
    case 'control_stop': { const o=b.fields.STOP_OPTION[0]; if(o==='other scripts in sprite'||o==='other scripts in stage'){ E.threads.forEach(t=>{ if(t.s===s&&t!==th) t.dead=true; }); } else if(o==='all'){ E.stopAll(); } else { th.dead=true; return; } break; }
    case 'event_broadcast': E.broadcast(E.menu(s,b,'BROADCAST_INPUT','BROADCAST_OPTION')); break;
    case 'event_broadcastandwait': { const ts=E.broadcast(E.menu(s,b,'BROADCAST_INPUT','BROADCAST_OPTION')); const gens=ts.map(t=>[t,t.gen]); yield; while(gens.some(([t,g])=>!t.dead&&!t.done&&t.gen===g)) { if(th.dead) return; yield; } break; }
    case 'data_setvariableto': E.vars[b.fields.VARIABLE[1]]=E.inp(s,b,'VALUE'); break;
    case 'data_changevariableby': { const k=b.fields.VARIABLE[1]; E.vars[k]=num(E.vars[k])+num(E.inp(s,b,'VALUE')); break; }
    case 'data_addtolist': E.list(b).push(E.inp(s,b,'ITEM')); break;
    case 'data_deleteoflist': { const L=E.list(b); const v=E.inp(s,b,'INDEX'); if(v==='all'){ L.length=0; break; } const i=E.idx(v,L.length); if(i>=0&&i<L.length) L.splice(i,1); break; }
  } }
  setFx(s,e,v){ if(e==='ghost') v=Math.max(0,Math.min(100,v)); if(e==='brightness') v=Math.max(-100,Math.min(100,v)); s.fx[e]=v; }
  // ---------- dibujo ----------
  costumeImg(c){ return c.clues? this.clueImg(c) : c.img; }
  bright(c,img,v){ v=Math.round(v/10)*10; if(!v) return img; const k=c; let m=this.bcache.get(k); if(!m){ m={}; this.bcache.set(k,m);} if(m[v]) return m[v];
    const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height; const x=cv.getContext('2d'); x.drawImage(img,0,0); x.globalCompositeOperation='source-atop'; x.fillStyle=v>0?`rgba(255,255,255,${v/100})`:`rgba(0,0,0,${-v/100})`; x.fillRect(0,0,cv.width,cv.height); return m[v]=cv; }
  render(){ const c=this.ctx, W=this.cv.width, H=this.cv.height, k=W/480; c.setTransform(1,0,0,1,0,0); c.fillStyle='#000'; c.fillRect(0,0,W,H);
    for(const s of this.order){ if(!s.visible||s.isStage) continue; const g=s.fx.ghost||0; if(g>=100) continue; const co=s.costumes[s.ci]; if(!co) continue; let img=this.costumeImg(co); if(!img) continue;
      if(s.fx.brightness) img=this.bright(co,img,s.fx.brightness);
      const sc=s.size/100/co.res; c.globalAlpha=1-g/100; c.drawImage(img,(240+s.x-co.cx*sc)*k,(180-s.y-co.cy*sc)*k,img.width*sc*k,img.height*sc*k); }
    c.globalAlpha=1; }
  hit(s,px,py){ const co=s.costumes[s.ci]; const img=this.costumeImg(co); if(!img) return false; const sc=s.size/100/co.res; const ix=Math.floor((px-(240+s.x-co.cx*sc))/sc), iy=Math.floor((py-(180-s.y-co.cy*sc))/sc); if(ix<0||iy<0||ix>=img.width||iy>=img.height) return false;
    if(!co.mask){ const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height; const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0); try{ co.mask=x.getImageData(0,0,img.width,img.height).data; }catch(e){ co.mask='x'; } }
    if(co.mask==='x') return true; return co.mask[(iy*img.width+ix)*4+3]>0; }
  pointer(e){ if(this.ac.state!=='running') this.ac.resume(); const r=this.cv.getBoundingClientRect(); const px=(e.clientX-r.left)/r.width*480, py=(e.clientY-r.top)/r.height*360;
    for(let i=this.order.length-1;i>=0;i--){ const s=this.order[i]; if(s.isStage||!s.visible||(s.fx.ghost||0)>=100) continue; if(this.hit(s,px,py)){ this.hats('event_whenthisspriteclicked').filter(([sp])=>sp===s).forEach(([sp,id])=>this.startHat(sp,id)); if(this.o.onClick) this.o.onClick(s.name); return; } } }
}
window.ScratchEngine=Engine;
})();
