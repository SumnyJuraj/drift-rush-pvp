import { Inputs } from './controls.js';
import { MapManager } from './mapManager.js';

const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const myCustomMap = {
    "name": "Moja Mapa",
    "trackWidth": 81,
    "points": [{"x":130,"y":96},{"x":107,"y":495},{"x":252,"y":403},{"x":415,"y":532},{"x":741,"y":543},{"x":413,"y":414},{"x":451,"y":311},{"x":727,"y":244},{"x":693,"y":58},{"x":558,"y":171},{"x":388,"y":150}]
};

MapManager.loadMap(myCustomMap);
Inputs.init();

// KONŠTANTY PRE STABILNÚ FYZIKU
const PHYSICS = { ACCEL: 0.15, MAX_SPEED: 8, FRICTION: 0.98, TURN_SPEED: 0.06, DRIFT_TRACTION: 0.05, DRIFT_DRAG: 0.95 };
const SKID_LIFE = 2000;
const TICK_RATE = 1000 / 60; // Pevných 60 výpočtov za sekundu (16.66ms)

let lastTime = performance.now();
let accumulator = 0;
let skidMarks = [];
let otherPlayers = {};
let player = { x: 380, y: 100, angle: 0, vx: 0, vy: 0, size: 20 };
let gameState = { mode: 'PLAYING', isAlive: true, laps: 0, passedHalfway: false, currentLapStartTime: Date.now(), bestLapTime: null };
let lastDistToFinishLine = 0;

// Fyzika už neprijíma žiadne dt - beží vždy v konštantnom čase
function handleMovement() {
    const oldWheels = getWheelPositions(player.x, player.y, player.angle);

    if (Inputs.left) player.angle -= PHYSICS.TURN_SPEED;
    if (Inputs.right) player.angle += PHYSICS.TURN_SPEED;

    const isTurning = Inputs.left || Inputs.right;
    const speed = Math.hypot(player.vx, player.vy);

    player.vx += Math.cos(player.angle) * PHYSICS.ACCEL;
    player.vy += Math.sin(player.angle) * PHYSICS.ACCEL;

    const drag = isTurning ? PHYSICS.DRIFT_DRAG : PHYSICS.FRICTION;
    player.vx *= drag;
    player.vy *= drag;

    if (isTurning) {
        player.vx += Math.cos(player.angle) * PHYSICS.DRIFT_TRACTION;
        player.vy += Math.sin(player.angle) * PHYSICS.DRIFT_TRACTION;
    }

    if (speed > PHYSICS.MAX_SPEED) {
        const ratio = PHYSICS.MAX_SPEED / speed;
        player.vx *= ratio;
        player.vy *= ratio;
    }

    player.x += player.vx;
    player.y += player.vy;

    // Drifty (Skidmarks)
    if (isTurning && speed > 1) {
        const newWheels = getWheelPositions(player.x, player.y, player.angle);
        skidMarks.push({ 
            l1: oldWheels.left, l2: newWheels.left, 
            r1: oldWheels.right, r2: newWheels.right, 
            spawnTime: Date.now() 
        });
    }
}

function checkRaceLogic() {
    if (!MapManager.finishLinePoint) return;
    const f = MapManager.finishLinePoint;
    const trackDx = Math.cos(f.angle);
    const trackDy = Math.sin(f.angle);
    const playerDx = player.x - f.x;
    const playerDy = player.y - f.y;

    const currentProgress = playerDx * trackDx + playerDy * trackDy;

    if (lastDistToFinishLine < 0 && currentProgress >= 0) {
        if (gameState.passedHalfway) {
            const lapTime = (Date.now() - gameState.currentLapStartTime) / 1000;
            gameState.laps++;
            if (!gameState.bestLapTime || lapTime < gameState.bestLapTime) gameState.bestLapTime = lapTime;
            gameState.currentLapStartTime = Date.now();
            gameState.passedHalfway = false;
        }
    }
    if (currentProgress < -200) gameState.passedHalfway = true;
    lastDistToFinishLine = currentProgress;
}

