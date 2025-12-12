/* --- APPLICATION CENTRALE --- */
const App = {
    balance: 1000.00,
    
    // Initialisation
    init: function() {
        this.updateDisplay();
    },

    // Navigation entre les écrans
    nav: function(screenId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        
        document.getElementById('view-' + screenId).classList.add('active');
        
        // Active le menu correspondant (pour le style)
        const btn = Array.from(document.querySelectorAll('.menu-item')).find(b => b.textContent.toLowerCase().includes(screenId));
        if(btn) btn.classList.add('active');
    },

    // Mise à jour du solde global
    updateBalance: function(amount) {
        this.balance += amount;
        this.updateDisplay();
    },

    updateDisplay: function() {
        document.getElementById('user-balance').innerText = this.balance.toFixed(2) + " €";
    }
};

/* --- SYSTEME DE PORTEFEUILLE (WALLET) --- */
const Wallet = {
    open: function() { document.getElementById('wallet-modal').style.display = 'flex'; },
    close: function() { document.getElementById('wallet-modal').style.display = 'none'; },
    add: function(amount) {
        App.updateBalance(amount);
        alert(`Succès ! ${amount}€ ajoutés.`);
        this.close();
    }
};

/* --- JEU 1 : MINES --- */
const Mines = {
    grid: [],
    active: false,
    bet: 0,
    minesCount: 3,
    multiplier: 1.0,

    start: function() {
        const betInput = parseFloat(document.getElementById('mines-bet').value);
        if(betInput > App.balance || betInput <= 0) return alert("Solde insuffisant !");
        
        App.updateBalance(-betInput);
        this.bet = betInput;
        this.minesCount = parseInt(document.getElementById('mines-count').value);
        this.active = true;
        this.multiplier = 1.0;
        
        // UI
        const btn = document.getElementById('mines-btn');
        btn.innerText = "CASHOUT (1.00x)";
        btn.classList.add('secondary'); // Devient gris ou autre couleur
        btn.onclick = () => this.cashout();

        // Génération de la grille
        this.grid = Array(25).fill('gem');
        let placed = 0;
        while(placed < this.minesCount) {
            let idx = Math.floor(Math.random() * 25);
            if(this.grid[idx] === 'gem') { this.grid[idx] = 'bomb'; placed++; }
        }
        
        this.renderGrid();
    },

    renderGrid: function() {
        const board = document.getElementById('mines-grid');
        board.innerHTML = '';
        for(let i=0; i<25; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.onclick = () => this.clickTile(i, tile);
            board.appendChild(tile);
        }
    },

    clickTile: function(idx, el) {
        if(!this.active || el.classList.contains('revealed')) return;

        el.classList.add('revealed');
        if(this.grid[idx] === 'bomb') {
            el.classList.add('bomb');
            el.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            this.end(false);
        } else {
            el.classList.add('gem');
            el.innerHTML = '<i class="fa-regular fa-gem"></i>';
            this.multiplier *= 1.15; // Logique simplifiée
            const currentWin = (this.bet * this.multiplier).toFixed(2);
            document.getElementById('mines-btn').innerText = `CASHOUT (${currentWin}€)`;
        }
    },

    cashout: function() {
        if(!this.active) return;
        const win = this.bet * this.multiplier;
        App.updateBalance(win);
        this.end(true);
    },

    end: function(win) {
        this.active = false;
        const btn = document.getElementById('mines-btn');
        btn.innerText = win ? "GAGNÉ ! REJOUER" : "PERDU... REJOUER";
        btn.classList.remove('secondary');
        btn.onclick = () => this.start();

        // Révéler tout
        const tiles = document.querySelectorAll('.mine-tile');
        tiles.forEach((t, i) => {
            t.classList.add('revealed');
            if(this.grid[i] === 'bomb') {
                t.classList.add('bomb');
                t.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            } else {
                t.classList.add('gem');
                t.style.opacity = '0.5';
            }
        });
    }
};

