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
        const action = document.getElementById('startStopBtn').textContent === 'Engegar' ? 'start' : 'stop';
        socket.send(JSON.stringify({ type: action }));
    });
}       

window.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://localhost:8180');
    init();
});