function update(currentTime) {
    // Rozdiel času medzi framami
    let frameTime = currentTime - lastTime;
    if (frameTime > 100) frameTime = 100; // Ochrana proti "seknutiu" prehliadača
    lastTime = currentTime;

    accumulator += frameTime;

    // KĽÚČ: Kým je v akumulátore dosť času na jeden "tick" (16.6ms), počítame fyziku
    while (accumulator >= TICK_RATE) {
        if (gameState.mode === 'PLAYING' && gameState.isAlive) {
            handleMovement();
            if (MapManager.isOutOfBounds(player.x, player.y)) die();
            checkRaceLogic();
            
            if (socket.connected) {
                socket.emit('updatePlayer', { x: player.x, y: player.y, angle: player.angle, isAlive: gameState.isAlive });
            }
        }
        accumulator -= TICK_RATE;
    }

    skidMarks = skidMarks.filter(m => Date.now() - m.spawnTime < SKID_LIFE);
    draw();
    requestAnimationFrame(update);
}

// OSTATNÉ POMOCNÉ FUNKCIE (draw, die, atď ostávajú podobné)
function getWheelPositions(x, y, angle) {
    const offset = 8;
    return {
        left: { x: x + Math.cos(angle + Math.PI / 2) * offset, y: y + Math.sin(angle + Math.PI / 2) * offset },
        right: { x: x + Math.cos(angle - Math.PI / 2) * offset, y: y + Math.sin(angle - Math.PI / 2) * offset }
    };
}

function die() {
    gameState.isAlive = false;
    setTimeout(() => {
        resetPlayerToStart();
        gameState.passedHalfway = false;
        gameState.currentLapStartTime = Date.now();
        skidMarks = [];
        gameState.isAlive = true;
    }, 2000);
}

function resetPlayerToStart() {
    const p = MapManager.currentMap.points;
    const p1 = p[0]; const p2 = p[1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI;

    player.x = midX; player.y = midY; player.angle = angle;
    player.vx = 0; player.vy = 0;

    MapManager.finishLinePoint = { x: midX, y: midY, angle: angle };
    lastDistToFinishLine = 100; 
    gameState.passedHalfway = false;
}

function drawPlayer(p, color) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = color;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.fillStyle = 'white';
    ctx.fillRect(5, -5, 5, 10);
    ctx.restore();
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    MapManager.draw(ctx);

    const now = Date.now();
    skidMarks.forEach(m => {
        const opacity = Math.max(0, 1 - (now - m.spawnTime) / SKID_LIFE);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.l1.x, m.l1.y); ctx.lineTo(m.l2.x, m.l2.y);
        ctx.moveTo(m.r1.x, m.r1.y); ctx.lineTo(m.r2.x, m.r2.y);
        ctx.stroke();
    });

    for (let id in otherPlayers) {
        if (id !== socket.id && otherPlayers[id].isAlive) drawPlayer(otherPlayers[id], otherPlayers[id].color);
    }
    if (gameState.isAlive) drawPlayer(player, 'cyan');

    ctx.fillStyle = "white";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`LAPS: ${gameState.laps}`, 20, 40);
    ctx.fillText(`TIME: ${((Date.now() - gameState.currentLapStartTime)/1000).toFixed(2)}s`, 20, 65);
    ctx.fillText(`BEST: ${gameState.bestLapTime ? gameState.bestLapTime.toFixed(2) : '--'}s`, 20, 90);

    if (!gameState.isAlive) {
        ctx.fillStyle = "red";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CRASH!", 400, 300);
        ctx.textAlign = "left"; // Reset pre HUD
    }
}

socket.on('stateUpdate', (data) => { otherPlayers = data; });

resetPlayerToStart();
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    update(timestamp);
});


//pridať animaciu driftu ktora zmizla a opitmalizovať FPS všade

//git add .
//git commit -m "Full reset: fixed production paths and imports"
//git push