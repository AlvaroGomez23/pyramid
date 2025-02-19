const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = new WebSocket('ws://localhost:8180');

let players = {};
let playerId = null;

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.type === 'config') {
        canvas.width = data.width;
        canvas.height = data.height;
    }
    if (data.type === 'connected') {
        playerId = data.playerId;
    }
    if (data.type === 'update') {
        players = data.players;
        drawGame();
    }
};

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const id in players) {
        drawPlayer(players[id]);
    }
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
        ArrowDown: 'down'
    }[event.key];
    if (direction) {
        socket.send(JSON.stringify({ type: 'move', playerId, direction }));
    }
});
