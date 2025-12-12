/* === SYSTEME PRINCIPAL === */
const App = {
    launch: function(gameId) {
        document.getElementById('lobby-view').classList.remove('active');
        document.getElementById('game-interface').classList.add('active');
        document.querySelectorAll('.stage-item').forEach(el => el.classList.remove('active'));
        document.getElementById('stage-' + gameId).classList.add('active');
        document.getElementById('active-game-title').innerText = gameId.toUpperCase();
        this.loadControls(gameId);
        if(gameId === 'roulette') Roulette.initWheel();
    },
    exit: function() {
        document.getElementById('game-interface').classList.remove('active');
        document.getElementById('lobby-view').classList.add('active');
    },
    loadControls: function(gameId) {
        const container = document.getElementById('controls-container');
        container.innerHTML = '';
        let html = `<div class="control-group"><label>Montant du pari (€)</label><input type="number" id="bet-input" value="10"></div>`;
        if (gameId === 'mines') {
            html += `<div class="control-group"><label>Mines</label><select id="mines-count"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option><option value="10">10</option></select></div><button id="btn-action" class="action-btn btn-green" onclick="Mines.start()">JOUER</button>`;
        } else if (gameId === 'crash') {
            html += `<button id="btn-action" class="action-btn btn-green" onclick="Crash.start()">LANCER</button>`;
        } else if (gameId === 'blackjack') {
            html += `<button id="btn-deal" class="action-btn btn-green" onclick="Blackjack.deal()">DISTRIBUER</button><div id="bj-actions" style="display:none; gap:10px; margin-top:10px;"><button class="action-btn" style="background:#444; color:#fff;" onclick="Blackjack.hit()">Tirer</button><button class="action-btn btn-green" onclick="Blackjack.stand()">Rester</button></div>`;
        } else if (gameId === 'roulette') {
            html += `<div id="roulette-info" class="control-group" style="text-align:center; color:#aaa; font-size:12px;">Placez votre pari sur le tapis</div><button id="btn-action" class="action-btn btn-green" onclick="Roulette.spin()">TOURNER</button>`;
        } else if (gameId === 'plinko') {
            html += `<button class="action-btn btn-green" onclick="Plinko.drop()">LÂCHER</button>`;
        } else if (gameId === 'dice') {
            html += `<button class="action-btn btn-green" onclick="Dice.roll()">LANCER</button>`;
        }
        container.innerHTML = html;
    }
};

/* === WALLET === */
const Wallet = {
    balance: 1000.00,
    update: function(amount) {
        this.balance += amount;
        document.getElementById('global-balance').innerText = this.balance.toFixed(2) + ' €';
        document.getElementById('ingame-balance').innerText = this.balance.toFixed(2) + ' €';
    },
    open: function() { document.getElementById('modal-wallet').style.display = 'flex'; },
    close: function() { document.getElementById('modal-wallet').style.display = 'none'; },
    add: function(amt) { this.update(amt); this.close(); },
    getBet: function() {
        const val = parseFloat(document.getElementById('bet-input').value);
        if (isNaN(val) || val <= 0 || val > this.balance) { alert("Mise invalide ou solde insuffisant"); return null; }
        return val;
    }
};

