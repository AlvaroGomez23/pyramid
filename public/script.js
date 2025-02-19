const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = new WebSocket('ws://localhost:8180');

let players = {};
let rocks = [];
let playerId = null;
let currentDirection = null; // Guardar la dirección actual
let movementInterval = null; // Guardar el intervalo de movimiento

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'config') {
        canvas.width = data.width + 30;
        canvas.height = data.height + 30;
        rocks = data.rocks || []; // Asegurar que las rocas se reciban
    }
    if (data.type === 'connected') {
        playerId = data.playerId;
    }
    if (data.type === 'update') {
        players = data.players;
        rocks = data.rocks || []; // Actualizar rocas en cada frame
        drawGame();
    }
};

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1️⃣ Dibujar rocas primero
    rocks.forEach(drawRock);

    // 2️⃣ Luego dibujar jugadores encima
    for (const id in players) {
        drawPlayer(players[id]);
    }
}

function drawRock(rock) {
    ctx.fillStyle = '#8B4513'; // Color marrón para rocas
    ctx.fillRect(rock.x, rock.y, 20, 20); // Dibujar roca como cuadrado de 20x20
}

function drawPlayer(player) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 30, 30);
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
        ' ': 'grab'
    }[event.key];

    if (direction && direction !== currentDirection) {
        currentDirection = direction;
        startMoving(direction);
    }
});



function startMoving(direction) {
    if (movementInterval) clearInterval(movementInterval);

    movementInterval = setInterval(() => {
        socket.send(JSON.stringify({ type: 'move', playerId, direction }));
    }, 1); 
}
