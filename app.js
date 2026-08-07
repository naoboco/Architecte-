(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const app = $('#app');
  const toastEl = $('#toast');
  const STORAGE_KEY = 'archi-game-v1';
  const SCALE = 52; // px / m in studio internal canvas
  const GRID = .5;

  const defaultState = {
    xp: 0,
    sound: true,
    completed: [],
    currentMission: 1,
    projects: [],
    studio: null,
  };
  let state = loadState();
  let currentView = 'home';
  let cleanupView = null;

  const missions = [
    {id:1,title:'Une chambre qui respire',desc:'Aménage une chambre avec un lit, un bureau, une porte et une fenêtre.',game:'studio',xp:120},
    {id:2,title:'Le pont du parc',desc:'Relie les deux rives et fais tenir une charge sans gaspiller tes poutres.',game:'structure',xp:140},
    {id:3,title:'Attrape le soleil',desc:'Trouve la meilleure position de fenêtre selon l’heure.',game:'light',xp:110},
    {id:4,title:'Dessine à l’échelle',desc:'Transforme les dimensions réelles d’une pièce en plan au 1:50.',game:'scale',xp:100},
    {id:5,title:'Premier appartement',desc:'Crée salon, chambre, cuisine et salle de bain sur un terrain limité.',game:'studio',xp:180},
  ];

  const exploreData = [
    ['STRUCTURE','TRIANGLES','Pourquoi voit-on autant de triangles dans les ponts ? Parce qu’ils se déforment beaucoup moins facilement qu’un quadrilatère.'],
    ['LUMIÈRE','08:00','Une ouverture à l’est favorise la lumière du matin. Une décision architecturale peut donc commencer avec une simple boussole.'],
    ['PLAN','1:50','À l’échelle 1:50, 1 mètre réel devient 2 cm sur le dessin. Pas de magie : juste une division bien habillée.'],
    ['MATIÈRE','BÉTON','Le béton travaille très bien en compression ; l’acier complète ses faiblesses en traction dans le béton armé.'],
    ['ESPACE','90 cm','Une circulation confortable se pense en dimensions réelles : portes, couloirs, meubles et personnes doivent cohabiter.'],
    ['VILLE','5 MIN','Un quartier agréable dépend aussi de ce qu’on peut rejoindre à pied : école, parc, commerces, transports.'],
    ['HISTOIRE','GOTHIQUE','Arcs brisés et arcs-boutants ont permis de monter plus haut tout en ouvrant de grandes surfaces vitrées.'],
    ['CLIMAT','OMBRE','Créer de l’ombre peut être aussi important que créer de la lumière. Les brise-soleil sont de vrais outils de conception.'],
  ];

  function loadState(){ try{return {...defaultState,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return {...defaultState}} }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateStatus(); }
  function levelInfo(){
    const level = Math.floor(state.xp/250)+1;
    const ranks=['Apprentie','Exploratrice','Dessinatrice','Conceptrice','Architecte junior','Architecte','Architecte en chef'];
    return {level, rank:ranks[Math.min(ranks.length-1,Math.floor((level-1)/2))], current:state.xp%250};
  }
  function updateStatus(){
    const l=levelInfo(); $('#levelLabel').textContent=l.level; $('#rankLabel').textContent=l.rank; $('#xpText').textContent=`${l.current} / 250 XP`; $('#xpFill').style.width=`${(l.current/250)*100}%`;
    $('#soundToggle').textContent=state.sound?'🔊':'🔇';
  }
  function toast(msg){ toastEl.textContent=msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),2300); }
  function beep(freq=520,d=.06){
    if(!state.sound) return;
    try{ const a=new (window.AudioContext||window.webkitAudioContext)(); const o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.035;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.stop(a.currentTime+d+.02);}catch{}
  }
  function award(xp,label='Mission'){ state.xp+=xp; saveState(); beep(720,.1); toast(`${label} · +${xp} XP`); }
  function completeMission(id){ if(!state.completed.includes(id)){ const m=missions.find(x=>x.id===id);state.completed.push(id);state.currentMission=Math.max(state.currentMission,id+1);award(m.xp,'Mission réussie');saveState(); } }

  function renderTemplate(id){ if(cleanupView){cleanupView();cleanupView=null;} const tpl=$(id);app.innerHTML='';app.appendChild(tpl.content.cloneNode(true)); bindCommon(); }
  function bindCommon(){
    $$('[data-nav]',app).forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
    $$('[data-game]',app).forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game)));
  }
  function setNavActive(view){ $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===view)); }
  function navigate(view){
    currentView=view;setNavActive(view);
    if(view==='home') renderHome();
    else if(view==='career') renderCareer();
    else if(view==='studio') renderStudio();
    else if(view==='explore') renderExplore();
    else if(view==='portfolio') renderPortfolio();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderHome(){
    renderTemplate('#homeTemplate');
    $('[data-action="continue-mission"]').addEventListener('click',()=>{
      const m=missions.find(x=>x.id===Math.min(state.currentMission,missions.length))||missions[0];
      if(m.game==='studio') navigate('studio'); else openGame(m.game,m.id);
    });
  }

  function renderCareer(){
    renderTemplate('#careerTemplate');
    const list=$('#missionList');
    missions.forEach(m=>{
      const unlocked=m.id<=state.currentMission || state.completed.includes(m.id), done=state.completed.includes(m.id);
      const el=document.createElement('article');el.className=`mission-card ${done?'completed':''} ${!unlocked?'locked':''}`;
      el.innerHTML=`<div class="mission-index">${done?'✓':String(m.id).padStart(2,'0')}</div><div><span class="eyebrow">${m.xp} XP</span><h3>${m.title}</h3><p>${m.desc}</p></div><button ${!unlocked?'disabled':''}>${done?'Rejouer':'Jouer'}</button>`;
      el.querySelector('button').addEventListener('click',()=>{ if(m.game==='studio') navigate('studio'); else openGame(m.game,m.id); }); list.appendChild(el);
    });
  }

  function initialStudio(){ return {
    rooms:[{id:uid(),type:'room',name:'Salon',x:1,y:1,w:4.5,h:3.5}],
    items:[{id:uid(),type:'window',x:2.2,y:.92,w:1.2,h:.14,rot:0},{id:uid(),type:'sofa',x:2,y:2,w:1.8,h:.8,rot:0}],
    selected:null
  };}
  function uid(){return Math.random().toString(36).slice(2,9)}

  function renderStudio(){
    renderTemplate('#studioTemplate');
    const canvas=$('#studioCanvas'),ctx=canvas.getContext('2d');
    let model=state.studio?JSON.parse(JSON.stringify(state.studio)):initialStudio();
    let drag=null;
    const colors={Salon:'#d8ff53',Chambre:'#b8d7e7',Cuisine:'#f6c88d',SDB:'#d8c7f0'};
    const itemDef={door:{label:'Porte',w:.9,h:.16,color:'#8c5a35'},window:{label:'Fenêtre',w:1.2,h:.14,color:'#6dbbd1'},bed:{label:'Lit',w:2,h:1.4,color:'#bba6d6'},sofa:{label:'Canapé',w:1.8,h:.8,color:'#d78668'},table:{label:'Table',w:1.3,h:.8,color:'#d0a86f'},desk:{label:'Bureau',w:1.2,h:.6,color:'#82976f'}};

    function xy(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
    function toM(p){return {x:(p.x-80)/SCALE,y:(p.y-70)/SCALE}}
    function snap(v){return Math.round(v/GRID)*GRID}
    function roomAt(mx,my){return [...model.rooms].reverse().find(r=>mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h)}
    function itemAt(mx,my){return [...model.items].reverse().find(i=>mx>=i.x&&mx<=i.x+i.w&&my>=i.y&&my<=i.y+i.h)}
    function selectedObj(){return model.rooms.find(x=>x.id===model.selected)||model.items.find(x=>x.id===model.selected)}
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,canvas.width,canvas.height);
      // terrain
      ctx.save();ctx.translate(80,70);ctx.strokeStyle='#d7d2c9';ctx.lineWidth=1;
      for(let x=0;x<=12;x+=.5){ctx.beginPath();ctx.moveTo(x*SCALE,0);ctx.lineTo(x*SCALE,10*SCALE);ctx.stroke()}
      for(let y=0;y<=10;y+=.5){ctx.beginPath();ctx.moveTo(0,y*SCALE);ctx.lineTo(12*SCALE,y*SCALE);ctx.stroke()}
      ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.strokeRect(0,0,12*SCALE,10*SCALE);ctx.restore();
      model.rooms.forEach(r=>{
        const x=80+r.x*SCALE,y=70+r.y*SCALE,w=r.w*SCALE,h=r.h*SCALE;
        ctx.fillStyle=colors[r.name]||'#ddd';ctx.globalAlpha=.66;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;ctx.strokeStyle=r.id===model.selected?'#111':'#555';ctx.lineWidth=r.id===model.selected?4:2;ctx.strokeRect(x,y,w,h);
        ctx.fillStyle='#171717';ctx.font='700 15px system-ui';ctx.fillText(r.name,x+10,y+22);ctx.font='11px system-ui';ctx.fillText(`${r.w.toFixed(1)} × ${r.h.toFixed(1)} m · ${(r.w*r.h).toFixed(1)} m²`,x+10,y+40);
        if(r.id===model.selected){ctx.fillStyle='#171717';ctx.fillRect(x+w-8,y+h-8,16,16)}
      });
      model.items.forEach(i=>{
        const d=itemDef[i.type]||{label:i.type,color:'#999'};const x=80+i.x*SCALE,y=70+i.y*SCALE,w=i.w*SCALE,h=i.h*SCALE;
        ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate((i.rot||0)*Math.PI/180);ctx.fillStyle=d.color;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle=i.id===model.selected?'#111':'#6f6b64';ctx.lineWidth=i.id===model.selected?3:1.5;ctx.strokeRect(-w/2,-h/2,w,h);ctx.fillStyle='#171717';ctx.font='10px system-ui'; if(w>42&&h>20)ctx.fillText(d.label,-w/2+5,4);ctx.restore();
      });
      $('#totalArea').textContent=`${model.rooms.reduce((a,r)=>a+r.w*r.h,0).toFixed(1)} m²`;updateInspector();
    }
    function updateInspector(){
      const o=selectedObj(),box=$('#inspector'); if(!o){box.innerHTML='<span class="eyebrow">INSPECTEUR</span><h3>Sélectionne un élément</h3><p>Ses dimensions et propriétés apparaîtront ici.</p>';return}
      const isRoom=o.type==='room';
      box.innerHTML=`<span class="eyebrow">INSPECTEUR</span><h3>${isRoom?o.name:itemDef[o.type].label}</h3>
      <label>Largeur (m)<input id="propW" type="number" min="0.2" step="0.1" value="${o.w.toFixed(1)}"></label>
      <label>Profondeur (m)<input id="propH" type="number" min="0.1" step="0.1" value="${o.h.toFixed(1)}"></label>
      ${!isRoom?`<label>Rotation<input id="propRot" type="range" min="0" max="360" step="15" value="${o.rot||0}"></label>`:''}
      ${isRoom?`<p>Surface : <b>${(o.w*o.h).toFixed(2)} m²</b></p>`:''}`;
      $('#propW').addEventListener('change',e=>{o.w=Math.max(.2,+e.target.value);persist();draw()});$('#propH').addEventListener('change',e=>{o.h=Math.max(.1,+e.target.value);persist();draw()});
      if($('#propRot')) $('#propRot').addEventListener('input',e=>{o.rot=+e.target.value;persist();draw()});
    }
    function persist(){state.studio=JSON.parse(JSON.stringify(model));saveState()}
    canvas.addEventListener('pointerdown',e=>{
      canvas.setPointerCapture(e.pointerId);const p=toM(xy(e));let o=itemAt(p.x,p.y)||roomAt(p.x,p.y);model.selected=o?.id||null;
      if(o){const resize=o.type==='room'&&Math.abs(p.x-(o.x+o.w))<.28&&Math.abs(p.y-(o.y+o.h))<.28;drag={id:o.id,dx:p.x-o.x,dy:p.y-o.y,resize,startX:p.x,startY:p.y,startW:o.w,startH:o.h};beep(340,.03)}draw();
    });
    canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=toM(xy(e));const o=selectedObj();if(!o)return;if(drag.resize){o.w=Math.max(1,snap(drag.startW+p.x-drag.startX));o.h=Math.max(1,snap(drag.startH+p.y-drag.startY))}else{o.x=Math.max(0,Math.min(12-o.w,snap(p.x-drag.dx)));o.y=Math.max(0,Math.min(10-o.h,snap(p.y-drag.dy)))}draw()});
    canvas.addEventListener('pointerup',()=>{if(drag){drag=null;persist();beep(460,.03)}});
    $$('[data-add-room]').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.addRoom;model.rooms.push({id:uid(),type:'room',name:n,x:1+model.rooms.length*.5,y:1+model.rooms.length*.5,w:n==='SDB'?2.5:3.5,h:n==='SDB'?2.2:3});model.selected=model.rooms.at(-1).id;persist();draw()}));
    $$('[data-add-item]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.addItem,d=itemDef[t];model.items.push({id:uid(),type:t,x:2,y:2,w:d.w,h:d.h,rot:0});model.selected=model.items.at(-1).id;persist();draw()}));
    $('#deleteSelected').addEventListener('click',()=>{if(!model.selected)return;model.rooms=model.rooms.filter(x=>x.id!==model.selected);model.items=model.items.filter(x=>x.id!==model.selected);model.selected=null;persist();draw()});
    $('#resetStudio').addEventListener('click',()=>{model=initialStudio();persist();draw();toast('Studio réinitialisé')});
    $('#validatePlan').addEventListener('click',()=>analyzePlan(model));
    $('#saveProject').addEventListener('click',()=>{model.selected=null;draw();const data=canvas.toDataURL('image/png');state.projects.unshift({id:uid(),name:`Projet ${state.projects.length+1}`,date:new Date().toLocaleDateString('fr-FR'),area:model.rooms.reduce((a,r)=>a+r.w*r.h,0),image:data,model:JSON.parse(JSON.stringify(model))});state.projects=state.projects.slice(0,12);award(40,'Projet sauvegardé');saveState();});
    draw();
    cleanupView=()=>{};
  }

  function analyzePlan(model){
    const rooms=model.rooms,items=model.items;let notes=[];
    if(rooms.length<2)notes.push(['warn','Une seule pièce : minimalisme héroïque, mais essaie de créer un vrai petit logement.']);
    const doors=items.filter(i=>i.type==='door').length,windows=items.filter(i=>i.type==='window').length;
    if(!doors)notes.push(['warn','Aucune porte. Tes habitants apprécieront beaucoup la théorie, moins l’entrée dans la maison.']);else notes.push(['good',`${doors} porte(s) : on peut entrer. Excellente base civilisationnelle.`]);
    if(!windows)notes.push(['warn','Aucune fenêtre : ajoute de la lumière naturelle.']);else notes.push(['good',`${windows} fenêtre(s) : la lumière commence à avoir une chance.`]);
    rooms.forEach(r=>{if(r.w*r.h<6)notes.push(['warn',`${r.name} fait ${(r.w*r.h).toFixed(1)} m² : vérifie si l’usage reste confortable.`])});
    const box=$('#inspector');box.innerHTML='<span class="eyebrow">ANALYSE DU PLAN</span><h3>Retour d’ATLAS</h3><div class="analysis-list">'+notes.map(n=>`<div class="analysis-item ${n[0]}">${n[1]}</div>`).join('')+'</div>';
    if(notes.filter(n=>n[0]==='warn').length<=1){completeMission(state.currentMission<=5?state.currentMission:1)}
  }

  function renderExplore(){ renderTemplate('#exploreTemplate'); const f=$('#exploreFeed');exploreData.forEach(([tag,big,p])=>{const e=document.createElement('article');e.className='explore-card';e.innerHTML=`<span class="tag">${tag}</span><div class="big">${big}</div><p>${p}</p>`;f.appendChild(e)}) }
  function renderPortfolio(){ renderTemplate('#portfolioTemplate');const g=$('#portfolioGrid');if(!state.projects.length){g.innerHTML='<div class="empty-state"><h3>Ton portfolio est encore vide.</h3><p>Va dans le Studio, construis quelque chose et sauvegarde ton projet.</p><button class="primary" data-nav="studio">Ouvrir le Studio</button></div>';bindCommon();return}state.projects.forEach(p=>{const e=document.createElement('article');e.className='portfolio-card';e.innerHTML=`<img src="${p.image}" alt="Aperçu du projet"><div><span class="eyebrow">${p.date}</span><h3>${p.name}</h3><p>${p.area.toFixed(1)} m²</p></div>`;g.appendChild(e)}) }

  function openGame(type,missionId=null){currentView='game';setNavActive('');renderTemplate('#gameTemplate');const mount=$('#gameMount');if(type==='structure') setupStructureGame(mount,missionId);else if(type==='light')setupLightGame(mount,missionId);else setupScaleGame(mount,missionId);window.scrollTo({top:0,behavior:'smooth'})}

  function setupStructureGame(mount,missionId){
    mount.innerHTML=`<div class="game-shell"><div class="game-head"><div><span class="eyebrow">LABO STRUCTURES</span><h1>Le pont du parc</h1><p>Clique deux nœuds voisins pour ajouter ou enlever une poutre. Relie les deux appuis et stabilise le tablier avec des triangles.</p></div><span class="game-badge">+140 XP</span></div><div class="game-board"><canvas id="bridgeCanvas" width="900" height="520"></canvas></div><div class="game-controls"><button id="clearBridge">Effacer</button><button class="primary" id="testBridge">Tester la charge</button></div><div id="bridgeMsg" class="game-message">Astuce : un pont qui forme des triangles est généralement beaucoup plus stable.</div></div>`;
    const c=$('#bridgeCanvas'),x=c.getContext('2d');const nodes=[];for(let row=0;row<3;row++)for(let col=0;col<7;col++)nodes.push({id:`${row}-${col}`,x:120+col*110,y:330-row*105,row,col});let beams=[];let first=null,anim=0;
    function key(a,b){return [a.id,b.id].sort().join('|')} function beamExists(a,b){return beams.includes(key(a,b))}
    function neighbors(a,b){return Math.abs(a.col-b.col)<=1&&Math.abs(a.row-b.row)<=1&&(a.col!==b.col||a.row!==b.row)}
    function draw(collapse=0){x.clearRect(0,0,c.width,c.height);x.fillStyle='#bcd6e1';x.fillRect(0,0,c.width,c.height);x.fillStyle='#7da2b0';x.fillRect(0,390,c.width,130);x.fillStyle='#57534d';x.fillRect(75,365,70,55);x.fillRect(755,365,70,55);
      beams.forEach(k=>{const [aId,bId]=k.split('|'),a=nodes.find(n=>n.id===aId),b=nodes.find(n=>n.id===bId);let ay=a.y,by=b.y;if(collapse){const mid=(a.col+b.col)/2;ay+=collapse*Math.max(0,3-Math.abs(3-a.col))*10;by+=collapse*Math.max(0,3-Math.abs(3-b.col))*10}x.strokeStyle=collapse?'#b44d3c':'#202020';x.lineWidth=8;x.beginPath();x.moveTo(a.x,ay);x.lineTo(b.x,by);x.stroke()});
      nodes.forEach(n=>{x.beginPath();x.arc(n.x,n.y+(collapse?collapse*Math.max(0,3-Math.abs(3-n.col))*10:0),10,0,Math.PI*2);x.fillStyle=first?.id===n.id?'#d8ff53':'#fff';x.fill();x.strokeStyle='#171717';x.lineWidth=3;x.stroke()});
      x.fillStyle='#171717';x.font='700 14px system-ui';x.fillText('APPUI',78,450);x.fillText('APPUI',757,450);}
    function nodeAt(p){return nodes.find(n=>Math.hypot(n.x-p.x,n.y-p.y)<22)}
    c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(),p={x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height},n=nodeAt(p);if(!n)return;if(!first){first=n;draw();return}if(neighbors(first,n)){const k=key(first,n);beams=beams.includes(k)?beams.filter(b=>b!==k):[...beams,k];beep(380,.03)}first=null;draw()});
    $('#clearBridge').onclick=()=>{beams=[];first=null;draw()};
    $('#testBridge').onclick=()=>{
      const graph=new Map(nodes.map(n=>[n.id,[]]));beams.forEach(k=>{const [a,b]=k.split('|');graph.get(a).push(b);graph.get(b).push(a)});const start='0-0',goal='0-6';let q=[start],seen=new Set(q);while(q.length){const a=q.shift();graph.get(a).forEach(b=>{if(!seen.has(b)){seen.add(b);q.push(b)}})}
      let triangles=0;nodes.forEach(a=>nodes.forEach(b=>nodes.forEach(d=>{if(a.id<b.id&&b.id<d.id&&beamExists(a,b)&&beamExists(b,d)&&beamExists(a,d))triangles++})));const stable=seen.has(goal)&&triangles>=3&&beams.length>=9;
      const msg=$('#bridgeMsg');if(stable){msg.textContent=`Ça tient. ${triangles} triangle(s), ${beams.length} poutres. Structure suffisamment redondante pour ce niveau.`;award(60,'Pont validé');if(missionId)completeMission(missionId);}
      else{msg.textContent=`Le pont cède : ${seen.has(goal)?'les appuis sont reliés':'les deux rives ne sont même pas reliées'}, et tu n’as que ${triangles} triangle(s). Renforce-le.`;let t=0;const f=()=>{t+=.12;draw(Math.min(4,t));if(t<4)anim=requestAnimationFrame(f)};f();}
    };draw();cleanupView=()=>cancelAnimationFrame(anim);
  }

  function setupLightGame(mount,missionId){
    mount.innerHTML=`<div class="game-shell"><div class="game-head"><div><span class="eyebrow">LABO LUMIÈRE</span><h1>Attrape le soleil</h1><p>Déplace la fenêtre le long des quatre murs puis change l’heure. Le score estime la lumière directe reçue dans la pièce.</p></div><span class="game-badge">+110 XP</span></div><div class="game-board"><canvas id="lightCanvas" width="900" height="520"></canvas></div><div class="game-controls"><div class="range-wrap"><b>Heure</b><input id="hourRange" type="range" min="8" max="18" step="1" value="8"><strong id="hourLabel">08:00</strong></div><button id="rotateWindow">Mur suivant</button><button class="primary" id="validateLight">Valider</button></div><div id="lightMsg" class="game-message">Objectif : dépasse 75/100 à 8h.</div></div>`;
    const c=$('#lightCanvas'),ctx=c.getContext('2d');let hour=8,wall=0,pos=.5;const room={x:260,y:120,w:380,h:280};
    function sunPos(){const a=Math.PI*(hour-6)/14;return {x:450-360*Math.cos(a),y:390-310*Math.sin(a)}}
    function win(){if(wall===0)return{x:room.x+pos*room.w,y:room.y,nx:0,ny:-1};if(wall===1)return{x:room.x+room.w,y:room.y+pos*room.h,nx:1,ny:0};if(wall===2)return{x:room.x+pos*room.w,y:room.y+room.h,nx:0,ny:1};return{x:room.x,y:room.y+pos*room.h,nx:-1,ny:0}}
    function score(){const s=sunPos(),w=win(),vx=s.x-w.x,vy=s.y-w.y,len=Math.hypot(vx,vy)||1;const facing=Math.max(0,(vx/len)*w.nx+(vy/len)*w.ny);return Math.round(facing*100)}
    function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#f3d99d';ctx.fillRect(0,0,c.width,c.height);const s=sunPos();ctx.beginPath();ctx.arc(s.x,s.y,32,0,Math.PI*2);ctx.fillStyle='#ffd64d';ctx.fill();ctx.strokeStyle='#e0af25';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fffdf5';ctx.fillRect(room.x,room.y,room.w,room.h);ctx.strokeStyle='#202020';ctx.lineWidth=10;ctx.strokeRect(room.x,room.y,room.w,room.h);const w=win();ctx.strokeStyle='#63b7d0';ctx.lineWidth=16;ctx.beginPath();if(wall%2===0){ctx.moveTo(w.x-45,w.y);ctx.lineTo(w.x+45,w.y)}else{ctx.moveTo(w.x,w.y-45);ctx.lineTo(w.x,w.y+45)}ctx.stroke();ctx.strokeStyle='rgba(255,201,72,.25)';ctx.lineWidth=80;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(w.x,w.y);ctx.stroke();ctx.fillStyle='#171717';ctx.font='800 28px system-ui';ctx.fillText(`${score()}/100`,room.x+20,room.y+45);ctx.font='13px system-ui';ctx.fillText('LUMIÈRE DIRECTE',room.x+20,room.y+66)}
    c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(),p={x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};if(wall===0||wall===2)pos=Math.max(.1,Math.min(.9,(p.x-room.x)/room.w));else pos=Math.max(.1,Math.min(.9,(p.y-room.y)/room.h));draw()});
    $('#hourRange').oninput=e=>{hour=+e.target.value;$('#hourLabel').textContent=String(hour).padStart(2,'0')+':00';draw()};$('#rotateWindow').onclick=()=>{wall=(wall+1)%4;draw()};$('#validateLight').onclick=()=>{const s=score();$('#lightMsg').textContent=s>=75?`Très bon : ${s}/100. Tu as orienté l’ouverture vers la lumière du matin.`:`${s}/100. Essaie un autre mur ou déplace davantage la fenêtre.`;if(s>=75){award(45,'Lumière maîtrisée');if(missionId)completeMission(missionId)}};draw();
  }

  function setupScaleGame(mount,missionId){
    const target={w:4.5,h:3.5},scale=50;mount.innerHTML=`<div class="game-shell"><div class="game-head"><div><span class="eyebrow">LABO ÉCHELLES</span><h1>Du réel au plan</h1><p>La pièce réelle mesure <b>${target.w} m × ${target.h} m</b>. Reproduis-la au 1:${scale}. Ici, 1 cm écran représente 50 cm réels.</p></div><span class="game-badge">+100 XP</span></div><div class="game-board"><canvas id="scaleCanvas" width="900" height="520"></canvas></div><div class="game-controls"><label>Largeur <input id="scaleW" type="range" min="2" max="12" step=".1" value="6"><b id="scaleWVal">6.0 cm</b></label><label>Hauteur <input id="scaleH" type="range" min="2" max="12" step=".1" value="6"><b id="scaleHVal">6.0 cm</b></label><button class="primary" id="checkScale">Vérifier</button></div><div id="scaleMsg" class="game-message">Transforme d’abord les mètres réels en centimètres sur le dessin.</div></div>`;
    const c=$('#scaleCanvas'),ctx=c.getContext('2d');let w=6,h=6;const targetCmW=target.w*100/scale,targetCmH=target.h*100/scale;
    function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#d8d4cb';for(let i=0;i<c.width;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,c.height);ctx.stroke()}for(let i=0;i<c.height;i+=20){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(c.width,i);ctx.stroke()}const px=35;ctx.fillStyle='#d8ff53aa';ctx.fillRect(180,110,w*px,h*px);ctx.strokeStyle='#171717';ctx.lineWidth=4;ctx.strokeRect(180,110,w*px,h*px);ctx.fillStyle='#171717';ctx.font='800 24px system-ui';ctx.fillText(`${w.toFixed(1)} cm × ${h.toFixed(1)} cm`,200,150);ctx.font='13px system-ui';ctx.fillText(`Cible réelle : ${target.w} m × ${target.h} m · échelle 1:${scale}`,200,176)}
    $('#scaleW').oninput=e=>{w=+e.target.value;$('#scaleWVal').textContent=w.toFixed(1)+' cm';draw()};$('#scaleH').oninput=e=>{h=+e.target.value;$('#scaleHVal').textContent=h.toFixed(1)+' cm';draw()};$('#checkScale').onclick=()=>{const err=Math.abs(w-targetCmW)+Math.abs(h-targetCmH),ok=err<.25;$('#scaleMsg').textContent=ok?`Exact : ${targetCmW.toFixed(1)} cm × ${targetCmH.toFixed(1)} cm. Tu viens de convertir un vrai espace en plan.`:`Pas encore. Au 1:${scale}, ${target.w} m deviennent ${targetCmW.toFixed(1)} cm. Ajuste ton rectangle.`;if(ok){award(40,'Échelle réussie');if(missionId)completeMission(missionId)}};draw();
  }

  document.addEventListener('click',e=>{const n=e.target.closest('[data-nav]');if(n&&!app.contains(n))navigate(n.dataset.nav)});
  $('#soundToggle').addEventListener('click',()=>{state.sound=!state.sound;saveState()});
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  updateStatus();navigate('home');
})();
