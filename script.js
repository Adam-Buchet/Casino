/* --- SYSTEME CENTRAL --- */
const App = {
    balance: 1000.00,
    
    updateBalance: function(amount) {
        this.balance += amount;
        document.getElementById('user-balance').innerText = this.balance.toFixed(2) + ' €';
    }
};

// Navigation
function openGame(gameId) {
    document.getElementById('lobby-screen').style.display = 'none';
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-' + gameId).classList.add('active');
}

function backToLobby() {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('lobby-screen').style.display = 'block';
}

/* --- JEU 1 : MINES --- */
const MinesGame = {
    active: false,
    grid: [],
    minesCount: 3,
    bet: 0,
    currentMultiplier: 1.0,
    
    start: function() {
        const betInput = document.getElementById('mines-bet');
        this.bet = parseFloat(betInput.value);
        this.minesCount = parseInt(document.getElementById('mines-count').value);

        if (this.bet > App.balance || this.bet <= 0) return alert("Solde insuffisant ou mise invalide");

        App.updateBalance(-this.bet);
        this.active = true;
        this.currentMultiplier = 1.0;
        
        // UI
        const btn = document.getElementById('mines-btn');
        btn.innerText = "CASHOUT (1.00x)";
        btn.classList.add('cashout');
        btn.onclick = () => this.cashout();
        
        this.generateGrid();
    },

    generateGrid: function() {
        const gridEl = document.getElementById('mines-grid');
        gridEl.innerHTML = '';
        this.grid = Array(25).fill('gem');
        
        // Placer les mines aléatoirement
        for (let i = 0; i < this.minesCount; i++) {
            let idx;
            do { idx = Math.floor(Math.random() * 25); } while (this.grid[idx] === 'bomb');
            this.grid[idx] = 'bomb';
        }

        // Créer les cases HTML
        for (let i = 0; i < 25; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.innerHTML = '<i class="fa-solid fa-question"></i>';
            tile.onclick = () => this.clickTile(i, tile);
            gridEl.appendChild(tile);
        }
    },

    clickTile: function(index, element) {
        if (!this.active || element.classList.contains('revealed')) return;

        const type = this.grid[index];
        element.classList.add('revealed');

        if (type === 'bomb') {
            element.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            element.classList.add('bomb');
            this.gameOver(false);
        } else {
            element.innerHTML = '<i class="fa-regular fa-gem"></i>';
            element.classList.add('gem');
            this.increaseMultiplier();
        }
    },

    increaseMultiplier: function() {
        // Formule simplifiée pour le projet
        this.currentMultiplier *= 1.15; // +15% par gemme
        const winAmount = (this.bet * this.currentMultiplier).toFixed(2);
        document.getElementById('mines-btn').innerText = `CASHOUT (${winAmount} €)`;
    },

    cashout: function() {
        if (!this.active) return;
        const win = this.bet * this.currentMultiplier;
        App.updateBalance(win);
        this.gameOver(true);
    },

    gameOver: function(won) {
        this.active = false;
        const btn = document.getElementById('mines-btn');
        btn.innerText = won ? "GAGNÉ ! REJOUER" : "PERDU... REJOUER";
        btn.classList.remove('cashout');
        btn.onclick = () => this.start();
        
        // Révéler tout
        const tiles = document.querySelectorAll('.mine-tile');
        tiles.forEach((t, i) => {
            if (this.grid[i] === 'bomb') t.innerHTML = '<i class="fa-solid fa-bomb"></i>';
            t.classList.add('revealed');
            if(this.grid[i] === 'bomb') t.classList.add('bomb');
        });
    }
};

/* --- JEU 2 : CRASH --- */
const CrashGame = {
    running: false,
    multiplier: 1.00,
    crashPoint: 0,
    bet: 0,
    interval: null,

    start: function() {
        if (this.running) return;
        
        this.bet = parseFloat(document.getElementById('crash-bet').value);
        if (this.bet > App.balance) return alert("Pas assez d'argent");
        
        App.updateBalance(-this.bet);
        this.running = true;
        this.multiplier = 1.00;
        document.getElementById('crash-display').classList.remove('crash-crashed');
        
        // Point de crash aléatoire (Algo simplifié)
        // Probabilité de crash instantané : 10%
        if(Math.random() < 0.1) this.crashPoint = 1.00;
        else this.crashPoint = (Math.random() * 5) + 1; // Crash entre 1x et 6x

        const btn = document.getElementById('crash-btn');
        btn.innerText = "RETIRER";
        btn.classList.add('cashout');
        btn.onclick = () => this.cashout();

        this.interval = setInterval(() => this.update(), 50); // Loop
    },

    update: function() {
        this.multiplier += 0.01 + (this.multiplier * 0.005); // Accélération exponentielle
        document.getElementById('crash-display').innerText = this.multiplier.toFixed(2) + 'x';
        
        // Dessin simple sur Canvas (Optionnel pour faire joli)
        // ... (Code canvas simplifié ici pour ne pas surcharger) ...

        if (this.multiplier >= this.crashPoint) {
            this.crash();
        }
    },

    cashout: function() {
        if (!this.running) return;
        clearInterval(this.interval);
        this.running = false;
        
        const win = this.bet * this.multiplier;
        App.updateBalance(win);
        
        const btn = document.getElementById('crash-btn');
        btn.innerText = `GAGNÉ: ${win.toFixed(2)}€`;
        btn.classList.remove('cashout');
        btn.onclick = () => this.start();
    },

    crash: function() {
        clearInterval(this.interval);
        this.running = false;
        
        const disp = document.getElementById('crash-display');
        disp.innerText = "CRASH @ " + this.multiplier.toFixed(2) + "x";
        disp.classList.add('crash-crashed');

        const btn = document.getElementById('crash-btn');
        btn.innerText = "PERDU";
        btn.classList.remove('cashout');
        btn.onclick = () => this.start();
    }
};

