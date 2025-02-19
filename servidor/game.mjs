export function movePlayer(player, direction, players, gameConfig) {
    const step = 10;
    if (!checkCollision(player, players)) {
        if (direction === 'left') player.x = Math.max(0, player.x - step);
        if (direction === 'right') player.x = Math.min(gameConfig.width, player.x + step);
        if (direction === 'up') player.y = Math.max(0, player.y - step);
        if (direction === 'down') player.y = Math.min(gameConfig.height, player.y + step);
    }
}

function checkCollision(currentPlayer, players, gameConfig) {
    return Object.values(players).some(otherPlayer => {
        if (currentPlayer.id !== otherPlayer.id) {
            return Math.hypot(currentPlayer.x - otherPlayer.x, currentPlayer.y - otherPlayer.y) < 20;
        }
        return false;
    });
}

export function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

export function generateRandomRocks(config) {
    for (let i = 0; i < 10; i++) {
        config.rocks.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height
        });
    }
}