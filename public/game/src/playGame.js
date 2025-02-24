import * as gameRender from './gameRender.js';

const areaDeJoc = document.getElementById('areaDeJoc');
const pincell = areaDeJoc.getContext('2d');
let socket;

let players = {};
let rocks = [];
let playerId = null;
let currentDirection = null; // Guardar la dirección actual
let movementInterval = null; // Guardar el intervalo de movimiento

let areaLila = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(204, 0, 255, 0.5)' };
let areaBlava = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(0, 21, 255, 0.74)' };

function init() {
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'player' }));
    };

    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
    
        if (data.type === 'update') {
            players = data.players;
            areaDeJoc.width = data.width;
            areaDeJoc.height = data.height;
            areaDeJoc.width = (areaDeJoc.width + 30);
            areaDeJoc.height = (areaDeJoc.height + 30);
            rocks = data.rocks || [];
            areaLila = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(204, 0, 255, 0.5)' };
            areaBlava = { x: areaDeJoc.width - 150, y: areaDeJoc.height - 150, width: 150, height: 150, color: 'rgba(0, 128, 255, 0.74)' };
            gameRender.crearAreaDeJoc(pincell, areaDeJoc, areaLila, areaBlava, rocks, players, playerId);
        }
        
        if (data.type === 'connected') {
            playerId = data.playerId;
        }
    };

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
            ' ': 'agafar',
            Enter: 'agafar'
        }[event.key];

        if (direction && direction !== currentDirection) {
            currentDirection = direction;
            comencarMoviment(direction);
        }

        if (event.key === ' ' || event.key === 'Enter') {
            socket.send(JSON.stringify({ type: 'agafar', playerId }));
        }
    });

    socket.onclose = (event) => {
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };
    
    socket.onerror = (error) => {
        alert("Error de connexió. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };
}

function comencarMoviment(direction) {
    if (movementInterval) clearInterval(movementInterval);

    movementInterval = setInterval(() => {
        socket.send(JSON.stringify({ type: 'moure', playerId, direction }));
    }, 10); 
}

window.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://localhost:8180');
    init();
});