/* --- JEU 2 : CRASH --- */
const Crash = {
    running: false,
    multiplier: 1.00,
    bet: 0,
    interval: null,

    start: function() {
        if(this.running) return;
        const bet = parseFloat(document.getElementById('crash-bet').value);
        if(bet > App.balance) return alert("Solde insuffisant");

        App.updateBalance(-bet);
        this.bet = bet;
        this.running = true;
        this.multiplier = 1.00;
        
        // Reset UI
        const disp = document.getElementById('crash-display');
        disp.innerText = "1.00x";
        disp.classList.remove('crashed-text');
        
        const btn = document.getElementById('crash-btn');
        btn.innerText = "RETIRER";
        btn.classList.add('secondary');
        btn.onclick = () => this.cashout();

        // Animation Fusée (CSS)
        const rocket = document.getElementById('rocket');
        rocket.style.bottom = "20px";
        rocket.style.left = "20px";

        // Point de crash aléatoire
        const crashPoint = (Math.random() * 5) + 1; // Entre 1x et 6x

        this.interval = setInterval(() => {
            this.multiplier += 0.01 + (this.multiplier * 0.008);
            disp.innerText = this.multiplier.toFixed(2) + 'x';

            // Bouger la fusée (simulation visuelle simple)
            rocket.style.bottom = Math.min((this.multiplier * 20), 200) + "px";
            rocket.style.left = Math.min((this.multiplier * 40), 300) + "px";

            if(this.multiplier >= crashPoint) this.crash();
        }, 50);
    },

    cashout: function() {
        if(!this.running) return;
        clearInterval(this.interval);
        this.running = false;
        const win = this.bet * this.multiplier;
        App.updateBalance(win);
        
        const btn = document.getElementById('crash-btn');
        btn.innerText = `GAGNÉ: ${win.toFixed(2)}€`;
        btn.onclick = () => this.start();
    },

    crash: function() {
        clearInterval(this.interval);
        this.running = false;
        document.getElementById('crash-display').classList.add('crashed-text');
        document.getElementById('rocket').innerHTML = '<i class="fa-solid fa-explosion"></i>';
        
        const btn = document.getElementById('crash-btn');
        btn.innerText = "PERDU (CRASH)";
        btn.classList.remove('secondary');
        btn.onclick = () => {
             document.getElementById('rocket').innerHTML = '<i class="fa-solid fa-rocket"></i>';
             this.start();
        };
    }
};

/* --- JEU 3 : ROULETTE --- */
const Roulette = {
    spinning: false,
    betColor: null,
    
    setBet: function(color) {
        if(this.spinning) return;
        this.betColor = color;
        document.querySelectorAll('.bet-chip').forEach(c => c.classList.remove('selected'));
        document.querySelector(`.bet-chip.${color}`).classList.add('selected');
        document.getElementById('roulette-msg').innerText = `Mise sur : ${color.toUpperCase()}`;
    },

    spin: function() {
        if(!this.betColor) return alert("Sélectionnez une couleur !");
        const bet = parseFloat(document.getElementById('roulette-bet').value);
        if(bet > App.balance) return alert("Solde insuffisant");

        App.updateBalance(-bet);
        this.spinning = true;

        const deg = Math.floor(Math.random() * 360);
        const wheel = document.getElementById('wheel');
        // Rotation : actuelle + 5 tours + aléatoire
        const currentRot = wheel.style.transform ? parseInt(wheel.style.transform.match(/-?\d+/)[0]) : 0;
        const newRot = currentRot - (1800 + deg);
        
        wheel.style.transform = `rotate(${newRot}deg)`;

        setTimeout(() => {
            this.checkWin(deg, bet);
            this.spinning = false;
        }, 4000);
    },

    checkWin: function(deg, bet) {
        // Logique simplifiée (0-10 deg = vert, ensuite alternance rouge/noir approx)
        const norm = deg % 360; 
        let result = 'black';
        if(norm < 10) result = 'green';
        else if(norm % 20 < 10) result = 'red';

        const msg = document.getElementById('roulette-msg');
        if(result === this.betColor) {
            const mult = (result === 'green') ? 14 : 2;
            const win = bet * mult;
            App.updateBalance(win);
            msg.innerText = `GAGNÉ ! C'était ${result}. Gain: ${win}€`;
            msg.style.color = '#00e701';
        } else {
            msg.innerText = `PERDU... C'était ${result}.`;
            msg.style.color = '#ff4655';
        }
    }
};

/* --- JEU 4 : BLACKJACK --- */
const Blackjack = {
    deck: [], pHand: [], dHand: [], bet: 0,
    
    deal: function() {
        const bet = parseFloat(document.getElementById('bj-bet').value);
        if(bet > App.balance) return alert("Solde !");
        
        App.updateBalance(-bet);
        this.bet = bet;
        
        // Création Deck
        const suits = ['♥','♦','♣','♠'];
        const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        this.deck = [];
        for(let s of suits) for(let v of values) this.deck.push({v,s});
        this.deck.sort(() => Math.random()-0.5);

        this.pHand = [this.deck.pop(), this.deck.pop()];
        this.dHand = [this.deck.pop()];

        this.updateUI();
        document.getElementById('bj-btn-deal').style.display = 'none';
        document.getElementById('bj-controls').style.display = 'flex';
        document.getElementById('bj-result').innerText = '';
    },

    getScore: function(hand) {
        let sc = 0, aces = 0;
        for(let c of hand) {
            if(['J','Q','K'].includes(c.v)) sc+=10;
            else if(c.v === 'A') { sc+=11; aces++; }
            else sc+=parseInt(c.v);
        }
        while(sc>21 && aces>0) { sc-=10; aces--; }
        return sc;
    },

    hit: function() {
        this.pHand.push(this.deck.pop());
        this.updateUI();
        if(this.getScore(this.pHand) > 21) this.end(false);
    },

    stand: function() {
        while(this.getScore(this.dHand) < 17) this.dHand.push(this.deck.pop());
        this.updateUI();
        const p = this.getScore(this.pHand);
        const d = this.getScore(this.dHand);
        if(d > 21 || p > d) this.end(true);
        else if(p === d) this.end('draw');
        else this.end(false);
    },

    end: function(res) {
        document.getElementById('bj-btn-deal').style.display = 'block';
        document.getElementById('bj-controls').style.display = 'none';
        const msg = document.getElementById('bj-result');
        if(res === true) {
            App.updateBalance(this.bet*2);
            msg.innerText = "GAGNÉ !";
        } else if(res === 'draw') {
            App.updateBalance(this.bet);
            msg.innerText = "EGALITÉ";
        } else {
            msg.innerText = "PERDU";
        }
    },

    updateUI: function() {
        const draw = (h, el) => {
            el.innerHTML = '';
            h.forEach(c => {
                el.innerHTML += `<div class="card ${['♥','♦'].includes(c.s)?'red':''}">${c.v}${c.s}</div>`;
            });
        };
        draw(this.pHand, document.getElementById('player-hand'));
        draw(this.dHand, document.getElementById('dealer-hand'));
        document.getElementById('player-score').innerText = this.getScore(this.pHand);
        document.getElementById('dealer-score').innerText = this.getScore(this.dHand);
    }
};

