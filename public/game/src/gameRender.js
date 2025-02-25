const camelloAzul = new Image();
const camelloLila = new Image();
const camelloAzulFuerte = new Image();
const camelloLilaFuerte = new Image();
const camelloConPiedraAzulFlojo = new Image();
const camelloConPiedraLilaFlojo = new Image();
const camelloConPiedraAzulFuerte = new Image();
const camelloConPiedraLilaFuerte = new Image();

camelloAzul.src = '../img/camelloAzulFlojo.svg';
camelloLila.src = '../img/camelloLilaFlojo.svg';
camelloAzulFuerte.src = '../img/camelloAzulFuerte.svg';
camelloLilaFuerte.src = '../img/camelloLilaFuerte.svg';
camelloConPiedraAzulFlojo.src = '../img/camelloConPiedraAzulFlojo.svg';
camelloConPiedraLilaFlojo.src = '../img/camelloConPiedraLilaFlojo.svg';
camelloConPiedraAzulFuerte.src = '../img/camelloConPiedraAzulFuerte.svg';
camelloConPiedraLilaFuerte.src = '../img/camelloConPiedraLilFuerte.svg';

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

export function crearJugadors(player, pincell, playerId) {
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
        if (player.piedra) {
            camello = player.equip === 'equipBlau' ? camelloConPiedraAzulFuerte : camelloConPiedraLilaFuerte;
        } else {
            camello = player.equip === 'equipBlau' ? camelloAzulFuerte : camelloLilaFuerte;
        }
    }

    // **Colocar el camello en su posición correcta**
    pincell.translate(player.x + halfSize, player.y + halfSize);

    if (player.direction === 'left') { // Ahora usa `player.direction` en vez de `direction`
        pincell.scale(-1, 1); // Reflejar horizontalmente
    }

    // Dibujar la imagen centrada en (0,0) después de aplicar transformaciones
    pincell.drawImage(camello, -halfSize, -halfSize, size, size);

    pincell.restore(); // Restaurar el estado del canvas
}


