class Game2048 {
    constructor() {
        this.size = 8;
        this.board = [];
        this.score = 0;
        this.movingTiles = new Map();
        this.mergedTiles = new Set();
        this.newTiles = new Set();
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.startScreen = document.getElementById('start-button'); // Có thể null
        this.gameScreen = document.getElementById('restart-button');
        this.isMoving = false;
        this.isMobile = window.innerWidth <= 500;
        this.tileSize = this.isMobile ? 35 : 54;
        this.gap = 6;
        this.gridSize = this.isMobile ? 320 : 480;
        // Khởi tạo âm thanh
        this.moveSound = document.getElementById('move-sound');
        this.mergeSound = document.getElementById('merge-sound');
        this.gameOverSound = document.getElementById('game-over-sound');
        this.buttonSound = document.getElementById('button-sound');
        // Điều chỉnh âm lượng
        if (this.moveSound) this.moveSound.volume = 0.5;
        if (this.mergeSound) this.mergeSound.volume = 0.7;
        if (this.gameOverSound) this.gameOverSound.volume = 0.6;
        if (this.buttonSound) this.buttonSound.volume = 0.5;
        // Kiểm tra lỗi tải âm thanh
        this.checkAudioLoaded();
    }

    // Kiểm tra xem âm thanh có tải được không
    checkAudioLoaded() {
        const sounds = [this.moveSound, this.mergeSound, this.gameOverSound, this.buttonSound];
        sounds.forEach((sound, index) => {
            if (sound) {
                sound.addEventListener('error', () => {
                });
                sound.addEventListener('loadeddata', () => {
                });
                sound.currentTime = 0;
            }
        });
    }

    // Phát âm thanh an toàn
    playSound(sound) {
        if (sound && sound.src && sound.readyState >= 2) { // Kiểm tra nguồn và trạng thái tải
            sound.currentTime = 0; // Reset để phát lại
            sound.play().catch((err) => {
                console.warn('Lỗi phát âm thanh:', err.message);
            });
        }
    }

    start() {
        this.playSound(this.buttonSound);
        this.startScreen.classList.add('hidden1');
        this.gameScreen.classList.remove('hidden1');
        this.init();
    }

