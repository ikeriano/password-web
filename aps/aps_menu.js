/* AntenaPlayStation 🆕 INVENTADO – entrada de menú genérica */
(function(){
 function boot(){
  if(!window.AntenaPS)return;
  AntenaPS.init({base:'aps/',game:document.title||'Juego de Iker',hooks:{canPlay:function(){return false},play:function(){return Promise.resolve()},stop:function(){},onClose:function(){var x=document.getElementById('apsMenuBtn');if(x)x.style.visibility='';}}});
  var b=document.createElement('button');b.id='apsMenuBtn';b.type='button';
  b.innerHTML='📺 AntenaPlayStation <span style="font-size:.7em;background:#ffcc00;color:#222;border-radius:6px;padding:1px 5px;margin-left:4px">🆕 INVENTADO</span>';
  b.onclick=function(e){e.stopPropagation();b.style.visibility='hidden';AntenaPS.open();};
  // busca el menú principal: contenedor con más botones visibles
  var best=null,n=0;document.querySelectorAll('div,nav,section,ul').forEach(function(d){var c=d.querySelectorAll(':scope>button,:scope>a,:scope>.btn,:scope>li').length;if(c>n&&d.offsetParent!==null){n=c;best=d;}});
  if(best&&n>=2){var ref=best.querySelector(':scope>button,:scope>.btn,:scope>a');if(ref)b.className=ref.className;best.appendChild(b);}
  else{b.style.cssText='position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:99990;padding:10px 16px;font:bold 16px sans-serif;border:0;border-radius:12px;background:#1d4ed8;color:#fff;box-shadow:0 2px 8px #0008';document.body.appendChild(b);}
 }
 if(document.readyState==='complete')setTimeout(boot,300);else window.addEventListener('load',function(){setTimeout(boot,300)});
})();
