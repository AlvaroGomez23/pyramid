// server.mjs
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const wss = new WebSocketServer({ noServer: true });

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

let gameConfig = { width: 800, height: 600, running: false };
let players = {};

const server = app.listen(8180, () => {
    console.log('Servidor HTTP en http://localhost:8180');
});

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');
    
    const playerId = Date.now(); // Identificador único
    const startX = Math.random() * gameConfig.width;
    const startY = Math.random() * gameConfig.height;
    players[playerId] = { id: playerId, x: startX, y: startY, color: getRandomColor() };
    
    ws.send(JSON.stringify({ type: 'config', ...gameConfig }));
    ws.send(JSON.stringify({ type: 'connected', playerId }));
    broadcastGameState();

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'move' && players[data.playerId]) {
            movePlayer(players[data.playerId], data.direction);
            broadcastGameState();
        }
    });

    ws.on('close', () => {
        delete players[playerId];
        broadcastGameState();
    });
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

function broadcastGameState() {
    const state = JSON.stringify({ type: 'update', players });
    wss.clients.forEach(client => client.send(state));
}

function movePlayer(player, direction) {
    const step = 10;
    if (direction === 'left') player.x = Math.max(0, player.x - step);
    if (direction === 'right') player.x = Math.min(gameConfig.width, player.x + step);
    if (direction === 'up') player.y = Math.max(0, player.y - step);
    if (direction === 'down') player.y = Math.min(gameConfig.height, player.y + step);
}

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}