    init() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.movingTiles.clear();
        this.mergedTiles.clear();
        this.newTiles.clear();
        this.updateScore();
        this.renderBoard();
        this.addRandomTile(true);
        this.addRandomTile(true);
        this.setupControls();
        this.gameOverElement.classList.add('hidden');
        this.isMoving = false;
    }

    reset() {
        this.playSound(this.buttonSound);
        this.init();
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';

        const tileDistance = this.tileSize + this.gap;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                if (value === 0) continue;

                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.setAttribute('data-value', value);
                tile.textContent = value;

                const posX = j * tileDistance;
                const posY = i * tileDistance;

                tile.style.transition = 'transform 0.15s ease';

                if (this.movingTiles.has(`${i},${j}`)) {
                    const [fromI, fromJ] = this.movingTiles.get(`${i},${j}`);
                    const fromX = fromJ * tileDistance;
                    const fromY = fromI * tileDistance;
                    tile.style.transform = `translate(${fromX}px, ${fromY}px)`;
                    requestAnimationFrame(() => {
                        tile.style.transform = `translate(${posX}px, ${posY}px)`;
                    });
                } else if (this.mergedTiles.has(`${i},${j}`)) {
                    tile.style.transform = `translate(${posX}px, ${posY}px)`;
                    tile.classList.add('merged');
                } else {
                    tile.style.transform = `translate(${posX}px, ${posY}px)`;
                }

                if (this.newTiles.has(`${i},${j}`)) {
                    tile.classList.add('new');
                }

                this.gameBoard.appendChild(tile);
            }
        }

        setTimeout(() => {
            this.movingTiles.clear();
            this.mergedTiles.clear();
            this.newTiles.clear();
            this.isMoving = false;
        }, 150);
    }

    addRandomTile(isNew = false) {
        const emptyTiles = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    emptyTiles.push({ i, j });
                }
            }
        }
        if (emptyTiles.length > 0) {
            const { i, j } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
            if (isNew) this.newTiles.add(`${i},${j}`);
        }
    }

    move(direction) {
        if (this.isMoving) return;
        this.isMoving = true;

        let moved = false;
        let newBoard = this.board.map(row => [...row]);
        this.movingTiles.clear();
        this.mergedTiles.clear();
        this.newTiles.clear();

        if (direction === 'left') {
            for (let i = 0; i < this.size; i++) {
                let row = this.board[i].slice();
                let { result, moves, merges } = this.mergeLine(row, i, direction);
                if (row.some((v, j) => v !== result[j])) {
                    moved = true;
                    this.playSound(this.moveSound);
                }
                newBoard[i] = result;
                moves.forEach(([from, to]) => this.movingTiles.set(`${i},${to}`, [i, from]));
                merges.forEach(pos => this.mergedTiles.add(`${i},${pos}`));
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.size; i++) {
                let row = this.board[i].slice();
                let { result, moves, merges } = this.mergeLine(row, i, direction);
                if (row.some((v, j) => v !== result[j])) {
                    moved = true;
                    this.playSound(this.moveSound);
                }
                newBoard[i] = result;
                moves.forEach(([from, to]) => this.movingTiles.set(`${i},${to}`, [i, from]));
                merges.forEach(pos => this.mergedTiles.add(`${i},${pos}`));
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.size; j++) {
                let column = [];
                for (let i = 0; i < this.size; i++) column.push(this.board[i][j]);
                let { result, moves, merges } = this.mergeLine(column, j, direction);
                if (column.some((v, i) => v !== result[i])) {
                    moved = true;
                    this.playSound(this.moveSound);
                }
                for (let i = 0; i < this.size; i++) newBoard[i][j] = result[i];
                moves.forEach(([from, to]) => this.movingTiles.set(`${to},${j}`, [from, j]));
                merges.forEach(pos => this.mergedTiles.add(`${pos},${j}`));
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.size; j++) {
                let column = [];
                for (let i = 0; i < this.size; i++) column.push(this.board[i][j]);
                let { result, moves, merges } = this.mergeLine(column, j, direction);
                if (column.some((v, i) => v !== result[i])) {
                    moved = true;
                    this.playSound(this.moveSound);
                }
                for (let i = 0; i < this.size; i++) newBoard[i][j] = result[i]; // Sửa lỗi từ newBoard[i] = result
                moves.forEach(([from, to]) => this.movingTiles.set(`${to},${j}`, [from, j]));
                merges.forEach(pos => this.mergedTiles.add(`${pos},${j}`));
            }
        }

        if (moved) {
            this.board = newBoard;
            this.renderBoard();
            setTimeout(() => this.addRandomTile(true), 150);
            if (this.isGameOver()) {
                setTimeout(() => this.showGameOver(), 300);
            }
        } else {
            this.isMoving = false;
        }
    }

    mergeLine(line, index, direction) {
        let isReverse = direction === 'right' || direction === 'down';
        if (isReverse) line = line.slice().reverse();

        let nonZero = line.filter(v => v !== 0);
        let result = [];
        let moves = [];
        let merges = [];
        let originalIndices = [];

        for (let i = 0; i < line.length; i++) {
            if (line[i] !== 0) {
                originalIndices.push(i);
            }
        }

        let i = 0;
        let hasMerged = false;
        while (i < nonZero.length) {
            if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
                const newValue = nonZero[i] * 2;
                result.push(newValue);
                this.score += newValue;
                if (!hasMerged) {
                    this.playSound(this.mergeSound);
                    hasMerged = true;
                }
                moves.push([originalIndices[i], result.length - 1]);
                moves.push([originalIndices[i + 1], result.length - 1]);
                merges.push(result.length - 1);
                i += 2;
            } else {
                result.push(nonZero[i]);
                moves.push([originalIndices[i], result.length - 1]);
                i++;
            }
        }

        while (result.length < this.size) {
            result.push(0);
        }

        if (isReverse) {
            result = result.reverse();
            moves = moves.map(([from, to]) => [this.size - 1 - from, this.size - 1 - to]);
            merges = merges.map(pos => this.size - 1 - pos);
        }

        return { result, moves, merges };
    }

    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) return false;
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i < this.size - 1 && this.board[i][j] === this.board[i + 1][j]) return false;
                if (j < this.size - 1 && this.board[i][j] === this.board[i][j + 1]) return false;
            }
        }
        return true;
    }

    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
        this.playSound(this.gameOverSound);
        this.isMoving = false;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') this.move('up');
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') this.move('down');
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.move('left');
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.move('right');
        });

        let touchStartX = 0;
        let touchStartY = 0;

        this.gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.gameBoard.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) this.move('right');
                else if (deltaX < -50) this.move('left');
            } else {
                if (deltaY > 50) this.move('down');
                else if (deltaY < -50) this.move('up');
            }
        });
    }
}

const game = new Game2048();