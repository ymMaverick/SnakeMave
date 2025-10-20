(() => {
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const startBtn=document.getElementById('startBtn');
const pauseBtn=document.getElementById('pauseBtn');
const continueBtn=document.getElementById('continueBtn');
const restartBtn=document.getElementById('restartBtn');

const scoreEl=document.getElementById('score');
const levelEl=document.getElementById('level');
const speedEl=document.getElementById('speed');
const lengthEl=document.getElementById('length');
const phraseBox=document.getElementById('phraseBox');
const rankingList=document.getElementById('rankingList');

const gridSizeSelect=document.getElementById('gridSize');
const wallModeSelect=document.getElementById('wallMode');

const soundEat=document.getElementById('eatSound');
const soundHit=document.getElementById('hitSound');
const soundCR7=document.getElementById('cr7Sound');

let audioEnabled=false;

let gridSize=parseInt(gridSizeSelect.value,10);
let cols=Math.floor(canvas.width/gridSize);
let rows=Math.floor(canvas.height/gridSize);

let snake=[],dir={x:1,y:0},nextDir={x:1,y:0},food=null,gameInterval=null,baseIntervalMs=160,speedMultiplier=1,score=0,level=1,started=false,paused=false,wallMode=wallModeSelect.value;

const palette=['#34d399','#60a5fa','#f472b6','#f59e0b','#a78bfa','#fb7185','#34d399','#06b6d4','#f97316','#a3e635'];
const milestonePhrases=[
"Você chegou a um marco! Continue firme.",
"Maverick em ação — acelere!",
"Excelente! Mantendo o rastro firme.",
"Show! A cobra está dominando.",
"Excelente progresso — foco e controle!"
];
let rankings=[];

function recomputeGrid(){ gridSize=parseInt(gridSizeSelect.value,10); cols=Math.floor(canvas.width/gridSize); rows=Math.floor(canvas.height/gridSize); }

function initGame(){
  recomputeGrid();
  snake=[]; const startLen=3; for(let i=startLen-1;i>=0;i--){snake.push({x:Math.floor(cols/2)-i,y:Math.floor(rows/2)});}
  dir={x:1,y:0}; nextDir={x:1,y:0}; score=0; level=1; speedMultiplier=1;
  placeFood(); started=false; paused=false;
  updateUI(); draw();
}

function updateUI(){ scoreEl.textContent=score; levelEl.textContent=level; speedEl.textContent=speedMultiplier.toFixed(2); lengthEl.textContent=snake.length; }

function placeFood(){
  const occupied=new Set(snake.map(s=>s.x+','+s.y));
  for(let i=0;i<1000;i++){
    const fx=Math.floor(Math.random()*cols),fy=Math.floor(Math.random()*rows);
    if(!occupied.has(fx+','+fy)){food={x:fx,y:fy}; return;}
  }
  food={x:0,y:0};
}

function clearCanvas(){ctx.clearRect(0,0,canvas.width,canvas.height);}
function draw(){
  clearCanvas();
  ctx.fillStyle='rgba(4,18,28,0.22)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  if(food){ctx.fillStyle='#ff4757'; ctx.fillRect(food.x*gridSize,food.y*gridSize,gridSize,gridSize);}
  const color=palette[(level-1)%palette.length]||'#34d399';
  snake.forEach((s,i)=>{
    const alpha=i===0?1:0.9-(i/snake.length)*0.6;
    ctx.fillStyle=color; ctx.fillRect(s.x*gridSize+1,s.y*gridSize+1,gridSize-2,gridSize-2);
  });
}

function tick(){
  if(!started || paused) return;
  if(!(nextDir.x===-dir.x && nextDir.y===-dir.y)) dir={...nextDir};
  let newHead={x:snake[0].x+dir.x,y:snake[0].y+dir.y};

  if(wallMode==='wrap'){
    if(newHead.x<0)newHead.x=cols-1; if(newHead.x>=cols)newHead.x=0;
    if(newHead.y<0)newHead.y=rows-1; if(newHead.y>=rows)newHead.y=0;
  }else{ if(newHead.x<0||newHead.x>=cols||newHead.y<0||newHead.y>=rows) return gameOver(); }

  if(snake.some(s=>s.x===newHead.x && s.y===newHead.y)) return gameOver();

  snake.unshift(newHead);

  if(food && newHead.x===food.x && newHead.y===food.y){
    score++; placeFood();
    if(audioEnabled) soundEat.play();
    if(score>=level*5) levelUp();
  }else{snake.pop();}

  updateUI(); draw();
}

function levelUp(){
  level++; speedMultiplier*=1.15;
  for(let i=0;i<2;i++){const tail=snake[snake.length-1]; snake.push({x:tail.x,y:tail.y});}
  if(level%5===0){ showMilestone(); if(audioEnabled)soundCR7.play();}
  restartTick();
}

function showMilestone(){
  const text=milestonePhrases[Math.floor(Math.random()*milestonePhrases.length)];
  phraseBox.textContent=text; phraseBox.classList.add('phrase-visible'); phraseBox.classList.remove('phrase-hidden');
  setTimeout(()=>{ phraseBox.classList.remove('phrase-visible'); phraseBox.classList.add('phrase-hidden'); },3000);
}

function restartTick(){ if(gameInterval) clearInterval(gameInterval); gameInterval=setInterval(tick,Math.max(35,baseIntervalMs/speedMultiplier)); }

function startGame(){ 
  if(!audioEnabled){ audioEnabled=true; soundEat.play().catch(()=>{}); soundHit.play().catch(()=>{}); soundCR7.play().catch(()=>{}); }
  if(!started){ started=true; paused=false; restartTick(); updateUI();}
}
function pauseGame(){ paused=true; if(gameInterval) clearInterval(gameInterval); gameInterval=null;}
function continueGame(){ if(!started || !paused) return; paused=false; restartTick();}
function restartGame(){ if(gameInterval) clearInterval(gameInterval); initGame(); }

function gameOver(){
  started=false; paused=true;
  if(gameInterval) clearInterval(gameInterval); gameInterval=null;
  dir={x:0,y:0}; nextDir={x:0,y:0};
  if(audioEnabled) soundHit.play();
  showOverlay(`Game Over — Pontuação: ${score}`);
  updateRanking(score);
}

function showOverlay(text){
  const container=document.getElementById('overlayContainer'); container.innerHTML='';
  const el=document.createElement('div'); el.className='game-overlay';
  el.innerHTML=`<div class="overlay-box card"><h2>${text}</h2>
  <button id="overlayRestart">Restart</button></div>`;
  container.appendChild(el);
  document.getElementById('overlayRestart').addEventListener('click',()=>{ container.innerHTML=''; restartGame(); });
}

function updateRanking(score){
  rankings.push(score); rankings.sort((a,b)=>b-a); if(rankings.length>5) rankings.pop();
  rankingList.innerHTML='';
  rankings.forEach((s,i)=>{
    const div=document.createElement('div'); div.textContent=`${i+1}º - ${s}`;
    div.className='rank-item '+(i<3?'rank-red':'rank-green'); rankingList.appendChild(div);
  });
}

window.addEventListener('keydown',(e)=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return; e.preventDefault();
  switch(e.key){ case 'ArrowUp': nextDir={x:0,y:-1}; break; case 'ArrowDown': nextDir={x:0,y:1}; break; case 'ArrowLeft': nextDir={x:-1,y:0}; break; case 'ArrowRight': nextDir={x:1,y:0}; break;}
  if(!started) startGame();
});

startBtn.addEventListener('click',()=>startGame());
pauseBtn.addEventListener('click',()=>pauseGame());
continueBtn.addEventListener('click',()=>continueGame());
restartBtn.addEventListener('click',()=>restartGame());

gridSizeSelect.addEventListener('change',()=>{ recomputeGrid(); initGame(); });
wallModeSelect.addEventListener('change',()=>{ wallMode=wallModeSelect.value; });

initGame();
})();
