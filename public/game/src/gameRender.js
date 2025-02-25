// PIRAMIDES:

const piramide1piso1bloque = new Image();
const piramide1piso2bloques = new Image();
const piramide1piso3bloques = new Image();
const piramide1piso = new Image();
const piramide2pisos1bloque = new Image();
const piramide2pisos2bloques = new Image();
const piramide2pisos = new Image();
const piramide3pisos1bloque = new Image();
const piramide3pisos = new Image();
const piramide4pisos = new Image();


piramide1piso1bloque.src = '../img/piramide/piramide1piso1bloque.svg';
piramide1piso2bloques.src = '../img/piramide/piramide1piso2bloques.svg';
piramide1piso3bloques.src = '../img/piramide/piramide1piso3bloques.svg';
piramide1piso.src = '../img/piramide/piramide1piso.svg';
piramide2pisos1bloque.src = '../img/piramide/piramide2pisos1bloque.svg';
piramide2pisos2bloques.src = '../img/piramide/piramide2pisos2bloques.svg';
piramide2pisos.src = '../img/piramide/piramide2pisos.svg';
piramide3pisos1bloque.src = '../img/piramide/piramide3pisos1bloque.svg';
piramide3pisos.src = '../img/piramide/piramide3pisos.svg';
piramide4pisos.src = '../img/piramide/piramide4pisos.svg';

const piramides = [
    null, // índice 0 (para que el índice 1 coincida con los puntos)
    piramide1piso1bloque, piramide1piso2bloques, piramide1piso3bloques, piramide1piso,
    piramide2pisos1bloque, piramide2pisos2bloques, piramide2pisos,
    piramide3pisos1bloque, piramide3pisos, piramide4pisos
];

// CAMELLOS:
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

export function crearAreaDeJoc(pincell, areaDeJoc, areaBlava, areaLila, rocks, players, playerId, puntsBlau, puntsLila) {
    pincell.clearRect(0, 0, areaDeJoc.width, areaDeJoc.height);

    // Dibuixar areas dels diferents equips.
    crearAreaPiramides(areaLila, pincell);
    crearAreaPiramides(areaBlava, pincell);

    // Dibuixar roques:
    for (const rock of rocks) {
        crearRoques(rock, pincell);
    }

    // Dibuixar jugadors:
    for (const id in players) {
        crearJugadors(players[id], pincell, playerId);
    }

    crearPiramide(pincell, areaLila, puntsLila);
    crearPiramide(pincell, areaBlava, puntsBlau);
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
    const size = 50; // Mida del camell
    const halfSize = size / 2;

    pincell.save();

    // Determminar el camell que es mostrarà.
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

    pincell.translate(player.x + halfSize, player.y + halfSize);

    if (player.direction === 'left') { 
        pincell.scale(-1, 1); // Fer que el camell miri cap a la esquerra
    }

    pincell.drawImage(camello, -halfSize, -halfSize, size, size);

    pincell.restore(); // Restaurar el estado del canvas
}

function crearPiramide(pincell, area, punts) { 
    if (punts < 1 || punts > 10) return;
    const piramideImg = piramides[punts];

    console.log(area);
    console.log(punts);

    const size = 50;
    const halfSize = size / 2;

    pincell.drawImage(
        piramideImg, area.x + area.width / 2 - halfSize, area.y + area.height / 2 - halfSize, size, size );
}