/* === JEU ROULETTE (COMPLET) === */
const Roulette = {
    spinning: false, currentBet: null,
    wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    redNums: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],

    initWheel: function() {
        const wheel = document.getElementById('roulette-wheel');
        wheel.innerHTML = '';
        this.wheelNumbers.forEach((num, i) => {
            const el = document.createElement('div');
            el.className = 'wheel-number';
            el.innerText = num;
            el.style.transform = `rotate(${i * (360/37)}deg)`;
            wheel.appendChild(el);
        });
    },

    select: function(betType) {
        if(this.spinning) return;
        this.currentBet = betType;
        document.querySelectorAll('.bet-spot').forEach(el => el.classList.remove('selected'));
        // Astuce pour sélectionner la bonne case sur le tapis
        let selector = `.bet-spot[onclick*="'${betType}'"]`;
        if(!isNaN(parseInt(betType))) selector = `.num-${betType}`;
        const spot = document.querySelector(selector);
        if(spot) spot.classList.add('selected');
        
        let text = `Pari sur : ${betType}`;
        if(!isNaN(parseInt(betType))) text = `Pari sur le numéro ${betType}`;
        document.getElementById('roulette-info').innerText = text;
    },

    spin: function() {
        if(!this.currentBet) return alert("Veuillez placer un pari sur le tapis !");
        const bet = Wallet.getBet();
        if(!bet) return;
        Wallet.update(-bet);
        this.spinning = true;
        document.getElementById('roulette-result').innerText = "";

        // Tirage du numéro gagnant
        const winningNumber = Math.floor(Math.random() * 37);
        const winningIndex = this.wheelNumbers.indexOf(winningNumber);
        
        // Calcul de l'angle pour s'arrêter sur le numéro
        const singleSegment = 360 / 37;
        // L'angle cible est l'opposé de l'index car la roue tourne dans le sens horaire
        // On ajoute des tours complets (ex: 5 tours = 1800deg) + un petit décalage pour centrer
        const targetAngle = (winningIndex * singleSegment * -1) - 1800 - (singleSegment/2);
        
        const wheel = document.getElementById('roulette-wheel');
        wheel.style.transform = `rotate(${targetAngle}deg)`;

        setTimeout(() => {
            this.checkWin(winningNumber, bet);
            this.spinning = false;
        }, 5000); // Durée de l'animation CSS
    },

    checkWin: function(num, bet) {
        let won = false;
        let payout = 0;
        const isRed = this.redNums.includes(num);
        const isEven = num !== 0 && num % 2 === 0;

        // Logique de gain selon le type de pari
        if (!isNaN(parseInt(this.currentBet))) { // Pari sur un numéro plein
            if (parseInt(this.currentBet) === num) { won = true; payout = 35; }
        } else if (this.currentBet === 'red') { if (isRed) { won = true; payout = 1; }
        } else if (this.currentBet === 'black') { if (num !== 0 && !isRed) { won = true; payout = 1; }
        } else if (this.currentBet === 'even') { if (isEven) { won = true; payout = 1; }
        } else if (this.currentBet === 'odd') { if (num !== 0 && !isEven) { won = true; payout = 1; }
        } else if (this.currentBet === '1-18') { if (num >= 1 && num <= 18) { won = true; payout = 1; }
        } else if (this.currentBet === '19-36') { if (num >= 19 && num <= 36) { won = true; payout = 1; }
        } else if (this.currentBet === '1st12') { if (num >= 1 && num <= 12) { won = true; payout = 2; }
        } else if (this.currentBet === '2nd12') { if (num >= 13 && num <= 24) { won = true; payout = 2; }
        } else if (this.currentBet === '3rd12') { if (num >= 25 && num <= 36) { won = true; payout = 2; }
        } else if (this.currentBet.startsWith('col')) { // Colonnes
            const colNum = parseInt(this.currentBet.slice(3));
            if (num !== 0 && (num % 3 === 0 ? 3 : num % 3) === (4 - colNum)) { won = true; payout = 2; }
        }

        const resDiv = document.getElementById('roulette-result');
        const colorSpan = num === 0 ? '<span style="color:#00e701">0</span>' : (isRed ? `<span style="color:#ff4655">${num}</span>` : `<span>${num}</span>`);
        
        if (won) {
            const winAmount = bet * (payout + 1); // Mise + Gain
            Wallet.update(winAmount);
            resDiv.innerHTML = `Résultat: ${colorSpan}. GAGNÉ ! (+${winAmount.toFixed(2)}€)`;
            resDiv.style.color = '#00e701';
        } else {
            resDiv.innerHTML = `Résultat: ${colorSpan}. PERDU...`;
            resDiv.style.color = '#ff4655';
        }
    }
};