/* --- JEU 3 : BLACKJACK (Simplifié) --- */
const BlackjackGame = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    bet: 0,
    inGame: false,

    suits: ['♠', '♥', '♦', '♣'],
    values: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],

    deal: function() {
        this.bet = parseFloat(document.getElementById('bj-bet').value);
        if (this.bet > App.balance) return alert("Solde insuffisant");

        App.updateBalance(-this.bet);
        this.inGame = true;
        this.createDeck();
        this.playerHand = [this.drawCard(), this.drawCard()];
        this.dealerHand = [this.drawCard()]; // Une seule carte visible au début

        this.updateUI();
        document.getElementById('bj-btn-deal').parentElement.style.display = 'none';
        document.getElementById('bj-actions').style.display = 'flex';
        document.getElementById('bj-msg').innerText = "";
    },

    createDeck: function() {
        this.deck = [];
        for (let s of this.suits) {
            for (let v of this.values) {
                this.deck.push({ suit: s, value: v });
            }
        }
        this.deck.sort(() => Math.random() - 0.5); // Mélange
    },

    drawCard: function() { return this.deck.pop(); },

    getScore: function(hand) {
        let score = 0;
        let aces = 0;
        for (let card of hand) {
            if (['J','Q','K'].includes(card.value)) score += 10;
            else if (card.value === 'A') { score += 11; aces++; }
            else score += parseInt(card.value);
        }
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    },

    hit: function() {
        this.playerHand.push(this.drawCard());
        this.updateUI();
        if (this.getScore(this.playerHand) > 21) this.endGame(false);
    },

    stand: function() {
        // Le croupier tire jusqu'à 17
        while (this.getScore(this.dealerHand) < 17) {
            this.dealerHand.push(this.drawCard());
        }
        this.updateUI();
        
        const pScore = this.getScore(this.playerHand);
        const dScore = this.getScore(this.dealerHand);

        if (dScore > 21 || pScore > dScore) this.endGame(true);
        else if (pScore === dScore) this.endGame('draw');
        else this.endGame(false);
    },

    updateUI: function() {
        const renderHand = (hand, elId) => {
            const el = document.getElementById(elId);
            el.innerHTML = '';
            hand.forEach(c => {
                const cardDiv = document.createElement('div');
                cardDiv.className = `bj-card ${['♥','♦'].includes(c.suit) ? 'red' : ''}`;
                cardDiv.innerHTML = `<span>${c.value}</span><span style="font-size:24px">${c.suit}</span><span>${c.value}</span>`;
                el.appendChild(cardDiv);
            });
        };
        renderHand(this.playerHand, 'player-hand');
        renderHand(this.dealerHand, 'dealer-hand');
        
        document.getElementById('player-score').innerText = "Vous: " + this.getScore(this.playerHand);
        document.getElementById('dealer-score').innerText = "Croupier: " + this.getScore(this.dealerHand);
    },

    endGame: function(result) {
        this.inGame = false;
        const msg = document.getElementById('bj-msg');
        
        if (result === true) {
            msg.innerText = "GAGNÉ !";
            msg.style.color = "#00e701";
            App.updateBalance(this.bet * 2);
        } else if (result === 'draw') {
            msg.innerText = "ÉGALITÉ";
            msg.style.color = "#fff";
            App.updateBalance(this.bet);
        } else {
            msg.innerText = "PERDU...";
            msg.style.color = "#ff4655";
        }

        document.getElementById('bj-btn-deal').parentElement.style.display = 'flex';
        document.getElementById('bj-actions').style.display = 'none';
        document.getElementById('bj-btn-deal').innerText = "REJOUER";
    }
};