/* --- JEU 5 : PLINKO --- */
const Plinko = {
    init: function() {
        // Dessiner le board une fois
        const board = document.getElementById('plinko-board');
        if(board.children.length > 0) return;
        
        for(let i=0; i<8; i++) {
            const row = document.createElement('div');
            row.className = 'plinko-row';
            for(let j=0; j<=i; j++) row.appendChild(document.createElement('div')).className = 'peg';
            board.appendChild(row);
        }
        const bins = document.createElement('div');
        bins.className = 'plinko-bins';
        [5,2,0.5,0.2,0.5,2,5].forEach(m => {
             const b = document.createElement('div');
             b.className = 'bin';
             b.innerText = m+'x';
             b.style.background = m>=1 ? '#00e701' : '#ff4655';
             bins.appendChild(b);
        });
        board.appendChild(bins);
    },

    drop: function() {
        this.init();
        const bet = parseFloat(document.getElementById('plinko-bet').value);
        if(bet > App.balance) return alert("Solde !");
        App.updateBalance(-bet);

        // Simulation trajectoire
        const board = document.getElementById('plinko-board');
        const ball = document.createElement('div');
        ball.className = 'plinko-ball';
        ball.style.left = '50%';
        board.appendChild(ball);

        let path = 0; // 0 à 6 (correspond aux bins)
        // Simulation simple : gauche ou droite aléatoire
        // On force un peu vers le centre (distribution normale)
        for(let i=0; i<6; i++) if(Math.random() > 0.5) path++;

        let row = 0;
        const int = setInterval(() => {
            row++;
            ball.style.top = (row * 30) + 'px';
            // Mouvement latéral simpliste
            const drift = (Math.random()-0.5)*20;
            ball.style.transform = `translateX(${drift}px)`;
            
            if(row >= 8) {
                clearInterval(int);
                ball.remove();
                // Map path (0-6) vers multiplicateurs
                const mults = [5,2,0.5,0.2,0.5,2,5];
                // Sécurité index
                const finalIdx = Math.max(0, Math.min(6, path));
                const win = bet * mults[finalIdx];
                App.updateBalance(win);
                console.log(`Plinko: ${mults[finalIdx]}x`);
            }
        }, 100);
    }
};

/* --- JEU 6 : DICE --- */
const Dice = {
    updateUI: function() {
        const val = document.getElementById('dice-slider').value;
        document.getElementById('dice-target-display').innerText = val;
        // Calcul mult: (99 / val) approx
        const mult = (98 / val).toFixed(2);
        const chance = val;
        document.getElementById('dice-mult').innerText = mult + "x";
        document.getElementById('dice-chance').innerText = chance + "%";
    },

    roll: function() {
        const bet = parseFloat(document.getElementById('dice-bet').value);
        if(bet > App.balance) return alert("Solde !");
        
        const target = parseInt(document.getElementById('dice-slider').value);
        App.updateBalance(-bet);

        // Animation
        const display = document.getElementById('dice-result');
        let count = 0;
        const int = setInterval(() => {
            display.innerText = (Math.random()*100).toFixed(2);
            count++;
            if(count > 10) {
                clearInterval(int);
                const res = Math.random() * 100;
                display.innerText = res.toFixed(2);
                
                if(res < target) {
                    display.className = 'dice-big-text win';
                    const mult = (98 / target);
                    App.updateBalance(bet * mult);
                } else {
                    display.className = 'dice-big-text lose';
                }
            }
        }, 50);
    }
};

// Démarrer l'app
App.init();
