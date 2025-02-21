let movementIntervals = {}; // Almacena los intervalos de movimiento de cada jugador

export function movePlayer(player, direction, players, gameConfig) {
    const step = 1;
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
        player.direction = direction; // Actualizar la dirección del jugador
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
    return gameConfig.rocks.some(rock => {
        // Verificar colisión con bounding boxes (colisión de cuadrados)
        const isColliding =
            player.x < rock.x + 20 &&
            player.x + 30 > rock.x &&
            player.y < rock.y + 20 &&
            player.y + 30 > rock.y;

        if (isColliding) {
            console.log('Esta colisionando con una roca');
        }
        return isColliding;
    });
}

export function pickUpRock(player, gameConfig) {
    if (player.piedra) {
        // Si el jugador ya lleva una piedra, verificar si la suelta en su área
        if (isInArea(player, player.equip === 'equipLila' ? gameConfig.areaLila : gameConfig.areaBlau)) {
            console.log('¡Piedra entregada en el área!');
            if (player.equip === 'equipLila') {
                gameConfig.puntsLila++;
                player.color = 'purple'; // Cambiar el color del jugador cuando suelta la roca en el area
            } else if (player.equip === 'equipBlau') {
                gameConfig.puntsBlau++;
                player.color = 'blue'; // Cambiar el color del jugador
            }
            console.log('Puntos del equipo lila:', gameConfig.puntsLila);
            console.log('Puntos del equipo blau:', gameConfig.puntsBlau);
            player.piedra = false;
            if (gameConfig.rocks.length < 10) { // Por ejemplo, siempre queremos tener 10 rocas
                generarRocasFaltantes(gameConfig); // Llamar a esta función para generar las rocas que faltan
            }
        } else {
            // Si no está en el área, soltar la piedra en la posición actual
            gameConfig.rocks.push({
                x: player.x,
                y: player.y
            });
            player.piedra = false; // Marcar al jugador como que no tiene la roca
            if (player.equip === 'equipLila') player.color = 'purple'; // Aqui cambia el color cuando deja la piedra
            if (player.equip === 'equipBlau') player.color = 'blue'; // Lo mismo con el azul
            console.log('¡Soltaste una piedra!');
        }
    } else {
        // Si el jugador no lleva una piedra, intentar recoger una
        let pickedUp = false;
        gameConfig.rocks = gameConfig.rocks.filter(rock => {
            if (pickedUp) return true; // Si ya recogió una piedra, mantener las demás

            const isColliding =
                player.x < rock.x + 20 &&
                player.x + 30 > rock.x &&
                player.y < rock.y + 20 &&
                player.y + 30 > rock.y;

            if (isColliding) {
                console.log('¡Recogiste una piedra!');
                player.piedra = true; // Marcar al jugador como que tiene la roca
                player.color = 'black'; // Aqui es cuando lleva una piedra, se pone negro pero hay que cambiarlo dependiendo del equipo
                pickedUp = true; // Marcar que ya recogió una piedra
                return false; // Eliminar la roca del array
            }
            return true; // Mantener la roca
        });
    }
}

function isInArea(player, area) {
    return (
        player.x >= area.x &&
        player.x <= area.x + area.width &&
        player.y >= area.y &&
        player.y <= area.y + area.height
    );
}