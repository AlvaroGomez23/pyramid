let movementIntervals = {}; // Almacena los intervalos de movimiento de cada jugador

export function startMovingPlayer(player, direction, players, gameConfig) {
    if (movementIntervals[player.id]) {
        clearInterval(movementIntervals[player.id]); // Detiene el movimiento anterior si existe
    }

    movementIntervals[player.id] = setInterval(() => {
        movePlayer(player, direction, players, gameConfig);
    }, 100); // Ajusta la velocidad del movimiento aquí (100 ms = 10 FPS)
}

export function movePlayer(player, direction, players, gameConfig) {
    const step = 0.5;
    let newX = player.x;
    let newY = player.y;

    if (direction === 'left') newX = Math.max(0, player.x - step);
    if (direction === 'right') newX = Math.min(gameConfig.width, player.x + step);
    if (direction === 'up') newY = Math.max(0, player.y - step);
    if (direction === 'down') newY = Math.min(gameConfig.height, player.y + step);

    // Verificar colisión con otros jugadores
    if (!checkCollision({ ...player, x: newX, y: newY }, players)) {
        player.x = newX;
        player.y = newY;
    } else {
        stopMovingPlayer(player); // Si hay colisión, detener movimiento
    }

    checkRockPickup(player, gameConfig);
    // Detener si llega al borde
    if (player.x <= 0 || player.x >= gameConfig.width || player.y <= 0 || player.y >= gameConfig.height) {
        stopMovingPlayer(player);
    }
}

export function stopMovingPlayer(player) {
    if (movementIntervals[player.id]) {
        clearInterval(movementIntervals[player.id]);
        delete movementIntervals[player.id];
    }
}

function checkCollision(currentPlayer, players) {
    return Object.values(players).some(otherPlayer => {
        if (currentPlayer.id !== otherPlayer.id) {
            return Math.hypot(currentPlayer.x - otherPlayer.x, currentPlayer.y - otherPlayer.y) < 30;
        }
        return false;
    });
}

export function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

export function generateRandomRocks(config) {
    config.rocks = []; // Asegurar que el array esté vacío antes de llenarlo
    if (config.rocks.length >= 10) return; // No generar más rocas si ya hay 10
    for (let i = 0; i < 10; i++) {
        config.rocks.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height
        });
    }
}

export function generarRocasFaltantes(config) {
    if (config.rocks.length < 10) {
        for (let i = config.rocks.length; i < 10; i++) {
            config.rocks.push({
                x: Math.random() * config.width,
                y: Math.random() * config.height
            });
        }
    }
}

function checkRockPickup(player, gameConfig) {
    gameConfig.rocks = gameConfig.rocks.filter(rock => {
        // Verificar colisión con bounding boxes (colisión de cuadrados)
        const isColliding =
            player.x < rock.x + 20 &&
            player.x + 30 > rock.x &&
            player.y < rock.y + 20 &&
            player.y + 30 > rock.y;

        if (isColliding) {
            console.log('¡Recogiste una piedra!');
            return false; // Eliminar la roca del array
        }
        return true; // Mantener la roca
    });

    if (gameConfig.rocks.length < 10) { // Por ejemplo, siempre queremos tener 10 rocas
        generarRocasFaltantes(gameConfig); // Llamar a esta función para generar las rocas que faltan
    }
}

