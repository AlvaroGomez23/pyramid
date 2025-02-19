// MOVER 
function movePlayer(player, direction) {
    const step = 10;

    if (checkCollision(player)) {
        console.log(`🚨 Colisión detectada!`);
    } else {
        if (direction === 'left') player.x = Math.max(0, player.x - step);
        if (direction === 'right') player.x = Math.min(gameConfig.width, player.x + step);
        if (direction === 'up') player.y = Math.max(0, player.y - step);
        if (direction === 'down') player.y = Math.min(gameConfig.height, player.y + step);
    }
    

    
}

function checkCollision(currentPlayer) {
    Object.values(players).forEach(otherPlayer => {
        if (currentPlayer.id !== otherPlayer.id) {
            const distance = Math.hypot(currentPlayer.x - otherPlayer.x, currentPlayer.y - otherPlayer.y);
            if (distance < 20) { // Distancia mínima para considerar colisión
                console.log(`⚠️ Colisión detectada entre ${currentPlayer.id} y ${otherPlayer.id}!`);
                return true;
            }
            return false;
        }
    });
}

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

function generateRandomRocks() {
    for (let i = 0; i < 10; i++) {
        gameConfig.rocks.push({
            x: Math.random() * gameConfig.width,
            y: Math.random() * gameConfig.height
            
        });
        console.log('Roca generada en', gameConfig.rocks[i]);
    }
    broadcastGameState();
}