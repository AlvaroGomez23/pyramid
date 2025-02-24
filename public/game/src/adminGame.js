let socket;

function init() {
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'admin' }));
    };
    
    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'update') {
            document.getElementById('width').value = data.width;
            document.getElementById('height').value = data.height;
            document.getElementById('floors').value = data.floors;

            const btn = document.getElementById('startStopBtn');
            btn.textContent = data.running ? 'Aturar' : 'Engegar';

            // Actualizar el juego
            players = data.players;
            rocks = data.rocks || [];
            gameSettings = { width: data.width, height: data.height, floors: data.floors, running: data.running };

            // Ajustar tamaño del canvas
            areaDeJoc.width = data.width;
            areaDeJoc.height = data.height;

            crearAreaDeJoc();
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

    document.getElementById('width').addEventListener('input', () => {
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const floors = document.getElementById('floors').value;
        socket.send(JSON.stringify({ type: 'config', width, height, floors }));
    });

    document.getElementById('height').addEventListener('input', () => {
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const floors = document.getElementById('floors').value;
        socket.send(JSON.stringify({ type: 'config', width, height, floors }));
    });

    document.getElementById('floors').addEventListener('input', () => {
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const floors = document.getElementById('floors').value;
        socket.send(JSON.stringify({ type: 'config', width, height, floors }));
    });
}

window.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://localhost:8180');
    init();
});