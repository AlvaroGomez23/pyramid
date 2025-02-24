export function crearAreaDeJoc(pincell, areaDeJoc, area1, area2, rocks, players, playerId) {
    pincell.clearRect(0, 0, areaDeJoc.width, areaDeJoc.height);

    // Dibuixar areas dels diferents equips.
    crearAreaPiramides(area1, pincell);
    crearAreaPiramides(area2, pincell);

    // Dibuixar roques:
    for (const rock of rocks) {
        crearRoques(rock, pincell);
    }

    // Dibuixar jugadors:
    for (const id in players) {
        crearJugadors(players[id], pincell, playerId);
    }
}

function crearAreaPiramides(area, pincell) {
    pincell.fillStyle = area.color;
    pincell.fillRect(area.x, area.y, area.width, area.height);
}

function crearRoques(rock, pincell) {
    pincell.fillStyle = '#8B4513';
    pincell.fillRect(rock.x, rock.y, 20, 20);
}

function crearJugadors(player, pincell, playerId) {
    if (player.id === playerId) {
        if (player.equip === 'equipLila') {
            pincell.fillStyle = 'pink'; // Color rosa clar per detectar el jugador actual.
        } else if (player.equip === 'equipBlau') {
            pincell.fillStyle = 'lightblue'; // Color blau clar per detectar el jugador actual.
        }
    } else {
        pincell.fillStyle = player.color;
    }
    pincell.fillRect(player.x, player.y, 30, 30);
}

