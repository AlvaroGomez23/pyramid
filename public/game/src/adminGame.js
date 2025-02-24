import * as gameRender from './gameRender.js';

const areaDeJoc = document.getElementById('areaDeJoc');
const pincell = areaDeJoc.getContext('2d');
let socket;

let players = {};
let rocks = [];
let playerId = null;

//Areas de joc, equip blau i equip lila.
let areaLila = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(204, 0, 255, 0.5)' };
let areaBlava = { x: 0, y: 0, width: 150, height: 150, color: 'rgba(0, 21, 255, 0.74)' };

function init() {
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'admin' }));
    };
    
    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'update') {
            // GESTIONAR BOTONS START/STOP:
            document.getElementById('width').value = data.width;
            document.getElementById('height').value = data.height;
            document.getElementById('floors').value = data.floors;

            const btn = document.getElementById('startStopBtn');
            btn.textContent = data.running ? 'Aturar' : 'Engegar';

            //CREAR AREA DE JOC:
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
    };
    
    socket.onclose = (event) => {
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };
    
    socket.onerror = (error) => {
        alert("Error de connexió. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };

    document.getElementById('startStopBtn').addEventListener('click', () => {
        const action = document.getElementById('startStopBtn').textContent === 'Engegar' ? 'start' : 'stop';
        
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const floors = document.getElementById('floors').value;

        if (action === 'start') {
            socket.send(JSON.stringify({ type: 'start', width, height, floors }));
        } else if (action === 'stop') {
            socket.send(JSON.stringify({ type: 'stop' }));
        }
    });

    document.querySelectorAll('#width, #height, #floors').forEach(input => {
        input.addEventListener('input', () => {
            const width = document.getElementById('width').value;
            const height = document.getElementById('height').value;
            const floors = document.getElementById('floors').value;
            socket.send(JSON.stringify({ type: 'config', width, height, floors }));
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://localhost:8180');
    init();
});