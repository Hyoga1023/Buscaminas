        document.addEventListener('DOMContentLoaded', function() {
            // Configuración del juego
            const width = 15;
            const height = 20;
            const totalMines = Math.floor(width * height * 0.15); // ~15% del tablero son minas
            const maxLives = 3;
            
            // Variables del estado del juego
            let board = [];
            let revealedCells = 0;
            let lives = maxLives;
            let gameOver = false;
            let isMultiplayer = false;
            let currentPlayer = 1;
            
            // Referencias a elementos DOM
            const boardElement = document.getElementById('board');
            const livesDisplay = document.getElementById('lives-display');
            const heartsDisplay = document.getElementById('hearts');
            const restartBtn = document.getElementById('restart-btn');
            const modeToggle = document.getElementById('mode-toggle');
            const gameModeDisplay = document.getElementById('game-mode');
            
            // Iniciar juego
            initGame();
            
            // Eventos
            restartBtn.addEventListener('click', initGame);
            modeToggle.addEventListener('click', toggleGameMode);
            
            function initGame() {
                // Resetear variables
                board = [];
                revealedCells = 0;
                lives = maxLives;
                gameOver = false;
                currentPlayer = 1;
                
                // Actualizar vidas
                updateLivesDisplay();
                
                // Limpiar el tablero
                boardElement.innerHTML = '';
                
                // Crear la matriz del tablero
                for (let y = 0; y < height; y++) {
                    board[y] = [];
                    for (let x = 0; x < width; x++) {
                        board[y][x] = {
                            isMine: false,
                            revealed: false,
                            neighborMines: 0,
                            x: x,
                            y: y
                        };
                        
                        // Crear elemento visual de la celda
                        const cell = document.createElement('div');
                        cell.className = 'cell';
                        cell.dataset.x = x;
                        cell.dataset.y = y;
                        cell.addEventListener('click', handleCellClick);
                        boardElement.appendChild(cell);
                    }
                }
                
                // Colocar minas aleatoriamente
                placeMines(totalMines);
                
                // Calcular minas vecinas para cada celda
                calculateNeighborMines();
                
                // Actualizar modo de juego en pantalla
                updateGameModeDisplay();
            }
            
            function placeMines(count) {
                let minesPlaced = 0;
                
                while (minesPlaced < count) {
                    const x = Math.floor(Math.random() * width);
                    const y = Math.floor(Math.random() * height);
                    
                    if (!board[y][x].isMine) {
                        board[y][x].isMine = true;
                        minesPlaced++;
                    }
                }
            }
            
            function calculateNeighborMines() {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (!board[y][x].isMine) {
                            let count = 0;
                            
                            // Comprobar las 8 celdas vecinas
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    const nx = x + dx;
                                    const ny = y + dy;
                                    
                                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx].isMine) {
                                        count++;
                                    }
                                }
                            }
                            
                            board[y][x].neighborMines = count;
                        }
                    }
                }
            }
            
            function handleCellClick(event) {
                if (gameOver) return;
                
                const x = parseInt(event.target.dataset.x);
                const y = parseInt(event.target.dataset.y);
                
                // Evitar clics en celdas ya reveladas
                if (board[y][x].revealed) return;
                
                // Revelar la celda
                revealCell(x, y);
                
                // Cambiar de jugador en modo multijugador
                if (isMultiplayer && !gameOver) {
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateGameModeDisplay();
                }
            }
            
            function revealCell(x, y) {
                const cell = board[y][x];
                
                // Marcar como revelada
                cell.revealed = true;
                revealedCells++;
                
                // Obtener el elemento DOM de la celda
                const cellElement = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                
                if (cell.isMine) {
                    // Es una mina
                    cellElement.className = 'cell revealed bomb';
                    cellElement.textContent = '💣';
                    
                    // Reducir vidas
                    lives--;
                    updateLivesDisplay();
                    
                    if (lives <= 0) {
                        // Perdió todas las vidas
                        gameOver = true;
                        showExplosion();
                        
                        setTimeout(() => {
                            showGameOverMessage(false);
                        }, 1000);
                    }
                } else {
                    // No es mina
                    if (cell.neighborMines === 0) {
                        // Celda vacía - revelar automáticamente vecinos
                        cellElement.className = 'cell revealed green-flag';
                        
                        // Revelar celdas adyacentes
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height && !board[ny][nx].revealed) {
                                    revealCell(nx, ny);
                                }
                            }
                        }
                    } else if (cell.neighborMines === 1) {
                        // Está cerca de una mina - bandera roja
                        cellElement.className = 'cell revealed red-flag';
                        cellElement.textContent = cell.neighborMines;
                    } else {
                        // Bandera verde para celdas con más de 1 mina cercana
                        cellElement.className = 'cell revealed green-flag';
                        cellElement.textContent = cell.neighborMines;
                    }
                    
                    // Comprobar victoria
                    const totalCells = width * height;
                    const cellsToReveal = totalCells - totalMines;
                    
                    if (revealedCells >= cellsToReveal) {
                        gameOver = true;
                        showGameOverMessage(true);
                    }
                }
            }
            
            function updateLivesDisplay() {
                livesDisplay.textContent = lives;
                heartsDisplay.textContent = '❤️'.repeat(lives);
            }
            
            function toggleGameMode() {
                isMultiplayer = !isMultiplayer;
                currentPlayer = 1;
                updateGameModeDisplay();
            }
            
            function updateGameModeDisplay() {
                if (isMultiplayer) {
                    gameModeDisplay.textContent = `Multijugador (Jugador ${currentPlayer})`;
                    modeToggle.textContent = "Cambiar a Modo Individual";
                } else {
                    gameModeDisplay.textContent = "Individual";
                    modeToggle.textContent = "Cambiar a Modo Multijugador";
                }
            }
            
            function showExplosion() {
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                document.body.appendChild(explosion);
                
                setTimeout(() => {
                    document.body.removeChild(explosion);
                }, 1000);
            }
            
            function showGameOverMessage(isWin) {
                if (isWin) {
                    Swal.fire({
                        title: '¡VENCEDOR!',
                        text: 'Has completado el tablero exitosamente',
                        icon: 'success',
                        background: '#f8f9d2',
                        confirmButtonColor: '#4CAF50',
                        confirmButtonText: 'Genial!',
                        titleText: '¡VENCEDOR!',
                        customClass: {
                            title: 'press-start-2p-regular',
                            popup: 'rubik'
                        }
                    });
                } else {
                    Swal.fire({
                        title: '¡DERROTADO!',
                        text: 'Has perdido todas tus vidas',
                        icon: 'error',
                        background: '#ffcccb',
                        confirmButtonColor: '#f44336',
                        iconColor: '#ff0000',
                        confirmButtonText: 'Intentar de nuevo',
                        customClass: {
                            title: 'press-start-2p-regular',
                            popup: 'rubik'
                        }
                    });
                }
            }
        });
  