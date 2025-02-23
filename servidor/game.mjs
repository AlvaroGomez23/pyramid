// export function getRandomColor() {
//     return `hsl(${Math.random() * 360}, 100%, 50%)`;
// }

// CREAR JUGADOR -------------------------------
// ------------------------------------------------

export function crearJugador(gameConfig, players, jugadors_equip_1, jugadors_equip_2) {
    console.log('Nuevo jugador conectado!');

    //Generar ID unic:
    const playerId = crypto.randomUUID();

    //Assignar equip:
    const equipJugador = assignarEquip(players, jugadors_equip_1, jugadors_equip_2);

    let startX, startY;
    //Posició inicial:
    do {
        if (equipJugador === 'equipLila') {
            startX = Math.random() * gameConfig.areaLila.width - 30;
            startY = Math.random() * gameConfig.areaLila.height - 30;
        } else {
            startX = Math.random() * gameConfig.areaBlau.width + gameConfig.areaBlau.x + 30;
            startY = Math.random() * gameConfig.areaBlau.height + gameConfig.areaBlau.y + 30;
        }
    } while (comprovacioPosicioOcupada(startX, startY, players));
    
    return { id: playerId, x: startX, y: startY, equip: equipJugador, color: assignarColor(equipJugador), piedra: false };
}

// EQUIPOS: 

function assignarEquip(players, jugadors_equip_1, jugadors_equip_2) {
    //Equips:
    const EQUIP_1 = "equipLila";
    const EQUIP_2 = "equipBlau";

    const jugadoresTotales = Object.keys(players).length;
    console.log(`Total de jugadores conectados: ${jugadoresTotales + 1}`);
    // Recuerda que la assignacion comienza en 0 por el array :)

    if (jugadoresTotales < 0) {
        console.log('¡No hay jugadores conectados!');
        return;
    }

    if (jugadors_equip_1 === 0 && jugadors_equip_2 === 0) { // Si no hay jugadores en ningun equipo.
        // Aleatoriament mira quin equip comença:
        const primerEquip = Math.floor(Math.random() * 2) + 1;

        if (primerEquip === 1) { return equipFinal(EQUIP_1, jugadors_equip_1, jugadors_equip_2); } 
        else { return equipFinal(EQUIP_2, jugadors_equip_1, jugadors_equip_2); }

    } else if (jugadors_equip_1 === jugadors_equip_2) { // Si son iguals, assigna aleatoriament.

        // Aleatoriament mira quin equip comença:
        const primerEquip = Math.floor(Math.random() * 2) + 1;

        if (primerEquip === 1) { return equipFinal(EQUIP_1, jugadors_equip_1, jugadors_equip_2); } 
        else { return equipFinal(EQUIP_2, jugadors_equip_1, jugadors_equip_2); }

    } else if (jugadors_equip_1 > jugadors_equip_2) { // Si hi ha més jugadors en l'equip 1, assigna al equip 2.
        return equipFinal(EQUIP_2, jugadors_equip_1, jugadors_equip_2);
    } else { // Si hi ha més jugadors en l'equip 2, assigna al equip 1.
        return equipFinal(EQUIP_1, jugadors_equip_1, jugadors_equip_2);
    }
}

function equipFinal(equipJugador, jugadors_equip_1, jugadors_equip_2) {
    if (equipJugador === "equipLila") {
        console.log('¡El equipo 1 ha sido asignado!');
        const equipAssignat = equipJugador;
        jugadors_equip_1++;
        return equipAssignat;
    } else {
        console.log('¡El equipo 2 ha sido asignado!');
        const equipAssignat = equipJugador;
        jugadors_equip_2++;
        return equipAssignat;
    }
}

// COLOR PER EQUIP:

function assignarColor(equipJugador) {
    //Colors:
    const COLOR1 = 'purple';
    const COLOR2 = 'blue';

    if (equipJugador === undefined || equipJugador === null || equipJugador === '') {
        console.log('¡No se ha asignado ningún color!');
        return;
    }

    if (equipJugador === 'equipLila') {
        console.log('¡El color lila ha sido asignado!');
        const colorAssignat = COLOR1;
        return colorAssignat;

    } 
    
    if (equipJugador === 'equipBlau') {
        console.log('¡El color azul ha sido asignado!');
        const colorAssignat = COLOR2;
        return colorAssignat;
    }
}

// Comporvació de posició ocupada:

function comprovacioPosicioOcupada(x, y, players) {
    return Object.values(players).some(player => {
        return Math.hypot(player.x - x, player.y - y) < 30; // Verificar si la distancia entre jugadores es menor a 30
    });
}

// MOVIMENT JUGADOR -------------------------------
// ------------------------------------------------

let movementIntervals = {}; // Almacena los intervalos de movimiento de cada jugador


export function moureJugador(player, direction, players, gameConfig) {
    const step = 1;
    let newX = player.x;
    let newY = player.y;

    if (direction === 'left') newX = Math.max(0, player.x - step);
    if (direction === 'right') newX = Math.min(gameConfig.width, player.x + step);
    if (direction === 'up') newY = Math.max(0, player.y - step);
    if (direction === 'down') newY = Math.min(gameConfig.height, player.y + step);

    // Verificar colisión con otros jugadores
    if (!comprovarCollision({ ...player, x: newX, y: newY }, players)) {
        player.x = newX;
        player.y = newY;
    } else {
        pararMoureJugador(player); // Si hay colisión, detener movimiento
    }

    comprovarRocaAgafada(player, gameConfig);
    // Detener si llega al borde
    if (player.x <= 0 || player.x >= gameConfig.width || player.y <= 0 || player.y >= gameConfig.height) {
        pararMoureJugador(player);
    }
}

export function pararMoureJugador(player) {
    if (movementIntervals[player.id]) {
        clearInterval(movementIntervals[player.id]);
        delete movementIntervals[player.id];
    }
}

function comprovarCollision(currentPlayer, players) {
    return Object.values(players).some(otherPlayer => {
        if (currentPlayer.id !== otherPlayer.id) {
            return Math.hypot(currentPlayer.x - otherPlayer.x, currentPlayer.y - otherPlayer.y) < 30;
        }
        return false;
    });
}

// ROQUES -------------------------------
// --------------------------------------

export function generarRoquesGameArea(config) {
    config.rocks = []; // Asegurar que el array esté vacío antes de llenarlo
    if (config.rocks.length >= 10) return; // No generar más rocas si ya hay 10
    for (let i = 0; i < 10; i++) {
        config.rocks.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height
        });
    }
}

export function generarRoquesFaltants(config) {
    if (config.rocks.length < 10) {
        for (let i = config.rocks.length; i < 10; i++) {
            config.rocks.push({
                x: Math.random() * config.width,
                y: Math.random() * config.height
            });
        }
    }
}

export function agafarRoca(player, gameConfig) {
    if (player.piedra) {
        // Si el jugador ya lleva una piedra, verificar si la suelta en su área
        if (comprovarGameAreaRoca(player, player.equip === 'equipLila' ? gameConfig.areaLila : gameConfig.areaBlau)) {
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
                generarRoquesFaltants(gameConfig); // Llamar a esta función para generar las rocas que faltan
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

function comprovarRocaAgafada(player, gameConfig) {
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

function comprovarGameAreaRoca(player, area) {
    return (
        player.x >= area.x &&
        player.x <= area.x + area.width &&
        player.y >= area.y &&
        player.y <= area.y + area.height
    );
}