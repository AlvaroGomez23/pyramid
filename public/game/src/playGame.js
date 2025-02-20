const areaDeJoc = document.getElementById('areaDeJoc');
const pincell = areaDeJoc.getContext('2d');
const socket = new WebSocket('ws://localhost:8180');

let players = {};
let rocks = [];
let playerId = null;
let currentDirection = null; // Guardar la dirección actual
let movementInterval = null; // Guardar el intervalo de movimiento

let area1 = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(204, 0, 255, 0.5)' }; // Área verde
let area2 = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(0, 21, 255, 0.74)' }; // Área roja

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'config') {
        areaDeJoc.width = data.width + 30;
        areaDeJoc.height = data.height + 30;
        rocks = data.rocks || []; // Asegurar que las rocas se reciban
        area1 = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(204, 0, 255, 0.5)' };
        area2 = { x: areaDeJoc.width - 150, y: areaDeJoc.height - 150, width: 150, height: 150, color: 'rgba(0, 128, 255, 0.74)' };
    }
    if (data.type === 'connected') {
        playerId = data.playerId;
    }
    if (data.type === 'update') {
        players = data.players;
        rocks = data.rocks || []; // Actualizar rocas en cada frame
        crearAreaDeJoc();
    }
};

function crearAreaDeJoc() {
    pincell.clearRect(0, 0, areaDeJoc.width, areaDeJoc.height);

    // Dibujar áreas de destino
    crearAreaPiramides(area1);
    crearAreaPiramides(area2);

    // Dibujar rocas:
    for (const rock of rocks) {
        crearRoques(rock);
    }

    // Dibujar jugadores:
    for (const id in players) {
        crearJugadors(players[id]);
    }
}

function crearRoques(rock) {
    pincell.fillStyle = '#8B4513'; // Color marrón para rocas
    pincell.fillRect(rock.x, rock.y, 20, 20); // Dibujar roca como cuadrado de 20x20
}

function crearJugadors(player) {
    if (player.id === playerId) {
        if (player.equip === 'equipLila') {
            pincell.fillStyle = 'pink'; // Color rosa para el jugador actual
        } else if (player.equip === 'equipBlau') {
            pincell.fillStyle = 'lightblue'; // Color azul claro para el jugador actual
        }
    } else {
        pincell.fillStyle = player.color;
    }
    pincell.fillRect(player.x, player.y, 30, 30);
}

function crearAreaPiramides(area) {
    pincell.fillStyle = area.color;
    pincell.fillRect(area.x, area.y, area.width, area.height);
}

// Manejo del movimiento automático
window.addEventListener('keydown', (event) => {
    if (!playerId) return;

    const direction = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        w: 'up',
        a: 'left',
        s: 'down',
        d: 'right',
        ' ': 'grab',
        Enter: 'grab'
    }[event.key];

    if (direction && direction !== currentDirection) {
        currentDirection = direction;
        ComencarMoviment(direction);
    }

    if (event.key === ' ' || event.key === 'Enter') {
        socket.send(JSON.stringify({ type: 'grab', playerId }));
    }
});

function ComencarMoviment(direction) {
    if (movementInterval) clearInterval(movementInterval);

    movementInterval = setInterval(() => {
        socket.send(JSON.stringify({ type: 'move', playerId, direction }));
    }, 10); 
}