/* Daily word puzzles: Word Guess, Group Up and Word Trail. Original games in the same spirit as popular daily puzzles. */
(function(){
'use strict';
var D=window.DAILY_DATA||{words:[],conn:[],trail:[]};
var KINDS={word:{title:'Word Guess',list:D.words},conn:{title:'Group Up',list:D.conn},trail:{title:'Word Trail',list:D.trail}};
var css=
'.dp{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;background:var(--bg,#EEF3F8);color:var(--ink,#16202C);font-family:var(--f-body,system-ui,sans-serif);-webkit-user-select:none;user-select:none;touch-action:manipulation;overflow:auto}'+
'.dp *{box-sizing:border-box}'+
'.dp-top{display:flex;align-items:center;gap:12px;padding:14px 18px;background:var(--card,#fff);border-bottom:1px solid var(--line,#D3DDE7)}'+
'.dp-top h2{margin:0;font:800 24px var(--f-display,system-ui);flex:1;text-align:center}'+
'.dp-btn{font:700 17px var(--f-body,system-ui);min-height:46px;padding:0 20px;border-radius:14px;border:2px solid var(--line,#D3DDE7);background:var(--card,#fff);color:var(--ink,#16202C);cursor:pointer}'+
'.dp-btn.pri{background:var(--blue1,#2467E0);color:var(--blue1-ink,#fff);border-color:transparent}'+
'.dp-btn[disabled]{opacity:.45}'+
'.dp-body{flex:1;display:flex;flex-direction:column;align-items:center;padding:16px 16px 28px;gap:12px;width:100%;max-width:640px;margin:0 auto}'+
'.dp-msg{min-height:30px;font:700 18px var(--f-body,system-ui);text-align:center}'+
'.dp-note{font:600 15px var(--f-body,system-ui);color:var(--muted,#586878);text-align:center;margin:0}'+
'.dp-end{background:var(--card,#fff);border:2px solid var(--line,#D3DDE7);border-radius:18px;padding:16px 20px;text-align:center;width:100%}'+
'.dp-end b{display:block;font:800 22px var(--f-display,system-ui);margin-bottom:8px}'+
'.wg-grid{display:grid;grid-template-rows:repeat(6,1fr);gap:7px}'+
'.wg-row{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}'+
'.wg-t{width:min(14vw,66px);height:min(14vw,66px);border:2px solid var(--line,#C3CFDB);border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 30px var(--f-display,system-ui);background:var(--card,#fff)}'+
'.wg-t.f{border-color:var(--muted,#586878)}'+
'.wg-t.c{background:#17824A;border-color:#17824A;color:#fff}.wg-t.p{background:#E0A800;border-color:#E0A800;color:#241800}.wg-t.a{background:#6B7886;border-color:#6B7886;color:#fff}'+
'.wg-row.shake{animation:dpshake .4s}@keyframes dpshake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}'+
'.wg-kb{display:flex;flex-direction:column;gap:7px;width:100%;margin-top:6px}.wg-kr{display:flex;justify-content:center;gap:6px}'+
'.wg-k{flex:1 1 0;max-width:56px;min-width:0;height:56px;border-radius:10px;border:0;background:var(--card2,#E4EBF2);color:var(--ink,#16202C);font:700 18px var(--f-body,system-ui);cursor:pointer;padding:0}'+
'.wg-k.w{flex:1.6;max-width:84px;font-size:14px}.wg-k.c{background:#17824A;color:#fff}.wg-k.p{background:#E0A800;color:#241800}.wg-k.a{background:#6B7886;color:#fff}'+
'.gu-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}'+
'.gu-t{min-height:76px;border:0;border-radius:12px;background:var(--card2,#E4EBF2);color:var(--ink,#16202C);font:800 clamp(13px,2.6vw,19px) var(--f-body,system-ui);text-transform:uppercase;cursor:pointer;padding:4px;word-break:break-word}'+
'.gu-t.s{background:#2B3544;color:#fff}'+
'.gu-g{width:100%;border-radius:12px;padding:12px 8px;text-align:center;color:#1B1B1B}'+
'.gu-g b{display:block;font:800 18px var(--f-body,system-ui);text-transform:uppercase}.gu-g span{font:600 15px var(--f-body,system-ui);text-transform:uppercase}'+
'.gu-c0{background:#F5D95B}.gu-c1{background:#8FD18F}.gu-c2{background:#8DB9F5}.gu-c3{background:#C3A0EE}'+
'.gu-dots{display:flex;gap:8px;align-items:center;font:700 16px var(--f-body,system-ui)}.gu-dots i{width:16px;height:16px;border-radius:50%;background:#586878}.gu-dots i.x{background:#D4DCE5}'+
'.gu-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}'+
'.wt-wrap{position:relative;width:min(88vw,400px);aspect-ratio:6/8;touch-action:none}'+
'.wt-grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(8,1fr)}'+
'.wt-c{display:flex;align-items:center;justify-content:center;font:800 clamp(20px,5.6vw,30px) var(--f-display,system-ui);position:relative;z-index:2;text-transform:uppercase}'+
'.wt-c i{width:78%;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;pointer-events:none}'+
'.wt-c.sel i{background:#2B3544;color:#fff}.wt-c.fw i{background:#8DB9F5;color:#0E2447}.wt-c.fs i{background:#F5D95B;color:#3A2800}.wt-c.hint i{box-shadow:0 0 0 4px #E0A800}'+
'.wt-svg{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}'+
'.wt-theme{font:800 21px var(--f-display,system-ui);text-align:center}.wt-theme small{display:block;font:600 14px var(--f-body,system-ui);color:var(--muted,#586878)}'+
'.wt-cur{min-height:34px;font:800 24px var(--f-display,system-ui);letter-spacing:2px;text-transform:uppercase}';
function addCss(){if(document.getElementById('dp-css'))return;var s=document.createElement('style');s.id='dp-css';s.textContent=css;document.head.appendChild(s);}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pick(kind,day){var l=KINDS[kind].list;return l[((day%l.length)+l.length)%l.length];}
function rng(seed){var s=(seed>>>0)||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function dayNum(dateStr){var p=String(dateStr).split('-');return Math.floor(Date.UTC(+p[0],+p[1]-1,+p[2])/864e5);}

function start(host,o){
  addCss();
  var kind=o.kind,K=KINDS[kind],day=Number(o.day)||0,puz=pick(kind,day+(kind==='conn'?3:kind==='trail'?5:0));
  var st=o.state||{};var cleanup=[];
  host.innerHTML='';
  var root=el('div','dp');host.appendChild(root);
  var top=el('div','dp-top'),back=el('button','dp-btn','Back'),h=el('h2','',esc(K.title)),sp=el('span','','');sp.style.width='86px';
  back.type='button';top.appendChild(back);top.appendChild(h);top.appendChild(sp);root.appendChild(top);
  var body=el('div','dp-body');root.appendChild(body);
  var dead=false;
  function close(){if(dead)return;dead=true;cleanup.forEach(function(f){f();});host.innerHTML='';if(o.onClose)o.onClose();}
  back.onclick=close;
  function save(fin){if(o.onSave)o.onSave(st,!!fin);}
  function endBox(title,text){var b=el('div','dp-end','<b>'+esc(title)+'</b>'+(text?'<p class="dp-note">'+esc(text)+'</p>':''));var d=el('button','dp-btn pri','Done');d.type='button';d.style.marginTop='12px';d.onclick=close;b.appendChild(d);return b;}
  if(kind==='word')wordGame();else if(kind==='conn')connGame();else trailGame();

  /* ---------- Word Guess ---------- */
  function wordGame(){
    var ans=puz,guesses=(st.g=st.g||[]).slice(),cur='',over=false;
    var msg=el('div','dp-msg',''),grid=el('div','wg-grid'),kb=el('div','wg-kb');
    var rows=[];for(var r=0;r<6;r++){var row=el('div','wg-row'),ts=[];for(var c=0;c<5;c++){var t=el('div','wg-t','');row.appendChild(t);ts.push(t);}grid.appendChild(row);rows.push({row:row,ts:ts});}
    body.appendChild(el('p','dp-note','Guess the secret 5-letter word in 6 tries. Green is the right spot, yellow is the wrong spot, gray is not in the word.'));
    body.appendChild(msg);body.appendChild(grid);body.appendChild(kb);
    var keyEls={};
    ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach(function(line,i){
      var kr=el('div','wg-kr');
      if(i===2)kr.appendChild(mk('ENTER','w'));
      line.split('').forEach(function(ch){kr.appendChild(mk(ch,''));});
      if(i===2)kr.appendChild(mk('DEL','w'));
      kb.appendChild(kr);
    });
    function mk(label,cls){var b=el('button','wg-k '+cls,label==='DEL'?'&#9003;':label);b.type='button';b.onclick=function(){press(label);};if(label.length===1)keyEls[label]=b;return b;}
    function score(g){
      var res=['a','a','a','a','a'],left={};
      for(var i=0;i<5;i++){if(g[i]===ans[i])res[i]='c';else left[ans[i]]=(left[ans[i]]||0)+1;}
      for(var j=0;j<5;j++){if(res[j]!=='c'&&left[g[j]]>0){res[j]='p';left[g[j]]--;}}
      return res;
    }
    function paint(){
      for(var r=0;r<6;r++){
        var g=r<guesses.length?guesses[r]:(r===guesses.length?cur:''),sc=r<guesses.length?score(guesses[r]):null;
        for(var c=0;c<5;c++){var t=rows[r].ts[c];t.textContent=g[c]||'';t.className='wg-t'+(g[c]&&!sc?' f':'')+(sc?' '+sc[c]:'');}
      }
      var best={};
      guesses.forEach(function(g){score(g).forEach(function(s,i){var ch=g[i],rank={a:1,p:2,c:3};if(!best[ch]||rank[s]>rank[best[ch]])best[ch]=s;});});
      Object.keys(keyEls).forEach(function(k){keyEls[k].className='wg-k '+(best[k]||'');});
    }
    function finish(){
      over=true;var win=guesses[guesses.length-1]===ans;
      msg.textContent='';
      body.insertBefore(endBox(win?'You got it in '+guesses.length+(guesses.length===1?' try!':' tries!'):'Nice try!',win?'The word was '+ans+'.':'The word was '+ans+'. A new word comes tomorrow.'),kb);
      kb.style.display='none';paint();
    }
    function press(k){
      if(over)return;
      if(k==='ENTER'){
        if(cur.length<5){msg.textContent='Type 5 letters first';rows[guesses.length].row.classList.remove('shake');void rows[guesses.length].row.offsetWidth;rows[guesses.length].row.classList.add('shake');return;}
        guesses.push(cur);cur='';msg.textContent='';st.g=guesses.slice();
        var fin=guesses[guesses.length-1]===ans||guesses.length>=6;
        paint();save(fin);if(fin)finish();
      }else if(k==='DEL'){cur=cur.slice(0,-1);paint();}
      else if(/^[A-Z]$/.test(k)&&cur.length<5){cur+=k;msg.textContent='';paint();}
    }
    function onKey(e){if(e.ctrlKey||e.metaKey||e.altKey)return;var k=e.key;if(k==='Enter')press('ENTER');else if(k==='Backspace')press('DEL');else if(/^[a-zA-Z]$/.test(k))press(k.toUpperCase());}
    document.addEventListener('keydown',onKey);cleanup.push(function(){document.removeEventListener('keydown',onKey);});
    paint();
    if(guesses.length&&(guesses[guesses.length-1]===ans||guesses.length>=6))finish();
  }

  /* ---------- Group Up ---------- */
  function connGame(){
    var groups=puz,found=(st.f=st.f||[]).slice(),miss=st.m||0,sel=[],over=false;
    var all=[];groups.forEach(function(g,gi){g.w.forEach(function(w){all.push({w:w,g:gi});});});
    var order=all.map(function(_,i){return i;}),rnd=rng(day*7919+13);
    for(var i=order.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}
    var msg=el('div','dp-msg',''),dots=el('div','gu-dots'),done=el('div',''),grid=el('div','gu-grid'),btns=el('div','gu-row');
    done.style.cssText='width:100%;display:flex;flex-direction:column;gap:8px';
    body.appendChild(el('p','dp-note','Find four groups of four words that go together. Pick 4 words, then tap Check. You can make 4 mistakes.'));
    body.appendChild(done);body.appendChild(grid);body.appendChild(msg);body.appendChild(dots);body.appendChild(btns);
    var bShuf=el('button','dp-btn','Shuffle'),bClr=el('button','dp-btn','Clear'),bGo=el('button','dp-btn pri','Check');
    [bShuf,bClr,bGo].forEach(function(b){b.type='button';btns.appendChild(b);});
    function groupBox(gi){var g=groups[gi];return el('div','gu-g gu-c'+gi,'<b>'+esc(g.n)+'</b><span>'+esc(g.w.join(', '))+'</span>');}
    function draw(){
      done.innerHTML='';found.forEach(function(gi){done.appendChild(groupBox(gi));});
      grid.innerHTML='';
      order.forEach(function(idx){
        var it=all[idx];if(found.indexOf(it.g)>=0)return;
        var b=el('button','gu-t'+(sel.indexOf(idx)>=0?' s':''),esc(it.w));b.type='button';b.disabled=over;
        b.onclick=function(){var p=sel.indexOf(idx);if(p>=0)sel.splice(p,1);else if(sel.length<4)sel.push(idx);draw();};
        grid.appendChild(b);
      });
      dots.innerHTML='Mistakes left: ';for(var m=0;m<4;m++){dots.appendChild(el('i',m<miss?'x':''));}
      bGo.disabled=over||sel.length!==4;bClr.disabled=over||!sel.length;bShuf.disabled=over;
    }
    function finish(win){
      over=true;
      if(!win){groups.forEach(function(g,gi){if(found.indexOf(gi)<0){found.push(gi);}});}
      draw();grid.style.display='none';btns.style.display='none';dots.style.display='none';
      msg.textContent='';body.appendChild(endBox(win?'You found them all!':'Nice try!',win?(miss?'With '+miss+' mistake'+(miss===1?'':'s')+'.':'With no mistakes!'):'Here are the groups. A new puzzle comes tomorrow.'));
    }
    bShuf.onclick=function(){for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}draw();};
    bClr.onclick=function(){sel=[];draw();};
    bGo.onclick=function(){
      var counts={};sel.forEach(function(i){counts[all[i].g]=(counts[all[i].g]||0)+1;});
      var gi=-1;Object.keys(counts).forEach(function(k){if(counts[k]===4)gi=+k;});
      if(gi>=0){found.push(gi);sel=[];msg.textContent='';st.f=found.slice();var w=found.length===4;save(w);draw();if(w)finish(true);}
      else{
        var one=Object.keys(counts).some(function(k){return counts[k]===3;});
        miss++;st.m=miss;msg.textContent=one?'One away!':'Not a group. Try again.';sel=[];var l=miss>=4;save(l);draw();if(l){msg.textContent='';finish(false);}
      }
    };
    draw();
    if(found.length===4||miss>=4){finish(found.length===4);}
  }

  /* ---------- Word Trail ---------- */
  function trailGame(){
    var G=puz.grid,words=[{w:puz.span.w,p:puz.span.p,s:true}].concat(puz.words.map(function(x){return {w:x.w,p:x.p};}));
    var foundIdx=(st.t=st.t||[]).slice(),hints=st.h||0,path=[],down=false,moved=false,hintCell=-1;
    body.appendChild(el('div','wt-theme','Today\'s theme: '+esc(puz.theme)+'<small>Find every theme word. One gold word touches two opposite sides.</small>'));
    var cnt=el('div','dp-note',''),cur=el('div','wt-cur',''),msg=el('div','dp-msg','');
    var wrap=el('div','wt-wrap'),grid=el('div','wt-grid'),NS='http://www.w3.org/2000/svg';
    var svg=document.createElementNS(NS,'svg');svg.setAttribute('class','wt-svg');svg.setAttribute('viewBox','0 0 6 8');
    wrap.appendChild(svg);wrap.appendChild(grid);
    var cells=[];for(var i=0;i<48;i++){var c=el('div','wt-c','<i>'+esc(G[i])+'</i>');c.dataset.i=i;grid.appendChild(c);cells.push(c);}
    var btns=el('div','gu-row'),bHint=el('button','dp-btn','Hint'),bClr=el('button','dp-btn','Clear'),bGo=el('button','dp-btn pri','Check word');
    [bHint,bClr,bGo].forEach(function(b){b.type='button';btns.appendChild(b);});
    body.appendChild(cnt);body.appendChild(cur);body.appendChild(wrap);body.appendChild(msg);body.appendChild(btns);
    function ctr(i){return {x:(i%6)+.5,y:Math.floor(i/6)+.5};}
    function line(p,color,w){if(p.length<2)return '';return '<polyline fill="none" stroke="'+color+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" points="'+p.map(function(i){var c=ctr(i);return c.x+','+c.y;}).join(' ')+'"/>';}
    function adj(a,b){var ar=Math.floor(a/6),ac=a%6,br=Math.floor(b/6),bc=b%6;return a!==b&&Math.abs(ar-br)<=1&&Math.abs(ac-bc)<=1;}
    function paint(){
      var s='';
      cells.forEach(function(c){c.className='wt-c';});
      foundIdx.forEach(function(wi){var w=words[wi];s+=line(w.p,w.s?'#E8C233':'#6FA3EE',.22);w.p.forEach(function(i){cells[i].classList.add(w.s?'fs':'fw');});});
      s+=line(path,'#2B3544',.2);path.forEach(function(i){cells[i].classList.add('sel');});
      if(hintCell>=0)cells[hintCell].classList.add('hint');
      svg.innerHTML=s;
      cur.textContent=path.map(function(i){return G[i];}).join('');
      var left=words.length-foundIdx.length;
      cnt.textContent=foundIdx.length+' of '+words.length+' found';
      bGo.disabled=path.length<2;bClr.disabled=!path.length;bHint.disabled=left===0;
    }
    function used(i){return foundIdx.some(function(wi){return words[wi].p.indexOf(i)>=0;});}
    function cellAt(x,y){var e=document.elementFromPoint(x,y);while(e&&!(e.dataset&&e.dataset.i!==undefined)){if(e===grid)return -1;e=e.parentNode;}return e&&e.dataset?+e.dataset.i:-1;}
    function submit(){
      if(path.length<2)return;
      var s=path.map(function(i){return G[i];}).join(''),r=s.split('').reverse().join(''),hit=-1;
      words.forEach(function(w,wi){if(foundIdx.indexOf(wi)<0&&(w.w===s||w.w===r))hit=wi;});
      if(hit>=0){
        foundIdx.push(hit);st.t=foundIdx.slice();hintCell=-1;msg.textContent=words[hit].s?'You found the gold word!':'Yes! '+words[hit].w;
        path=[];var fin=foundIdx.length===words.length;save(fin);paint();
        if(fin){btns.style.display='none';msg.textContent='';body.appendChild(endBox('You found them all!',hints?'You used '+hints+' hint'+(hints===1?'':'s')+'.':'No hints needed!'));}
      }else{
        msg.textContent=path.length<4?'Theme words have at least 3 letters':'That is not a theme word';path=[];paint();
      }
    }
    function down1(e){
      var i=cellAt(e.clientX,e.clientY);if(i<0)return;
      e.preventDefault();msg.textContent='';
      if(used(i)){return;}
      down=true;moved=false;
      if(path.length&&path[path.length-1]===i){down=false;submit();return;}
      if(path.length>1&&path[path.length-2]===i){path.pop();}
      else if(path.length&&adj(path[path.length-1],i)&&path.indexOf(i)<0){path.push(i);}
      else path=[i];
      paint();
    }
    function move1(e){
      if(!down)return;var i=cellAt(e.clientX,e.clientY);if(i<0||used(i))return;
      var last=path[path.length-1];if(i===last)return;
      if(path.length>1&&path[path.length-2]===i){path.pop();moved=true;paint();return;}
      if(adj(last,i)&&path.indexOf(i)<0){path.push(i);moved=true;paint();}
    }
    function up1(){if(!down)return;down=false;if(moved&&path.length>=2)submit();}
    wrap.addEventListener('pointerdown',down1);window.addEventListener('pointermove',move1);window.addEventListener('pointerup',up1);window.addEventListener('pointercancel',up1);
    cleanup.push(function(){window.removeEventListener('pointermove',move1);window.removeEventListener('pointerup',up1);window.removeEventListener('pointercancel',up1);});
    bClr.onclick=function(){path=[];msg.textContent='';paint();};
    bGo.onclick=submit;
    bHint.onclick=function(){
      var rest=words.map(function(w,i){return i;}).filter(function(i){return foundIdx.indexOf(i)<0;});
      if(!rest.length)return;
      var wi=rest.filter(function(i){return !words[i].s;})[0];if(wi==null)wi=rest[0];
      hintCell=words[wi].p[0];hints++;st.h=hints;save(false);msg.textContent='Try a word that starts at the ringed letter.';paint();
    };
    paint();
    if(foundIdx.length===words.length){btns.style.display='none';body.appendChild(endBox('You found them all!',''));}
  }
}
window.DailyPuzzles={start:start,kinds:KINDS,dayNum:dayNum};
})();