/* === AUTRES JEUX (Version simplifiée pour tenir dans la réponse) === */
// ... (Les codes de Mines, Crash, Blackjack, Plinko, Dice sont identiques à la réponse précédente. Je ne les remets pas ici pour gagner de la place, mais ils sont essentiels pour que tout fonctionne. Assure-toi de les avoir dans ton fichier script.js final.)
/* === JEU 1: MINES === */
const Mines = {
    active: false, grid: [], bet: 0, multiplier: 1,
    start: function() {
        const bet = Wallet.getBet();
        if (!bet) return;
        Wallet.update(-bet);
        this.bet = bet;
        this.active = true;
        this.multiplier = 1;
        const minesCount = parseInt(document.getElementById('mines-count').value);
        const btn = document.getElementById('btn-action');
        btn.innerText = "CASHOUT (1.00x)";
        btn.className = "action-btn btn-red";
        btn.onclick = () => this.cashout();
        this.grid = Array(25).fill('gem');
        let placed = 0;
        while(placed < minesCount) {
            let i = Math.floor(Math.random()*25);
            if(this.grid[i] === 'gem') { this.grid[i] = 'bomb'; placed++; }
        }
        const board = document.getElementById('mines-grid');
        board.innerHTML = '';
        for(let i=0; i<25; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.onclick = () => this.click(i, tile);
            board.appendChild(tile);
        }
    },
    click: function(i, el) {
        if(!this.active || el.classList.contains('revealed')) return;
        el.classList.add('revealed');
        if(this.grid[i] === 'bomb') {
            el.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            el.classList.add('bomb');
            this.end(false);
        } else {
            el.innerHTML = '<i class="fa-regular fa-gem"></i>';
            el.classList.add('gem');
            this.multiplier *= 1.15;
            const win = (this.bet * this.multiplier).toFixed(2);
            document.getElementById('btn-action').innerText = `CASHOUT (${win} €)`;
        }
    },
    cashout: function() {
        if(!this.active) return;
        Wallet.update(this.bet * this.multiplier);
        this.end(true);
    },
    end: function(win) {
        this.active = false;
        const btn = document.getElementById('btn-action');
        btn.innerText = win ? "GAGNÉ ! REJOUER" : "PERDU... REJOUER";
        btn.className = "action-btn btn-green";
        btn.onclick = () => this.start();
        document.querySelectorAll('.mine-tile').forEach((el, i) => {
            el.classList.add('revealed');
            if(this.grid[i] === 'bomb') {
                el.classList.add('bomb');
                el.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            } else {
                el.style.opacity = '0.5';
            }
        });
    }
};
/* === JEU 2: CRASH === */
const Crash = {
    running: false, mult: 1, interval: null, bet: 0,
    start: function() {
        if(this.running) return;
        const bet = Wallet.getBet();
        if(!bet) return;
        Wallet.update(-bet);
        this.bet = bet;
        this.running = true;
        this.mult = 1.00;
        document.getElementById('crash-text').classList.remove('crashed');
        document.getElementById('crash-text').innerText = "1.00x";
        const btn = document.getElementById('btn-action');
        btn.innerText = "RETIRER";
        btn.className = "action-btn btn-red";
        btn.onclick = () => this.cashout();
        const crashPoint = (Math.random() * 5) + 1;
        const rocket = document.getElementById('rocket');
        rocket.style.bottom = "20px"; rocket.style.left = "20px";
        this.interval = setInterval(() => {
            this.mult += 0.01 + (this.mult * 0.005);
            document.getElementById('crash-text').innerText = this.mult.toFixed(2) + "x";
            rocket.style.bottom = Math.min(this.mult * 30, 300) + "px";
            rocket.style.left = Math.min(this.mult * 50, 400) + "px";
            if(this.mult >= crashPoint) this.crash();
        }, 50);
    },
    cashout: function() {
        if(!this.running) return;
        clearInterval(this.interval);
        this.running = false;
        Wallet.update(this.bet * this.mult);
        this.resetBtn("GAGNÉ");
    },
    crash: function() {
        clearInterval(this.interval);
        this.running = false;
        document.getElementById('crash-text').classList.add('crashed');
        document.getElementById('rocket').innerHTML = '<i class="fa-solid fa-explosion"></i>';
        this.resetBtn("PERDU");
        setTimeout(() => document.getElementById('rocket').innerHTML = '<i class="fa-solid fa-rocket"></i>', 2000);
    },
    resetBtn: function(txt) {
        const btn = document.getElementById('btn-action');
        btn.innerText = txt;
        btn.className = "action-btn btn-green";
        btn.onclick = () => this.start();
    }
};
/* === JEU 4: BLACKJACK === */
const Blackjack = {
    deck: [], ph: [], dh: [], bet: 0,
    deal: function() {
        const bet = Wallet.getBet();
        if(!bet) return;
        Wallet.update(-bet);
        this.bet = bet;
        const s=['♥','♦','♣','♠'], v=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        this.deck = [];
        for(let su of s) for(let va of v) this.deck.push({s:su, v:va});
        this.deck.sort(()=>Math.random()-0.5);
        this.ph = [this.card(), this.card()];
        this.dh = [this.card()];
        this.ui();
        document.getElementById('btn-deal').style.display = 'none';
        document.getElementById('bj-actions').style.display = 'flex';
        document.getElementById('bj-msg').innerText = '';
    },
    card: function() { return this.deck.pop(); },
    score: function(h) {
        let sc=0, ac=0;
        for(let c of h) {
            if(['J','Q','K'].includes(c.v)) sc+=10;
            else if(c.v==='A') { sc+=11; ac++; }
            else sc+=parseInt(c.v);
        }
        while(sc>21 && ac>0) { sc-=10; ac--; }
        return sc;
    },
    hit: function() {
        this.ph.push(this.card());
        this.ui();
        if(this.score(this.ph)>21) this.end(false);
    },
    stand: function() {
        while(this.score(this.dh)<17) this.dh.push(this.card());
        this.ui();
        const p=this.score(this.ph), d=this.score(this.dh);
        if(d>21 || p>d) this.end(true);
        else if(p===d) this.end('draw');
        else this.end(false);
    },
    end: function(res) {
        document.getElementById('btn-deal').style.display = 'block';
        document.getElementById('bj-actions').style.display = 'none';
        const msg = document.getElementById('bj-msg');
        if(res===true) { Wallet.update(this.bet*2); msg.innerText="GAGNÉ"; msg.style.color="#0f0"; }
        else if(res==='draw') { Wallet.update(this.bet); msg.innerText="EGALITÉ"; msg.style.color="#fff"; }
        else { msg.innerText="PERDU"; msg.style.color="#f00"; }
    },
    ui: function() {
        const draw = (h, id) => {
            const el = document.getElementById(id);
            el.innerHTML = '';
            h.forEach(c => {
                const isRed = ['♥','♦'].includes(c.s);
                el.innerHTML += `<div class="bj-card ${isRed?'red':''}">${c.v}${c.s}</div>`;
            });
        };
        draw(this.ph, 'pl-hand');
        draw(this.dh, 'dl-hand');
        document.getElementById('pl-score').innerText = this.score(this.ph);
        document.getElementById('dl-score').innerText = this.score(this.dh);
    }
};
/* === JEU 5: PLINKO === */
const Plinko = {
    init: function() {
        const b = document.getElementById('plinko-board');
        if(b.children.length > 0) return;
        for(let i=0; i<8; i++) {
            const row = document.createElement('div');
            row.className = 'plinko-row';
            for(let j=0; j<=i; j++) row.appendChild(document.createElement('div')).className='peg';
            b.appendChild(row);
        }
        const bins = document.createElement('div');
        bins.className = 'plinko-bins';
        [5,2,0.5,0.2,0.5,2,5].forEach(m => {
            const bin = document.createElement('div');
            bin.className = 'bin'; bin.innerText = m+'x';
            bin.style.background = m>=1 ? '#00e701' : '#ff4655';
            bins.appendChild(bin);
        });
        b.appendChild(bins);
    },
    drop: function() {
        this.init();
        const bet = Wallet.getBet();
        if(!bet) return;
        Wallet.update(-bet);
        const b = document.getElementById('plinko-board');
        const ball = document.createElement('div');
        ball.className = 'plinko-ball';
        ball.style.left = '50%';
        b.appendChild(ball);
        let path=0;
        for(let i=0; i<6; i++) if(Math.random()>0.5) path++;
        let row=0;
        const int = setInterval(() => {
            row++;
            ball.style.top = (row * 35) + 'px';
            ball.style.transform = `translateX(${(Math.random()-0.5)*20}px)`;
            if(row >= 8) {
                clearInterval(int);
                ball.remove();
                const mults = [5,2,0.5,0.2,0.5,2,5];
                const idx = Math.max(0, Math.min(6, path));
                const win = bet * mults[idx];
                Wallet.update(win);
            }
        }, 100);
    }
};
/* === JEU 6: DICE === */
const Dice = {
    updateUI: function() {
        const val = document.getElementById('dice-slider').value;
        document.getElementById('dice-target-val').innerText = val;
        document.getElementById('dice-mult-val').innerText = (98/val).toFixed(2)+"x";
    },
    roll: function() {
        const bet = Wallet.getBet();
        if(!bet) return;
        Wallet.update(-bet);
        const target = parseInt(document.getElementById('dice-slider').value);
        const display = document.getElementById('dice-display');
        let c = 0;
        const int = setInterval(() => {
            display.innerText = (Math.random()*100).toFixed(2);
            c++;
            if(c>10) {
                clearInterval(int);
                const res = Math.random()*100;
                display.innerText = res.toFixed(2);
                if(res < target) {
                    display.className = "dice-big-number win";
                    Wallet.update(bet * (98/target));
                } else {
                    display.className = "dice-big-number lose";
                }
            }
        }, 50);
    }
};
