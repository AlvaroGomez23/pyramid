// CREAR JUGADOR -------------------------------
// ------------------------------------------------
import { resetejarJoc, transmetreEstatJoc } from "./server.mjs";


export function crearJugador(gameConfig, players, jugadors_equip_1, jugadors_equip_2) {
    console.log('Nuevo jugador conectado!');

    // Generar un id unic
    const playerId = crypto.randomUUID();

    // Assignar l'equip
    const equipJugador = assignarEquip(players, jugadors_equip_1, jugadors_equip_2);

    let startX, startY;
    // Posició incial
    do {
        if (equipJugador === 'equipLila') {
            startX = Math.random() * (gameConfig.areaLila.width - 30);
            startY = Math.random() * (gameConfig.areaLila.height - 30);
        } else {
            startX = Math.random() * gameConfig.areaBlau.width + gameConfig.areaBlau.x + 30;
            startY = Math.random() * gameConfig.areaBlau.height + gameConfig.areaBlau.y + 30;
        }
    } while (comprovacioPosicioOcupada(startX, startY, players));

    return { id: playerId, x: startX, y: startY, equip: equipJugador, color: assignarColor(equipJugador), piedra: false, direction: '' };
}

// EQUIPS

function assignarEquip(players, jugadors_equip_1, jugadors_equip_2) {
    // Equipos:
    const EQUIP_1 = "equipLila";
    const EQUIP_2 = "equipBlau";

    const jugadoresTotales = Object.keys(players).length;
    console.log(`Total de jugadores conectados: ${jugadoresTotales + 1}`);

    if (jugadoresTotales < 0) {
        console.log('¡No hay jugadores conectados!');
        return;
    }

    if (jugadors_equip_1 === jugadors_equip_2) {
        // Si els equips estan equilibrats, assignar aleatoriament
        const primerEquip = Math.floor(Math.random() * 2) + 1;
        if (primerEquip === 1) {
            jugadors_equip_1++;
            return EQUIP_1;
        } else {
            jugadors_equip_2++;
            return EQUIP_2;
        }
        // Depenent dels membres dels equips, assignar a l'equip amb menys jugadors
    } else if (jugadors_equip_1 > jugadors_equip_2) {
        jugadors_equip_2++;
        return EQUIP_2;
    } else if (jugadors_equip_2 > jugadors_equip_1) {
        jugadors_equip_1++;
        return EQUIP_1;
    }
}

// COLOR PER EQUIP:

function assignarColor(equipJugador) {
    // Colores:
    const COLOR1 = 'purple';
    const COLOR2 = 'blue';

    if (equipJugador === undefined || equipJugador === null || equipJugador === '') {
        console.log('¡No se ha asignado ningún color!');
        return;
    }

    if (equipJugador === 'equipLila') {
        console.log('¡El color lila ha sido asignado!');
        return COLOR1;
    }

    if (equipJugador === 'equipBlau') {
        console.log('¡El color azul ha sido asignado!');
        return COLOR2;
    }
}

// Comporvació de posició ocupada:

function comprovacioPosicioOcupada(x, y, players) {
    return Object.values(players).some(player => {
        return Math.hypot(player.x - x, player.y - y) < 30; // Verificar que la distancia sigui major a 30 per que no quedin 
    });
}

// MOVIMENT JUGADOR -------------------------------
// ------------------------------------------------

let movementIntervals = {}; // Guarda els intervals dels jugadors


export function moureJugador(player, direction, players, gameConfig) {
    const step = 3.5;
    let newX = player.x;
    let newY = player.y;

    player.direction = direction;

    if (direction === 'left') newX = Math.max(0, player.x - step);
    if (direction === 'right') newX = Math.min(gameConfig.width, player.x + step);
    if (direction === 'up') newY = Math.max(0, player.y - step);
    if (direction === 'down') newY = Math.min(gameConfig.height, player.y + step);

    // Verificar la colisió entre jugadors
    if (!comprovarCollision({ ...player, x: newX, y: newY }, players)) {
        player.x = newX;
        player.y = newY;
    } else {
        pararMoureJugador(player); // En cas de que dos jugadors colisionin es para el seu moviment
    }

    comprovarRocaAgafada(player, gameConfig);
    // Si arriba a un dels extrems para el moviment
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
    config.rocks = [];
    if (config.rocks.length >= 10) return;
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
        // En cas de que un jugador ja tingui una pedra, fem comprovacions en cas de que al deixi en el seu area
        if (comprovarGameAreaRoca(player, player.equip === 'equipLila' ? gameConfig.areaLila : gameConfig.areaBlau)) {
            console.log('¡Piedra entregada en el área!');
            if (player.equip === 'equipLila') {
                gameConfig.puntsLila++;
            } else if (player.equip === 'equipBlau') {
                gameConfig.puntsBlau++;
            }
            console.log('Puntos del equipo lila:', gameConfig.puntsLila);
            console.log('Puntos del equipo blau:', gameConfig.puntsBlau);
            player.piedra = false;
            if (gameConfig.rocks.length < 10) {
                generarRoquesFaltants(gameConfig); // Cridar a aquesta funció per regenerar roques
            }
            comprovarGuanyadors(gameConfig);
        } else {
            // En cas de que no estigui en el seu area, deixa la pedra en el x y del jugador
            gameConfig.rocks.push({
                x: player.x,
                y: player.y
            });
            player.piedra = false;
            console.log('Soltaste una piedra');
        }
    } else {
        // Pero si no porta cap pedra, intentem recollir una
        let pickedUp = false;
        gameConfig.rocks = gameConfig.rocks.filter(rock => {
            if (pickedUp) return true;

            const isColliding =
                player.x < rock.x + 20 &&
                player.x + 30 > rock.x &&
                player.y < rock.y + 20 &&
                player.y + 30 > rock.y;

            if (isColliding) {
                console.log('¡Recogiste una piedra!');
                player.piedra = true;
                pickedUp = true;
                return false; // Eliminar la roca del array
            }
            return true; // DEixar la roca
        });
    }
}

function comprovarRocaAgafada(player, gameConfig) {
    return gameConfig.rocks.some(rock => {
        // Verificar la colisio amb la roca per agafarla
        const isColliding =
            player.x < rock.x + 20 &&
            player.x + 30 > rock.x &&
            player.y < rock.y + 20 &&
            player.y + 30 > rock.y;

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

// GUANYADOR -----------------------------
// ---------------------------------------

function comprovarGuanyadors(gameConfig) {
    let guanyador = null;
    const PUNTUACIO_TOTAL = 1;

    if (gameConfig.puntsBlau >= PUNTUACIO_TOTAL) {
        guanyador = 'equipBlau';
    } else if (gameConfig.puntsLila >= PUNTUACIO_TOTAL) {
        guanyador = 'equipLila';
    }

    if (guanyador) {
        transmetreEstatJoc('acabar', guanyador);
        resetejarJoc();
    }
}
