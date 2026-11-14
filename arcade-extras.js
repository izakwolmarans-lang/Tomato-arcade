/* Additional arcade friends and ten original, classic-style mini-games. */
(() => {
  const grid = document.querySelector('#game-grid');
  const dialog = document.querySelector('#game-dialog');
  const stage = document.querySelector('#game-stage');
  const heading = document.querySelector('#dialog-title');
  if (!grid || !dialog || !stage) return;

  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'arcade-extras.css'; document.head.append(css);

  const friends = document.createElement('section');
  friends.className = 'arcade-friends';
  friends.innerHTML = '<div><p class="eyebrow">MEET YOUR ARCADE CREW</p><h2>More friends. <span>More fun.</span></h2><p>Our little arcade has a whole bunch of characters cheering you on.</p></div><div class="friend-list" aria-label="Arcade characters"><span title="Bunny">🐰</span><span title="Frog">🐸</span><span title="Fox">🦊</span><span title="Penguin">🐧</span><span title="Cat">🐱</span><span title="Robot">🤖</span><span title="Dinosaur">🦖</span><span title="Bee">🐝</span></div>';
  document.querySelector('.hero')?.after(friends);

  const games = [
    ['Tic-Tac-Toe','❌','Play tic-tac-toe against a friendly computer.','tictactoe'],
    ['Pong','🏓','Keep the ball in play and beat the computer.','pong'],
    ['Breakout','🧱','Bounce the ball to clear every brick.','breakout'],
    ['Whack-a-Mole','🐹','Tap each mole before it pops away.','mole'],
    ['Simon Says','🎵','Remember the light-up sequence.','simon'],
    ['Rock Paper Scissors','✂️','Choose your move and challenge the computer.','rps'],
    ['Number Guess','🔢','Can you find the secret number in seven tries?','guess'],
    ['Reaction Test','⚡','Wait for green, then tap as quickly as you can.','reaction'],
    ['Connect Four','🔴','Connect four in a row against a simple computer.','connect'],
    ['Cookie Clicker','🍪','Click cookies to rack up as many points as possible.','cookie']
  ];
  const icons = ['❌','🏓','🧱','🐹','🎵','✂️','🔢','⚡','🔴','🍪'];
  games.forEach(([name, icon, description, id], index) => {
    const card = document.createElement('article');
    card.className = 'game-card'; card.dataset.category = index === 0 || index === 6 || index === 8 ? 'puzzle' : 'classic';
    card.dataset.name = `${name} classic ${id} arcade`;
    card.innerHTML = `<div class="game-art classic-art classic-art-${id}"><span class="art-label">CLASSIC ARCADE</span><span aria-hidden="true">${icon}</span></div><div class="game-info"><div><h3>${name}</h3><p>${description}</p></div><span class="game-rating">${icon}</span></div><button class="play-button" type="button">Play now <span aria-hidden="true">→</span></button>`;
    card.querySelector('button').addEventListener('click', () => openGame({ name, id }));
    grid.append(card);
  });

  function updateCards() {
    const query = document.querySelector('#game-search')?.value.trim().toLowerCase() || '';
    const category = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
    const allCards = [...grid.querySelectorAll('.game-card')];
    allCards.forEach((card) => {
      if (!games.some((game) => game[3] && card.dataset.name.includes(game[3]))) return;
      card.hidden = !(card.dataset.name.includes(query) && (category === 'all' || card.dataset.category === category));
    });
    const count = document.querySelector('[data-filter="all"] span'); if (count) count.textContent = String(allCards.length);
    const empty = document.querySelector('#no-results'); if (empty) empty.hidden = allCards.some((card) => !card.hidden);
  }
  document.querySelector('#game-search')?.addEventListener('input', updateCards);
  document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', updateCards));

  let cleanup = () => {};
  dialog.addEventListener('close', () => cleanup());
  function button(label, fn) { const el = document.createElement('button'); el.type = 'button'; el.className = 'game-primary'; el.textContent = label; el.addEventListener('click', fn); return el; }
  function score(game, points) { window.dispatchEvent(new CustomEvent('tomato:score', { detail: { game, score: Math.max(0, Math.floor(points)) } })); }
  function openGame(game) {
    cleanup(); heading.textContent = game.name;
    stage.innerHTML = '<section class="classic-game"><p class="classic-instructions"></p><div class="classic-status" aria-live="polite"></div><div class="classic-board"></div><div class="classic-actions"></div></section>';
    const instructions = stage.querySelector('.classic-instructions'); const status = stage.querySelector('.classic-status'); const board = stage.querySelector('.classic-board'); const actions = stage.querySelector('.classic-actions');
    if (!dialog.open) dialog.showModal();
    const say = (text) => { status.textContent = text; };
    const set = (html) => { board.innerHTML = html; };
    const add = (label, fn) => actions.append(button(label, fn));
    let timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    cleanup = () => timers.forEach(clearTimeout);

    if (game.id === 'tictactoe') {
      instructions.textContent = 'Tap a square. Get three in a row before the computer does!';
      let cells = Array(9).fill(''), over = false;
      const paint = () => { set(cells.map((v, i) => `<button class="classic-cell" data-cell="${i}" aria-label="Square ${i + 1}">${v}</button>`).join('')); };
      const win = (p) => [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line => line.every(i => cells[i] === p));
      paint(); say('Your turn: X');
      board.addEventListener('click', (e) => { const cell = e.target.closest('[data-cell]'); if (!cell || over || cells[cell.dataset.cell]) return; cells[cell.dataset.cell] = '✕'; if (win('✕')) { over=true; paint(); say('You win!'); score(game.name, 10); return; } if (cells.every(Boolean)) { over=true; paint(); say('It’s a draw!'); score(game.name, 5); return; } const empty=cells.map((v,i)=>v?null:i).filter(v=>v!==null); cells[empty[Math.floor(Math.random()*empty.length)]]='○'; if(win('○')){over=true;say('Computer wins this round. Try again!');} else if(cells.every(Boolean)){over=true;say('It’s a draw!');score(game.name,5);} else say('Your turn: X'); paint(); });
      add('New round', () => openGame(game));
    } else if (game.id === 'rps') {
      instructions.textContent = 'Best of as many rounds as you like. Choose rock, paper, or scissors.'; let points=0, wins=0;
      set('<div class="rps-result">✊ ✋ ✌️</div>'); say('Choose your move!');
      [['Rock','✊'],['Paper','✋'],['Scissors','✌️']].forEach(([name,icon])=>add(`${icon} ${name}`,()=>{ const options=[['Rock','✊'],['Paper','✋'],['Scissors','✌️']]; const cpu=options[Math.floor(Math.random()*3)]; const result=name===cpu[0]?'Draw!':(name==='Rock'&&cpu[0]==='Scissors'||name==='Paper'&&cpu[0]==='Rock'||name==='Scissors'&&cpu[0]==='Paper')?'You win!':'Computer wins!'; if(result==='You win!'){wins++;points+=1;} say(`You: ${icon}  Computer: ${cpu[1]} — ${result} Wins: ${wins}`); board.querySelector('.rps-result').textContent=`${icon}  vs  ${cpu[1]}`; score(game.name,points); }));
    } else if (game.id === 'guess') {
      instructions.textContent = 'I picked a number from 1 to 50. You get seven guesses.'; let secret=Math.floor(Math.random()*50)+1, tries=7, done=false;
      set('<form class="guess-form"><input type="number" min="1" max="50" required aria-label="Your guess" placeholder="1–50"><button class="game-primary">Guess</button></form>'); say('Make your first guess!');
      board.querySelector('form').addEventListener('submit',e=>{e.preventDefault(); if(done)return; const input=board.querySelector('input'); const guess=Number(input.value); if(guess<1||guess>50)return; tries--; if(guess===secret){done=true;say(`Correct! You got it with ${tries+1} tries left.`);score(game.name,tries+1);} else if(!tries){done=true;say(`Out of guesses! The number was ${secret}.`);score(game.name,0);} else say(`${guess<secret?'Too low':'Too high'} — ${tries} guesses left.`); input.value=''; });
      add('New number',()=>openGame(game));
    } else if (game.id === 'reaction') {
      instructions.textContent = 'Tap start, wait for the board to turn green, then tap it as quickly as possible.'; let phase='idle', started=0, delayTimer;
      const start=()=>{phase='wait';board.className='classic-board reaction-board waiting';set('<button class="reaction-target">Wait for green…</button>');say('Wait for green…'); delayTimer=later(()=>{if(phase!=='wait')return;phase='go';started=performance.now();board.classList.remove('waiting');board.classList.add('go');board.querySelector('button').textContent='TAP NOW!';say('Tap!');},900+Math.random()*2400);};
      const tap=()=>{if(phase==='wait'){clearTimeout(delayTimer);phase='idle';say('Too soon! Try again.');return;} if(phase==='go'){const ms=Math.round(performance.now()-started);phase='idle';say(`Your reaction time: ${ms} ms!`);score(game.name,Math.max(1,1000-ms));}};
      add('Start test',start); board.addEventListener('click',tap);
    } else if (game.id === 'mole') {
      instructions.textContent='Tap the mole when it appears. Score as many as you can in 20 seconds!'; let points=0, remaining=20, active=0, playing=false;
      set(Array.from({length:9},(_,i)=>`<button class="mole-hole" data-hole="${i}" aria-label="Hole ${i+1}">·</button>`).join('')); say('Press start!');
      const pop=()=>{if(!playing)return; board.querySelectorAll('.mole-hole').forEach(b=>b.textContent='·'); active=Math.floor(Math.random()*9); board.querySelector(`[data-hole="${active}"]`).textContent='🐹';};
      board.addEventListener('click',e=>{if(playing&&e.target.dataset.hole!==undefined&&Number(e.target.dataset.hole)===active){points++;say(`Score: ${points} · ${remaining}s left`);pop();}});
      add('Start 20s',()=>{points=0;remaining=20;playing=true;pop(); const t=setInterval(()=>{remaining--;say(`Score: ${points} · ${remaining}s left`);if(remaining<=0){clearInterval(t);playing=false;say(`Time! Final score: ${points}`);score(game.name,points);}},1000);timers.push(t);});
    } else if (game.id === 'simon') {
      instructions.textContent='Watch the sequence, then repeat it by tapping the colored pads.'; const colors=['coral','blue','gold','green']; let seq=[], input=0, locked=true, best=0;
      set('<div class="simon-grid">'+colors.map((c,i)=>`<button class="simon-pad ${c}" data-pad="${i}" aria-label="${c}"></button>`).join('')+'</div>'); say('Press Start to play.');
      const flash=(i)=>{const b=board.querySelector(`[data-pad="${i}"]`);b.classList.add('lit');later(()=>b.classList.remove('lit'),300);};
      const show=()=>{locked=true;seq.forEach((v,i)=>later(()=>flash(v),500*i+250));later(()=>{locked=false;input=0;say(`Your turn — sequence length ${seq.length}`);},seq.length*500+350);};
      board.addEventListener('click',e=>{const b=e.target.closest('[data-pad]');if(!b||locked||!seq.length)return;const v=Number(b.dataset.pad);flash(v);if(v!==seq[input]){say(`Oops! You reached ${best}.`);score(game.name,best);locked=true;return;}input++;if(input===seq.length){best++;seq.push(Math.floor(Math.random()*4));say('Nice! Watch the next one.');show();}});
      add('Start sequence',()=>{seq=[Math.floor(Math.random()*4)];best=0;show();});
    } else if (game.id === 'cookie') {
      instructions.textContent='Click the big cookie for 20 seconds. How many can you bake?'; let points=0, left=20, playing=false;
      set('<button class="cookie-button" aria-label="Click cookie">🍪</button>'); say('Press start to begin!');
      board.querySelector('button').addEventListener('click',()=>{if(!playing)return;points++;board.querySelector('button').classList.add('cookie-bop');setTimeout(()=>board.querySelector('button')?.classList.remove('cookie-bop'),80);say(`Cookies: ${points} · ${left}s`);});
      add('Start baking',()=>{points=0;left=20;playing=true;const t=setInterval(()=>{left--;say(`Cookies: ${points} · ${left}s`);if(left<=0){playing=false;clearInterval(t);say(`Fresh batch: ${points} cookies!`);score(game.name,points);}},1000);timers.push(t);});
    } else if (game.id === 'pong') {
      instructions.textContent='Move your paddle with your finger or ↑ / ↓. First to 5 wins.'; set('<canvas class="classic-canvas" width="480" height="300" aria-label="Pong court"></canvas>');
      const c=board.querySelector('canvas'),x=c.getContext('2d'); let py=130, by=150,bx=240,vx=190,vy=120,me=0,cpu=0,playing=false,raf,last=0;
      const draw=()=>{x.fillStyle='#192137';x.fillRect(0,0,480,300);x.setLineDash([8,9]);x.strokeStyle='#ffffff44';x.beginPath();x.moveTo(240,0);x.lineTo(240,300);x.stroke();x.setLineDash([]);x.fillStyle='#fff';x.fillRect(18,py,10,55);x.fillRect(452,by-25,10,50);x.beginPath();x.arc(bx,by,8,0,7);x.fill();x.font='22px sans-serif';x.fillText(`${me}  :  ${cpu}`,215,28);};
      const frame=t=>{if(!playing)return;const dt=Math.min((t-(last||t))/1000,.04);last=t;by+=(by<by+0?0:Math.sign((by+25)-by))*0; const opponent=by; if(opponent>by){}; bx+=vx*dt;by+=vy*dt; const cpuY=board._cpu||125; board._cpu=Math.max(0,Math.min(250,cpuY+Math.sign(by-cpuY-25)*145*dt)); if(by<8||by>292)vy*=-1;if(bx<32&&by>py&&by<py+55){vx=Math.abs(vx)*1.04;}if(bx>442&&by>board._cpu&&by<board._cpu+50)vx=-Math.abs(vx)*1.04;if(bx<0){cpu++;bx=240;by=150;vx=190;}if(bx>480){me++;bx=240;by=150;vx=-190;}draw();if(me>=5||cpu>=5){playing=false;say(me>=5?'You win Pong!':'Computer wins this time!');score(game.name,me);return;}raf=requestAnimationFrame(frame);};
      const move=e=>{const r=c.getBoundingClientRect();py=Math.max(0,Math.min(245,(e.clientY-r.top)*300/r.height-27));};c.addEventListener('pointermove',move);window.addEventListener('keydown',e=>{if(e.key==='ArrowUp')py=Math.max(0,py-18);if(e.key==='ArrowDown')py=Math.min(245,py+18);});
      add('Start Pong',()=>{me=0;cpu=0;bx=240;by=150;vx=190;vy=120;board._cpu=125;playing=true;say('First to five!');cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);});draw(); cleanup=()=>{playing=false;cancelAnimationFrame(raf);};
    } else if (game.id === 'breakout') {
      instructions.textContent='Move your finger or mouse to steer the paddle. Clear the bricks!'; set('<canvas class="classic-canvas" width="480" height="320" aria-label="Breakout game"></canvas>');
      const c=board.querySelector('canvas'),x=c.getContext('2d');let px=215,bx=240,by=260,vx=150,vy=-180,points=0,bricks=[],raf,playing=false,last=0;
      const init=()=>{bricks=[];for(let r=0;r<4;r++)for(let col=0;col<8;col++)bricks.push({x:16+col*57,y:30+r*23,alive:true,color:['#ff7262','#ffc857','#69d9b2','#8a9bff'][r]});};
      const draw=()=>{x.fillStyle='#20253b';x.fillRect(0,0,480,320);bricks.forEach(b=>{if(b.alive){x.fillStyle=b.color;x.fillRect(b.x,b.y,50,16);}});x.fillStyle='#fff';x.fillRect(px,294,52,9);x.beginPath();x.arc(bx,by,7,0,7);x.fill();};
      const frame=t=>{if(!playing)return;const dt=Math.min((t-(last||t))/1000,.04);last=t;bx+=vx*dt;by+=vy*dt;if(bx<7||bx>473)vx*=-1;if(by<7)vy=Math.abs(vy);if(by>285&&bx>px-5&&bx<px+57){vy=-Math.abs(vy);vx+=(bx-(px+26))*2;}bricks.forEach(b=>{if(b.alive&&bx>b.x&&bx<b.x+50&&by>b.y&&by<b.y+16){b.alive=false;vy*=-1;points++;say(`Bricks: ${points}`);}});if(by>320){playing=false;say(`Ball lost. Bricks cleared: ${points}`);score(game.name,points);draw();return;}if(bricks.every(b=>!b.alive)){playing=false;say('You cleared every brick!');score(game.name,points);draw();return;}draw();raf=requestAnimationFrame(frame);};
      c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();px=Math.max(0,Math.min(428,(e.clientX-r.left)*480/r.width-26));});
      add('Start Breakout',()=>{init();points=0;bx=240;by=260;vx=150;vy=-180;playing=true;last=0;say('Break the bricks!');cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);});init();draw();cleanup=()=>{playing=false;cancelAnimationFrame(raf);};
    } else if (game.id === 'connect') {
      instructions.textContent='Tap a column to drop your red disc. First to connect four wins.'; let cells=Array(42).fill(''),over=false;
      const paint=()=>set('<div class="connect-grid">'+Array.from({length:42},(_,i)=>`<button data-slot="${i}" aria-label="Row ${Math.floor(i/7)+1} column ${i%7+1}">${cells[i]}</button>`).join('')+'</div>');
      const winner=p=>{for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(cells[r*7+c]===p){for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])if(Array.from({length:4},(_,k)=>[r+dr*k,c+dc*k]).every(([rr,cc])=>rr>=0&&rr<6&&cc>=0&&cc<7&&cells[rr*7+cc]===p))return true;}return false;};
      const drop=(col,p)=>{for(let r=5;r>=0;r--)if(!cells[r*7+col]){cells[r*7+col]=p;return true;}return false;};
      paint();say('You are 🔴.');board.addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(!b||over)return;const col=Number(b.dataset.slot)%7;if(!drop(col,'🔴'))return;paint();if(winner('🔴')){over=true;say('Four in a row! You win!');score(game.name,10);return;}if(cells.every(Boolean)){over=true;say('Draw!');return;}let cpuCol=Math.floor(Math.random()*7);for(let n=0;n<7&&!drop(cpuCol,'🟡');n++)cpuCol=(cpuCol+1)%7;paint();if(winner('🟡')){over=true;say('The computer got four! Try again.');}else say('Your turn!');});add('New board',()=>openGame(game));
    }
  }
})();
