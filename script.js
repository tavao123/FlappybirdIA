/**
 * Flappy Bird Avançado - Termux Edition
 * Sistema completo de jogo com múltiplas telas e funcionalidades
 */

class FlappyBirdGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'loading'; // loading, menu, playing, paused, gameover
        this.score = 0;
        this.bestScore = 0;
        this.settings = {
            difficulty: 'normal',
            sound: true,
            theme: 'day'
        };
        
        // Elementos do jogo
        this.bird = null;
        this.pipes = [];
        this.particles = [];
        
        // Configurações do jogo
        this.gameConfig = {
            easy: { gravity: 0.3, pipeGap: 200, pipeSpeed: 2 },
            normal: { gravity: 0.4, pipeGap: 150, pipeSpeed: 3 },
            hard: { gravity: 0.5, pipeGap: 120, pipeSpeed: 4 },
            extreme: { gravity: 0.6, pipeGap: 100, pipeSpeed: 5 }
        };
        
        // Controles
        this.keys = {};
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupCanvas();
        this.setupEventListeners();
        this.loadBestScore();
        
        // Simular loading
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showScreen('menu');
            this.gameState = 'menu';
        }, 2000);
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Botões do menu
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('scores-btn').addEventListener('click', () => this.showScores());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('about-btn').addEventListener('click', () => this.showAbout());
        
        // Botões do jogo
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('home-btn').addEventListener('click', () => this.goToMenu());
        
        // Botões de game over
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('save-score-btn').addEventListener('click', () => this.saveScore());
        document.getElementById('menu-btn').addEventListener('click', () => this.goToMenu());
        
        // Botões de recordes
        document.getElementById('clear-scores-btn').addEventListener('click', () => this.clearScores());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.goToMenu());
        
        // Botões de configurações
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.settings.difficulty = e.target.value;
            this.saveSettings();
        });
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });
        document.getElementById('reset-settings-btn').addEventListener('click', () => this.resetSettings());
        document.getElementById('back-from-settings-btn').addEventListener('click', () => this.goToMenu());
        
        // Botões sobre
        document.getElementById('back-from-about-btn').addEventListener('click', () => this.goToMenu());
        
        // Botões de pausa
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-from-pause-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-from-pause-btn').addEventListener('click', () => this.goToMenu());
        
        // Controles do jogo
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleInput();
            }
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleInput() {
        if (this.gameState === 'playing' && this.bird) {
            this.bird.flap();
            this.createParticles(this.bird.x, this.bird.y);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.pipes = [];
        this.particles = [];
        
        // Criar pássaro
        this.bird = new Bird(this.canvas.width * 0.2, this.canvas.height * 0.5);
        
        // Criar primeiro cano
        this.addPipe();
        
        this.showScreen('game');
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pause');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('game');
            this.gameLoop();
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Atualizar melhor pontuação
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        
        // Atualizar interface
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        
        this.showScreen('gameover');
    }
    
    goToMenu() {
        this.gameState = 'menu';
        this.showScreen('menu');
    }
    
    showScores() {
        this.showScreen('scores');
        this.loadScores();
    }
    
    showSettings() {
        this.showScreen('settings');
        this.updateSettingsUI();
    }
    
    showAbout() {
        this.showScreen('about');
    }
    
    showScreen(screenName) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar tela específica
        document.getElementById(`${screenName}-screen`).classList.add('active');
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const config = this.gameConfig[this.settings.difficulty];
        
        // Atualizar pássaro
        if (this.bird) {
            this.bird.update(config.gravity);
            
            // Verificar colisão com bordas
            if (this.bird.y <= 0 || this.bird.y >= this.canvas.height - this.bird.radius) {
                this.gameOver();
                return;
            }
        }
        
        // Atualizar canos
        this.pipes.forEach((pipe, index) => {
            pipe.update(config.pipeSpeed);
            
            // Verificar pontuação
            if (!pipe.scored && this.bird && this.bird.x > pipe.x + pipe.width) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
            }
            
            // Verificar colisão
            if (this.bird && this.checkCollision(this.bird, pipe)) {
                this.gameOver();
                return;
            }
            
            // Remover canos que saíram da tela
            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(index, 1);
            }
        });
        
        // Adicionar novos canos
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
            this.addPipe();
        }
        
        // Atualizar partículas
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar fundo
        this.drawBackground();
        
        // Desenhar canos
        this.pipes.forEach(pipe => pipe.draw(this.ctx));
        
        // Desenhar pássaro
        if (this.bird) {
            this.bird.draw(this.ctx);
        }
        
        // Desenhar partículas
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        switch (this.settings.theme) {
            case 'night':
                gradient.addColorStop(0, '#2C3E50');
                gradient.addColorStop(1, '#34495E');
                break;
            case 'sunset':
                gradient.addColorStop(0, '#FF6B6B');
                gradient.addColorStop(0.5, '#FF8E53');
                gradient.addColorStop(1, '#FF6B9D');
                break;
            default: // day
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.5, '#98D8E8');
                gradient.addColorStop(1, '#B0E0E6');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar nuvens simples
        this.drawClouds();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Nuvens estáticas para simplicidade
        const clouds = [
            { x: this.canvas.width * 0.1, y: this.canvas.height * 0.2, size: 60 },
            { x: this.canvas.width * 0.6, y: this.canvas.height * 0.15, size: 80 },
            { x: this.canvas.width * 0.8, y: this.canvas.height * 0.3, size: 50 }
        ];
        
        clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    addPipe() {
        const config = this.gameConfig[this.settings.difficulty];
        const pipeX = this.canvas.width;
        const pipeWidth = 80;
        const gapY = Math.random() * (this.canvas.height - config.pipeGap - 200) + 100;
        
        this.pipes.push(new Pipe(pipeX, 0, pipeWidth, gapY));
        this.pipes.push(new Pipe(pipeX, gapY + config.pipeGap, pipeWidth, this.canvas.height - gapY - config.pipeGap));
    }
    
    checkCollision(bird, pipe) {
        return bird.x + bird.radius > pipe.x &&
               bird.x - bird.radius < pipe.x + pipe.width &&
               bird.y + bird.radius > pipe.y &&
               bird.y - bird.radius < pipe.y + pipe.height;
    }
    
    createParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
    }
    
    // Sistema de pontuações
    async saveScore() {
        const playerName = document.getElementById('player-name').value.trim() || 'Anônimo';
        
        try {
            const response = await fetch('/api/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: this.score,
                    player: playerName
                })
            });
            
            if (response.ok) {
                alert('Pontuação salva com sucesso!');
                document.getElementById('player-name').value = '';
            } else {
                alert('Erro ao salvar pontuação');
            }
        } catch (error) {
            console.error('Erro ao salvar pontuação:', error);
            alert('Erro ao salvar pontuação');
        }
    }
    
    async loadScores() {
        const scoresList = document.getElementById('scores-list');
        scoresList.innerHTML = '<div class="loading">Carregando recordes...</div>';
        
        try {
            const response = await fetch('/api/scores');
            const scores = await response.json();
            
            if (scores.length === 0) {
                scoresList.innerHTML = '<div class="loading">Nenhum recorde encontrado</div>';
                return;
            }
            
            scoresList.innerHTML = scores.map((score, index) => `
                <div class="score-entry">
                    <div class="score-rank">#${index + 1}</div>
                    <div class="score-info">
                        <div class="score-player">${score.player}</div>
                        <div class="score-date">${new Date(score.timestamp).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div class="score-points">${score.score}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao carregar recordes:', error);
            scoresList.innerHTML = '<div class="loading">Erro ao carregar recordes</div>';
        }
    }
    
    clearScores() {
        if (confirm('Tem certeza que deseja limpar todos os recordes?')) {
            // Implementar limpeza de recordes se necessário
            alert('Funcionalidade não implementada no servidor');
        }
    }
    
    // Sistema de configurações
    loadSettings() {
        const saved = localStorage.getItem('flappybird-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applyTheme();
    }
    
    saveSettings() {
        localStorage.setItem('flappybird-settings', JSON.stringify(this.settings));
    }
    
    updateSettingsUI() {
        document.getElementById('difficulty-select').value = this.settings.difficulty;
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('theme-select').value = this.settings.theme;
    }
    
    resetSettings() {
        this.settings = {
            difficulty: 'normal',
            sound: true,
            theme: 'day'
        };
        this.saveSettings();
        this.updateSettingsUI();
        this.applyTheme();
    }
    
    applyTheme() {
        document.body.className = `theme-${this.settings.theme}`;
    }
    
    // Sistema de melhor pontuação local
    loadBestScore() {
        const saved = localStorage.getItem('flappybird-best-score');
        this.bestScore = saved ? parseInt(saved) : 0;
    }
    
    saveBestScore() {
        localStorage.setItem('flappybird-best-score', this.bestScore.toString());
    }
}

// Classes dos elementos do jogo
class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.velocity = 0;
        this.rotation = 0;
    }
    
    flap() {
        this.velocity = -8;
    }
    
    update(gravity) {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Rotação baseada na velocidade
        this.rotation = Math.min(Math.max(this.velocity * 0.1, -0.5), 0.5);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Corpo do pássaro
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Asa
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Olho
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(5, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(7, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Bico
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, -3);
        ctx.lineTo(25, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Pipe {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.scored = false;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    draw(ctx) {
        // Cano principal
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Borda do cano
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Detalhes do cano
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, Math.max(0, this.height - 20));
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBirdGame();
});

