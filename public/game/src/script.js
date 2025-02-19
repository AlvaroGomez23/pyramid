const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = new WebSocket('ws://localhost:8180');

let players = {};
let rocks = [];
let playerId = null;

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'config') {
        canvas.width = data.width;
        canvas.height = data.height;
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
    ctx.beginPath();
    ctx.arc(rock.x, rock.y, 15, 0, Math.PI * 2); // Hacer las rocas más grandes
    ctx.fill();
}

function drawPlayer(player) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 30, 30);
}

window.addEventListener('keydown', (event) => {
    if (!playerId) return;
    const direction = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        Space: 'grab'
    }[event.key];

    if (direction) {
        socket.send(JSON.stringify({ type: direction === 'grab' ? 'grab' : 'move', playerId, direction }));
    }
});
