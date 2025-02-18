import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear el servidor HTTP
const server = createServer();

// Crear el servidor de Socket.IO usando el servidor HTTP
const io = new Server(server);

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, '../plantilles'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Escuchar en el puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor responent en http://localhost:${PORT}`);
});
