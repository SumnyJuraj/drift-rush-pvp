
import { Inputs } from './controls.js';
Inputs.init();



const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const track = { centerX: 400, centerY: 300, innerRadius: 150, outerRadius: 280 };
const PHYSICS = {
    ACCEL: 0.15, MAX_SPEED: 8, FRICTION: 0.98,
    TURN_SPEED: 0.06, DRIFT_TRACTION: 0.05, DRIFT_DRAG: 0.95
};
const SKID_LIFE = 3000;


let skidMarks = [];
let otherPlayers = {};

let player = {
    x: 381, y: 100, // Štartujeme kúsok PRED cieľovou čiarou (x=400)
    angle: 0, vx: 0, vy: 0, size: 20
};

let gameState = {
    isAlive: true,
    laps: 0,
    passedHalfway: false,
    currentLapStartTime: Date.now(),
    bestLapTime: null,
    lastX: 380 // Dôležité pre detekciu prejazdu
};

// --- INPUTS ---


// --- LOGIKA ---
function update() {
    if (!gameState.isAlive) return;

    // 1. Uložiť pozíciu kolies PRED pohybom
    const oldWheels = getWheelPositions(player.x, player.y, player.angle);

    handleInput();
    applyPhysics();
    
    // 2. Logika čmúh
    const speed = Math.hypot(player.vx, player.vy);
    if ((Inputs.left || Inputs.right) && speed > 1) {
        const newWheels = getWheelPositions(player.x, player.y, player.angle);
        skidMarks.push({
            l1: oldWheels.left, l2: newWheels.left,
            r1: oldWheels.right, r2: newWheels.right,
            spawnTime: Date.now()
        });
    }
    skidMarks = skidMarks.filter(m => Date.now() - m.spawnTime < SKID_LIFE);

    checkCollisions();
    checkLapProgress();

    if (socket.connected) {
        socket.emit('updatePlayer', {
            x: player.x, y: player.y, angle: player.angle,
            isAlive: gameState.isAlive, isDrifting: (Inputs.left || Inputs.right)
        });
    }

    draw();
    requestAnimationFrame(update);
}

function handleInput() {
    if (Inputs.left) player.angle -= PHYSICS.TURN_SPEED;
    if (Inputs.right) player.angle += PHYSICS.TURN_SPEED;
}

function applyPhysics() {
    const isTurning = Inputs.left || Inputs.right;
    player.vx += Math.cos(player.angle) * PHYSICS.ACCEL;
    player.vy += Math.sin(player.angle) * PHYSICS.ACCEL;

    const drag = isTurning ? PHYSICS.DRIFT_DRAG : PHYSICS.FRICTION;
    player.vx *= drag;
    player.vy *= drag;

    if (isTurning) {
        player.vx += Math.cos(player.angle) * PHYSICS.DRIFT_TRACTION;
        player.vy += Math.sin(player.angle) * PHYSICS.DRIFT_TRACTION;
    }

    const speed = Math.hypot(player.vx, player.vy);
    if (speed > PHYSICS.MAX_SPEED) {
        const ratio = PHYSICS.MAX_SPEED / speed;
        player.vx *= ratio; player.vy *= ratio;
    }

    player.x += player.vx;
    player.y += player.vy;
}

function checkLapProgress() {
    // Checkpoint v polovici (dole)
    if (player.y > 450 && Math.abs(player.x - 400) < 100) {
        gameState.passedHalfway = true;
    }

    // Cieľ (prechod cez x=400 v hornej časti)
    if (gameState.lastX < 400 && player.x >= 400 && player.y < 300) {
        if (gameState.passedHalfway) {
            const lapTime = (Date.now() - gameState.currentLapStartTime) / 1000;
            gameState.laps++;
            if (!gameState.bestLapTime || lapTime < gameState.bestLapTime) {
                gameState.bestLapTime = lapTime;
            }
            gameState.currentLapStartTime = Date.now();
            gameState.passedHalfway = false;
        }
    }
    gameState.lastX = player.x;
}

function checkCollisions() {
    const dist = Math.hypot(player.x - track.centerX, player.y - track.centerY);
    if (dist < track.innerRadius || dist > track.outerRadius) die();
}

function die() {
    gameState.isAlive = false;
    player.vx = 0; player.vy = 0;
    setTimeout(() => {
        player.x = 380; player.y = 100; player.angle = 0;
        gameState.passedHalfway = false;
        gameState.currentLapStartTime = Date.now();
        gameState.lastX = 380;
        skidMarks = [];
        gameState.isAlive = true;
        update();
    }, 2000);
}

// --- GRAFIKA ---
function getWheelPositions(x, y, angle) {
    const offset = 8;
    return {
        left: {
            x: x + Math.cos(angle + Math.PI / 2) * offset,
            y: y + Math.sin(angle + Math.PI / 2) * offset
        },
        right: {
            x: x + Math.cos(angle - Math.PI / 2) * offset,
            y: y + Math.sin(angle - Math.PI / 2) * offset
        }
    };
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
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Trať
    ctx.beginPath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = track.outerRadius - track.innerRadius;
    ctx.arc(400, 300, (track.innerRadius + track.outerRadius) / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Cieľová čiara
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(400, 300 - track.innerRadius);
    ctx.lineTo(400, 300 - track.outerRadius);
    ctx.stroke();

    // Čiary (Skidmarks) - opravené kreslenie
    ctx.lineWidth = 2;
    const now = Date.now();
    skidMarks.forEach(m => {
        const opacity = Math.max(0, 1 - (now - m.spawnTime) / SKID_LIFE);
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(m.l1.x, m.l1.y); ctx.lineTo(m.l2.x, m.l2.y);
        ctx.moveTo(m.r1.x, m.r1.y); ctx.lineTo(m.r2.x, m.r2.y);
        ctx.stroke();
    });

    for (let id in otherPlayers) {
        if (id !== socket.id && otherPlayers[id].isAlive) drawPlayer(otherPlayers[id], otherPlayers[id].color);
    }
    if (gameState.isAlive) drawPlayer(player, 'cyan');

    // HUD - Vždy viditeľný
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Monospace";
    ctx.textAlign = "left";
    ctx.fillText(`KOLÁ:    ${gameState.laps}`, 20, 40);
    const time = ((Date.now() - gameState.currentLapStartTime) / 1000).toFixed(2);
    ctx.fillText(`ČAS:     ${time}s`, 20, 65);
    const best = gameState.bestLapTime ? gameState.bestLapTime.toFixed(2) + "s" : "---";
    ctx.fillText(`REKORD:  ${best}`, 20, 90);


    if (!gameState.isAlive) {
        ctx.fillStyle = "red";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("HAVÁRIA!", 400, 300);
    }
}

socket.on('stateUpdate', (data) => { otherPlayers = data; });
update();