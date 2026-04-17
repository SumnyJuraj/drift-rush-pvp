import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, '../public')));

// Interface pre typovú bezpečnosť - dôležité pre životopis (TS best practices)
interface Player {
    id: string;
    x: number;
    y: number;
    angle: number;
    color: string;
    isAlive: boolean;
}

const players: Record<string, Player> = {};

io.on('connection', (socket: Socket) => {
    // Inicializácia hráča pri pripojení
    players[socket.id] = { 
        id: socket.id,
        x: 380, y: 100, angle: 0, 
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        isAlive: true 
    };

    // Informujeme hráča o jeho ID a aktuálnom stave sveta
    socket.emit('init', { id: socket.id, players });

    socket.on('updatePlayer', (data) => {
        if (players[socket.id]) {
            // Object.assign je efektívny spôsob zlúčenia objektov
            Object.assign(players[socket.id], data);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        // Informujeme ostatných, že hráč odišiel, aby ho odstránili z pamäte
        io.emit('playerDisconnected', socket.id);
    });
});

// Server Tick Rate: 60Hz (každých 16.6ms)
// Separácia simulácie od sieťovej komunikácie
setInterval(() => {
    if (Object.keys(players).length > 0) {
        io.emit('stateUpdate', players);
    }
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});