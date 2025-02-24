const camelloAzul = new Image();
const camelloLila = new Image();
const camelloAzulFuerte = new Image();
const camelloLilaFuerte = new Image();
const camelloConPiedraAzulFlojo = new Image();
const camelloConPiedraLilaFlojo = new Image();

camelloAzul.src = '../img/camelloAzulFlojo.svg';
camelloLila.src = '../img/camelloLilaFlojo.svg';
camelloAzulFuerte.src = '../img/camelloAzulFuerte.svg';
camelloLilaFuerte.src = '../img/camelloLilaFuerte.svg';
camelloConPiedraAzulFlojo.src = '../img/camelloAzulFlojoConPiedra.svg';
camelloConPiedraLilaFlojo.src = '../img/camelloLilaFlojoConPiedra.svg';

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
    const size = 50; // Tamaño de la imagen del camello.
    const halfSize = size / 2;

    pincell.save(); // Guardar el estado del canvas.

    // Determinar la imagen del camello.
    let camello;
    if (player.id === playerId) {
        if (player.piedra) {
            camello = player.equip === 'equipBlau' ? camelloConPiedraAzulFlojo : camelloConPiedraLilaFlojo;
        } else {
            camello = player.equip === 'equipBlau' ? camelloAzul : camelloLila;
        }
        
    } else {
        camello = player.equip === 'equipBlau' ? camelloAzulFuerte : camelloLilaFuerte;
    }

    // Dibujar el camello reflejado si va a la izquierda.
    if (player.direction === 'left') {
        pincell.translate(player.x + halfSize, player.y + halfSize);
        pincell.scale(-1, 1);
        pincell.drawImage(camello, -halfSize, -halfSize, size, size);
    } else {
        pincell.drawImage(camello, player.x, player.y, size, size);
    }

    pincell.restore();
}

