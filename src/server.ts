import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// Opravená cesta pre Render (hľadá public v rovine src)
app.use(express.static(path.join(__dirname, '../public')));

const players: Record<string, any> = {};

io.on('connection', (socket) => {
    players[socket.id] = { 
        x: 380, y: 100, angle: 0, 
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        isAlive: true 
    };

    socket.on('updatePlayer', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
        }
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    io.emit('stateUpdate', players);
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});