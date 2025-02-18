import { Server } from "socket.io";
import { createServer } from "http";

// Crear el servidor HTTP
const server = createServer();

// Crear el servidor de Socket.IO usando el servidor HTTP
const io = new Server(server);


// Escuchar en el puerto 3000
server.listen(3000, () => {
  console.log("Servidor corriendo en el puerto http://localhost:3000");
});
