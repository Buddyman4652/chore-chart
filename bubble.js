/* Bubble Pop: a touch bubble shooter. Drag to aim, let go to shoot, tap the small ball to swap colors. */
(function(){
'use strict';
var D=60,R=30,RH=52,NR=14,NC=11,LOSE=11,W=660,H=880,CX=330,CY=770,SPEED=1500;
var COLORS=['#FF4D4D','#4D9DFF','#4DDB6A','#FFD84D','#B06BFF'];
var DARK=['#B81F2E','#1F5FC4','#1E9B43','#C99A0C','#7A3FCF'];

function injectCss(){
  if(document.getElementById('bp-css'))return;
  var s=document.createElement('style');s.id='bp-css';
  s.textContent=
  '.bp{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;background:radial-gradient(120% 90% at 50% 0%,#2B2F7A 0%,#14173F 55%,#0A0C26 100%);color:#fff;font-family:system-ui,-apple-system,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none}'+
  '.bp-hud{display:flex;align-items:center;gap:14px;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;flex-wrap:wrap}'+
  '.bp-hud .st{display:grid;line-height:1.05;min-width:64px}.bp-hud small{font-size:11px;font-weight:800;letter-spacing:.08em;color:#9AA3FF}.bp-hud b{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}'+
  '.bp-hud .sp{flex:1}.bp-btn{min-height:44px;padding:0 16px;border-radius:14px;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;font:700 15px system-ui,sans-serif}'+
  '.bp-btn.warn{background:#B42318;border-color:#FF8A80}.bp-time.low b{color:#FF8A80}'+
  '.bp-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 10px calc(env(safe-area-inset-bottom,0px) + 10px);position:relative}'+
  '.bp-stage canvas{display:block;border-radius:22px;box-shadow:0 0 0 3px rgba(255,255,255,.22),0 18px 60px rgba(0,0,0,.55)}'+
  '.bp-over{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(6,8,30,.62);z-index:2}'+
  '.bp-card{background:#fff;color:#16183A;border-radius:28px;padding:26px 30px;text-align:center;display:grid;gap:8px;min-width:280px;max-width:90%;box-shadow:0 20px 60px rgba(0,0,0,.5)}'+
  '.bp-card h2{margin:0;font-size:34px;font-weight:800}.bp-card p{margin:0;font-size:20px;font-weight:700}.bp-card .nb{color:#C94A10;font-weight:800;font-size:22px}'+
  '.bp-card .row{display:flex;gap:10px;justify-content:center;margin-top:8px}.bp-card .btn{min-height:52px;padding:0 24px;border-radius:16px;border:0;background:#2467E0;color:#fff;font:800 18px system-ui,sans-serif}.bp-card .btn.alt{background:#E8ECF7;color:#16183A}';
  document.head.appendChild(s);
}

function start(host,opts){
  injectCss();
  opts=opts||{};
  var root=document.createElement('div');root.className='bp';
  root.innerHTML='<div class="bp-hud"><div class="st"><small>SCORE</small><b class="v-score">0</b></div><div class="st"><small>BEST</small><b class="v-best">0</b></div><div class="st bp-time"><small>TIME LEFT</small><b class="v-time">0:00</b></div><div class="sp"></div><button type="button" class="bp-btn b-snd"></button><button type="button" class="bp-btn b-quit">Leave</button></div><div class="bp-stage"><canvas></canvas><div class="bp-over" hidden></div></div>';
  host.appendChild(root);
  var cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),stage=root.querySelector('.bp-stage');
  var elScore=root.querySelector('.v-score'),elBest=root.querySelector('.v-best'),elTime=root.querySelector('.v-time'),timeBox=root.querySelector('.bp-time');
  var over=root.querySelector('.bp-over'),bSnd=root.querySelector('.b-snd'),bQuit=root.querySelector('.b-quit');

  var sfx=opts.sound!==false,ac=null;
  function audio(){
    if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;}}
    if(ac&&ac.state==='suspended'){try{ac.resume();}catch(e){}}
    return ac;
  }
  function tone(f0,f1,dur,type,vol,delay){
    if(!sfx)return;var a=audio();if(!a)return;
    var t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol||0.12,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+0.02);
  }
  var snd={
    shoot:function(){tone(320,720,0.09,'triangle',0.12);},
    pop:function(n){var b=n>=8?640:n>=5?520:420;tone(b,b*2,0.14,'sine',0.16);tone(b*1.5,b*3,0.12,'triangle',0.08,0.05);},
    thud:function(){tone(140,70,0.12,'sine',0.18);},
    fall:function(){tone(700,180,0.35,'sawtooth',0.07);},
    over:function(){tone(440,330,0.2,'triangle',0.14);tone(330,247,0.2,'triangle',0.14,0.2);tone(247,165,0.4,'triangle',0.14,0.4);},
    cheer:function(){tone(523,523,0.12,'triangle',0.13);tone(659,659,0.12,'triangle',0.13,0.13);tone(784,784,0.25,'triangle',0.13,0.26);}
  };
  function syncSnd(){bSnd.textContent=sfx?'Sound on':'Sound off';}
  syncSnd();

  /* sprites */
  var sprites=[],dpr=1,scale=1;
  function mkSprites(){
    sprites=COLORS.map(function(c,i){
      var s=Math.ceil(D*scale*dpr)+2,k=document.createElement('canvas');k.width=k.height=s;
      var x=k.getContext('2d'),m=s/2,r=s/2-2*dpr;
      var gr=x.createRadialGradient(m-r*.3,m-r*.35,r*.1,m,m,r);
      gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.25,c);gr.addColorStop(1,DARK[i]);
      x.beginPath();x.arc(m,m,r,0,6.2832);x.fillStyle=gr;x.fill();
      x.lineWidth=Math.max(1.5,r*.07);x.strokeStyle='rgba(0,0,0,.28)';x.stroke();
      x.beginPath();x.ellipse(m-r*.32,m-r*.42,r*.26,r*.16,-.6,0,6.2832);x.fillStyle='rgba(255,255,255,.85)';x.fill();
      x.beginPath();x.arc(m+r*.38,m+r*.4,r*.1,0,6.2832);x.fillStyle='rgba(255,255,255,.35)';x.fill();
      return k;
    });
  }
  function ball(i,x,y,sz){var s=sprites[i];if(s)ctx.drawImage(s,x-sz/2,y-sz/2,sz,sz);}
  function resize(){
    var sw=stage.clientWidth-20,sh=stage.clientHeight-4;if(sw<50||sh<50)return;
    var sc=Math.min(sw/W,sh/H);dpr=window.devicePixelRatio||1;
    if(Math.abs(sc-scale)>0.001||!sprites.length){scale=sc;mkSprites();}
    cv.style.width=Math.floor(W*sc)+'px';cv.style.height=Math.floor(H*sc)+'px';
    cv.width=Math.floor(W*sc*dpr);cv.height=Math.floor(H*sc*dpr);
    ctx.setTransform(sc*dpr,0,0,sc*dpr,0,0);
  }

  /* game state */
  var g=[],par=0,score=0,best=opts.best||0,bestShown=best,shots=0,cur=0,nxt=0,state='aim',angle=90;
  var sh={x:0,y:0,ux:0,uy:0,c:0};
  var rings=[],texts=[],falls=[],sparks=[];
  var timeLeft=opts.seconds||600,ended=false,raf=0,last=0,dead=false,aiming=false,wobble=0;

  function rnd(n){return Math.floor(Math.random()*n);}
  function colsIn(r){return ((r+par)%2===0)?NC:NC-1;}
  function cellX(r,c){return c*D+R+(((r+par)%2===1)?R:0);}
  function cellY(r){return r*RH+R;}
  function neighbors(r,c){
    var odd=((r+par)%2)===1,cand=[[r,c-1],[r,c+1]];
    if(odd){cand.push([r-1,c],[r-1,c+1],[r+1,c],[r+1,c+1]);}
    else{cand.push([r-1,c-1],[r-1,c],[r+1,c-1],[r+1,c]);}
    return cand.filter(function(q){return q[0]>=0&&q[0]<NR&&q[1]>=0&&q[1]<colsIn(q[0]);});
  }
  function fillRow(r){
    for(var c=0;c<colsIn(r);c++){var v=rnd(5);if(c>0&&rnd(100)<40)v=g[r][c-1];g[r][c]=v;}
  }
  function pickColor(){
    var seen=[false,false,false,false,false],n=0;
    for(var r=0;r<NR;r++)for(var c=0;c<colsIn(r);c++){var v=g[r][c];if(v>=0&&!seen[v]){seen[v]=true;n++;}}
    if(!n)return rnd(5);
    var pick=rnd(n);
    for(var i=0;i<5;i++)if(seen[i]){if(pick===0)return i;pick--;}
    return 0;
  }
  function gridEmpty(){for(var r=0;r<NR;r++)for(var c=0;c<colsIn(r);c++)if(g[r][c]>=0)return false;return true;}
  function newBoard(){
    par=0;g=[];
    for(var r=0;r<NR;r++){var row=[];for(var c=0;c<NC;c++)row.push(-1);g.push(row);}
    for(var r2=0;r2<5;r2++)fillRow(r2);
    score=0;shots=0;angle=90;state='aim';cur=pickColor();nxt=pickColor();
    rings=[];texts=[];falls=[];sparks=[];over.hidden=true;showScore();
  }
  function showScore(){elScore.textContent=score;elBest.textContent=Math.max(best,bestShown);}
  function flood(r0,c0,col){
    var vis={},out=[],stack=[[r0,c0]];vis[r0+','+c0]=1;
    while(stack.length){
      var p=stack.pop();out.push(p);
      neighbors(p[0],p[1]).forEach(function(q){var k=q[0]+','+q[1];if(!vis[k]&&g[q[0]][q[1]]===col){vis[k]=1;stack.push(q);}});
    }
    return out;
  }
  function dropFloating(){
    var vis={},stack=[];
    for(var c=0;c<colsIn(0);c++)if(g[0][c]>=0){vis['0,'+c]=1;stack.push([0,c]);}
    while(stack.length){
      var p=stack.pop();
      neighbors(p[0],p[1]).forEach(function(q){var k=q[0]+','+q[1];if(!vis[k]&&g[q[0]][q[1]]>=0){vis[k]=1;stack.push(q);}});
    }
    var n=0;
    for(var r=0;r<NR;r++)for(var c2=0;c2<colsIn(r);c2++){
      if(g[r][c2]>=0&&!vis[r+','+c2]){
        falls.push({x:cellX(r,c2),y:cellY(r),vx:(Math.random()-.5)*160,vy:-60-Math.random()*120,c:g[r][c2]});
        g[r][c2]=-1;n++;
      }
    }
    return n;
  }
  function addRow(){
    for(var r=NR-1;r>=1;r--)g[r]=g[r-1];
    var row=[];for(var c=0;c<NC;c++)row.push(-1);g[0]=row;par=1-par;fillRow(0);
  }
  function burst(x,y,col){
    rings.push({x:x,y:y,t:0,c:col});
    for(var i=0;i<5;i++){var a=Math.random()*6.283,sp=120+Math.random()*180;sparks.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,c:col});}
  }
  function hitsBubble(x,y){
    var rr=Math.floor((y-R)/RH);
    for(var r=rr-1;r<=rr+1;r++){
      if(r<0||r>=NR)continue;
      for(var c=0;c<colsIn(r);c++){
        if(g[r][c]>=0){var dx=cellX(r,c)-x,dy=cellY(r)-y;if(dx*dx+dy*dy<2540)return true;}
      }
    }
    return false;
  }
  function shoot(){
    if(state!=='aim'||ended)return;
    var rad=angle*Math.PI/180;
    sh.ux=Math.cos(rad);sh.uy=-Math.sin(rad);sh.x=CX;sh.y=CY;sh.c=cur;state='fly';snd.shoot();
  }
  function land(){
    var rr=Math.floor((sh.y-R)/RH+0.5),bR=-1,bC=-1,bD=1e12;
    for(var r=rr-1;r<=rr+1;r++){
      if(r<0||r>=NR)continue;
      for(var c=0;c<colsIn(r);c++){
        if(g[r][c]<0){var dx=cellX(r,c)-sh.x,dy=cellY(r)-sh.y,d2=dx*dx+dy*dy;if(d2<bD){bD=d2;bR=r;bC=c;}}
      }
    }
    if(bR<0){gameOver();return;}
    g[bR][bC]=sh.c;resolve(bR,bC);
  }
  function resolve(r,c){
    var col=g[r][c],grp=flood(r,c,col);
    if(grp.length>=3){
      grp.forEach(function(p){burst(cellX(p[0],p[1]),cellY(p[0]),col);g[p[0]][p[1]]=-1;});
      var gained=grp.length*10,fell=dropFloating();
      gained+=fell*20;score+=gained;
      texts.push({x:Math.max(110,Math.min(W-110,sh.x)),y:sh.y-30,t:0,s:'+'+gained});
      snd.pop(grp.length);if(fell)snd.fall();
      shots=0;
    }else{
      shots++;snd.thud();
      if(shots>=6){addRow();shots=0;}
    }
    if(gridEmpty()){score+=500;for(var rr=0;rr<4;rr++)fillRow(rr);snd.cheer();texts.push({x:W/2,y:300,t:0,s:'Board cleared! +500'});}
    var lost=false;
    for(var r2=LOSE;r2<NR;r2++)for(var c2=0;c2<colsIn(r2);c2++)if(g[r2][c2]>=0)lost=true;
    cur=nxt;nxt=pickColor();
    if(score>bestShown)bestShown=score;
    showScore();
    if(lost){gameOver();return;}
    state='aim';
  }
  function card(html){over.innerHTML='<div class="bp-card">'+html+'</div>';over.hidden=false;}
  function gameOver(){
    state='over';snd.over();
    var nb=score>best;
    card('<h2>Game over</h2><p>Score '+score+'</p>'+(nb?'<p class="nb">NEW BEST!</p>':'<p>Best '+Math.max(best,bestShown)+'</p>')+'<div class="row"><button type="button" class="btn" data-a="again">Play again</button><button type="button" class="btn alt" data-a="done">I am done</button></div>');
    if(score>best)best=score;
  }
  function timeUp(){
    if(ended)return;ended=true;state='over';snd.cheer();
    var nb=score>best;if(score>best)best=score;
    card('<h2>Time is up!</h2><p>Score '+score+'</p>'+(nb?'<p class="nb">NEW BEST!</p>':'<p>Best '+best+'</p>')+'<div class="row"><button type="button" class="btn" data-a="done">Done</button></div>');
  }
  function finish(){
    if(dead)return;
    var s=Math.max(score,best>(opts.best||0)?best:0);
    destroy();
    if(opts.onEnd)opts.onEnd(s);
  }
  function destroy(){
    dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);
    if(root.parentNode)root.parentNode.removeChild(root);
    try{if(ac)ac.close();}catch(e){}
  }

  /* input */
  function pt(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  function aimAt(p){
    var dx=p.x-CX,dy=CY-p.y;
    var a=Math.atan2(dy,dx)*180/Math.PI;
    angle=Math.max(15,Math.min(165,a));
  }
  cv.addEventListener('pointerdown',function(e){
    if(state!=='aim'||ended)return;
    audio();
    var p=pt(e);
    if(Math.hypot(p.x-70,p.y-(CY+34))<46){var t=cur;cur=nxt;nxt=t;snd.thud();return;}
    aiming=true;try{cv.setPointerCapture(e.pointerId);}catch(x){}
    aimAt(p);e.preventDefault();
  });
  cv.addEventListener('pointermove',function(e){if(aiming){aimAt(pt(e));e.preventDefault();}});
  function up(e){if(!aiming)return;aiming=false;aimAt(pt(e));shoot();}
  cv.addEventListener('pointerup',up);
  cv.addEventListener('pointercancel',function(){aiming=false;});
  over.addEventListener('click',function(e){
    var a=e.target&&e.target.getAttribute&&e.target.getAttribute('data-a');
    if(a==='again'){newBoard();}
    else if(a==='done'){finish();}
  });
  bSnd.addEventListener('click',function(){sfx=!sfx;syncSnd();if(sfx){audio();snd.thud();}if(opts.onSound)opts.onSound(sfx);});
  var quitT=0;
  bQuit.addEventListener('click',function(){
    if(!bQuit.classList.contains('warn')){bQuit.classList.add('warn');bQuit.textContent='Tap again to leave';clearTimeout(quitT);quitT=setTimeout(function(){bQuit.classList.remove('warn');bQuit.textContent='Leave';},3000);return;}
    finish();
  });
  window.addEventListener('resize',resize);

  /* drawing */
  function drawBg(){
    ctx.clearRect(0,0,W,H);
    var gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#242A78');gr.addColorStop(1,'#10133A');
    ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,.05)';
    for(var i=0;i<18;i++){var sx=(i*137)%W,sy=(i*263)%(LOSE*RH);ctx.beginPath();ctx.arc(sx,sy,2+(i%3),0,6.283);ctx.fill();}
    var y=LOSE*RH;
    var danger=false;
    for(var r=LOSE-2;r<NR;r++)for(var c=0;c<colsIn(r);c++)if(g[r][c]>=0)danger=true;
    if(danger){
      var al=.25+.2*Math.sin(wobble*6);
      var dg=ctx.createLinearGradient(0,y-120,0,y+40);dg.addColorStop(0,'rgba(255,60,60,0)');dg.addColorStop(1,'rgba(255,60,60,'+al+')');
      ctx.fillStyle=dg;ctx.fillRect(0,y-120,W,160);
    }
    ctx.setLineDash([14,10]);ctx.strokeStyle=danger?'rgba(255,120,120,.9)':'rgba(255,255,255,.28)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.setLineDash([]);
  }
  function aimPath(){
    var rad=angle*Math.PI/180,ux=Math.cos(rad),uy=-Math.sin(rad),x=CX,y=CY,pts=[];
    for(var i=0;i<14;i++){
      x+=ux*62;y+=uy*62;
      if(x<R){x=R+(R-x);ux=-ux;}else if(x>W-R){x=W-R-(x-(W-R));ux=-ux;}
      if(y<R)break;
      if(hitsBubble(x,y))break;
      pts.push([x,y]);
    }
    return pts;
  }
  function draw(){
    drawBg();
    for(var r=0;r<NR;r++)for(var c=0;c<colsIn(r);c++){var v=g[r][c];if(v>=0)ball(v,cellX(r,c),cellY(r),D);}
    falls.forEach(function(f){ball(f.c,f.x,f.y,D);});
    sparks.forEach(function(s){ctx.globalAlpha=Math.max(0,1-s.t/.5);ctx.fillStyle=COLORS[s.c];ctx.beginPath();ctx.arc(s.x,s.y,6,0,6.283);ctx.fill();});
    ctx.globalAlpha=1;
    rings.forEach(function(rg){var k=rg.t/.4;ctx.globalAlpha=Math.max(0,1-k);ctx.strokeStyle=COLORS[rg.c];ctx.lineWidth=6;ctx.beginPath();ctx.arc(rg.x,rg.y,30+40*k,0,6.283);ctx.stroke();});
    ctx.globalAlpha=1;
    if(state==='aim'&&!ended){
      aimPath().forEach(function(p,i){ctx.globalAlpha=Math.max(.25,1-i*.06);ctx.fillStyle=COLORS[cur];ctx.beginPath();ctx.arc(p[0],p[1],7,0,6.283);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.stroke();});
      ctx.globalAlpha=1;
    }
    /* launcher */
    ctx.save();ctx.translate(CX,CY);ctx.rotate(-(angle-90)*Math.PI/180);
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(-12,-70,24,70,10):ctx.rect(-12,-70,24,70);ctx.fill();ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(CX,CY,40,0,6.283);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=3;ctx.stroke();
    if(state==='aim'&&!ended)ball(cur,CX,CY,D);
    if(state==='fly')ball(sh.c,sh.x,sh.y,D);
    /* next ball */
    ctx.fillStyle='#9AA3FF';ctx.font='800 20px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('NEXT',70,CY-12);
    ball(nxt,70,CY+34,D*.72);
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='700 15px system-ui,sans-serif';ctx.fillText('tap to swap',70,CY+78);
    texts.forEach(function(t){var k=t.t/.9;ctx.globalAlpha=Math.max(0,1-k);ctx.fillStyle='#FFE27A';ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=6;ctx.font='800 44px system-ui,sans-serif';ctx.textAlign='center';var y=t.y-k*90;ctx.strokeText(t.s,t.x,y);ctx.fillText(t.s,t.x,y);});
    ctx.globalAlpha=1;
  }

  function fmtT(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60);}
  function step(dt){
    wobble+=dt;
    rings.forEach(function(r){r.t+=dt;});rings=rings.filter(function(r){return r.t<.4;});
    texts.forEach(function(t){t.t+=dt;});texts=texts.filter(function(t){return t.t<.9;});
    sparks.forEach(function(s){s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=500*dt;});sparks=sparks.filter(function(s){return s.t<.5;});
    falls.forEach(function(f){f.vy+=1500*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;});falls=falls.filter(function(f){return f.y<H+60;});
    if(state==='fly'){
      var d=Math.min(dt,.08),dist=SPEED*d,steps=Math.floor(dist/10)+1,sd=dist/steps;
      for(var i=0;i<steps;i++){
        sh.x+=sh.ux*sd;sh.y+=sh.uy*sd;
        if(sh.x<R){sh.x=R;sh.ux=-sh.ux;}else if(sh.x>W-R){sh.x=W-R;sh.ux=-sh.ux;}
        if(sh.y-R<=0||hitsBubble(sh.x,sh.y)){land();break;}
      }
    }
    if(!ended){
      timeLeft-=dt;
      elTime.textContent=fmtT(timeLeft);timeBox.classList.toggle('low',timeLeft<=30);
      if(timeLeft<=0){timeLeft=0;elTime.textContent='0:00';timeUp();}
    }
  }
  function frame(ts){
    if(dead)return;
    var dt=last?Math.min(.1,(ts-last)/1000):0;last=ts;
    step(dt);draw();
    raf=requestAnimationFrame(frame);
  }
  resize();newBoard();elTime.textContent=fmtT(timeLeft);
  setTimeout(resize,60);
  raf=requestAnimationFrame(frame);
  return {destroy:destroy};
}

window.BubblePop={start:start};
})();
