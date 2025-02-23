let socket;

function init() {
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'admin' }));
    };
    
    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'config') {
            document.getElementById('width').value = data.width;
            document.getElementById('height').value = data.height;
            document.getElementById('floors').value = data.floors;
        }
        if (data.type === 'startStop') {
            const btn = document.getElementById('startStopBtn');
            btn.textContent = data.running ? 'Aturar' : 'Engegar';
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
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const floors = document.getElementById('floors').value;

        const action = document.getElementById('startStopBtn').textContent === 'Engegar' ? 'start' : 'stop';
        
        if (action === 'start') {
            socket.send(JSON.stringify({ type: 'start', width, height, floors }));
        } else if (action === 'stop') {
            socket.send(JSON.stringify({ type: 'stop' }));
        }
    });
}       

window.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://localhost:8180');
    init();
});