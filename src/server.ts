import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http'; // Potrebné pre Socket.io
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app); // Vytvorenie HTTP servera z Express aplikácie
const io = new Server(httpServer);    // Inicializácia Socket.io na tomto serveri

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

// Objekt na ukladanie stavu všetkých hráčov v pamäti servera
// Kľúčom bude unikátne ID socketu
const players: Record<string, any> = {};

io.on('connection', (socket) => {
  console.log(`Hráč pripojený: ${socket.id}`);

  // Inicializácia nového hráča po pripojení
  players[socket.id] = {
    x: 400,
    y: 300,
    angle: 0,
    color: `hsl(${Math.random() * 360}, 70%, 50%)` // Náhodná farba
  };

  // Prijímanie aktualizácií polohy od klienta
  socket.on('updatePlayer', (data) => {
  if (players[socket.id]) {
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].angle = data.angle;
    players[socket.id].isAlive = data.isAlive;
    players[socket.id].isDrifting = data.isDrifting; // Pridané
  }
});

  // Odstránenie hráča po odpojení
  socket.on('disconnect', () => {
    console.log(`Hráč odpojený: ${socket.id}`);
    delete players[socket.id];
  });
});

// Broadcast stavu všetkých hráčov 60-krát za sekundu (tick rate)
setInterval(() => {
  io.emit('stateUpdate', players);
}, 1000 / 60);

httpServer.listen(PORT, () => {
  console.log(`Server beží na http://localhost:${PORT}`);
});