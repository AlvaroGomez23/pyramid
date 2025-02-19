import * as fs from 'fs';
import express from 'express';
import passport from "passport";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 8180;

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

// - SERVER SOCKET.IO
// Crear el servidor HTTP
const wss = new WebSocketServer({ noServer: true });

// - GOOGLE OAUTH2
// Credencials Google
const credencials = JSON.parse(fs.readFileSync(path.join(__dirname, "/Oauth/credencialsOauth.json")));

let gameConfig = { 
    width: 800, 
    height: 600, 
    running: false,
    rocks: [] // Mantener la generación de rocas pero sin colisiones
};

let players = {};

passport.use(
  new GoogleStrategy(
    {
      clientID: credencials.clientId,
      clientSecret: credencials.clientSecret,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Seriealització i deserialització
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- DIRNAME I RUTES ---

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, '../plantilles'));
app.set('view engine', 'ejs');

// --- INDEX ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'Oauth.html'));
});

//----------------------
// --- OAUTH2 GOOGLE ---

// - Autenticació:
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// - Callback:
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => 
  res.redirect("/profile")
);

// - Rutes protegides:
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  res.send(`Benvingut ${JSON.stringify(req.user)}`);
});

// - Tancar sessió:
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

//PERSONAJES

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    const playerId = crypto.randomUUID(); // ID único
    const startX = Math.random() * gameConfig.width;
    const startY = Math.random() * gameConfig.height;

    players[playerId] = { 
        id: playerId, 
        x: startX, 
        y: startY, 
        color: getRandomColor() 
    };
    
    // Enviar configuración inicial al nuevo cliente
    ws.send(JSON.stringify({ type: 'config', ...gameConfig }));
    ws.send(JSON.stringify({ type: 'connected', playerId }));

    broadcastGameState();

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'move' && players[data.playerId]) {
            movePlayer(players[data.playerId], data.direction);
            broadcastGameState();
        }
    });

    ws.on('close', () => {
        delete players[playerId];
        broadcastGameState();
    });
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

function broadcastGameState() {
    const state = JSON.stringify({ 
        type: 'update', 
        players,
        rocks: gameConfig.rocks // Manteniendo las rocas pero sin colisión
    });

    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(state);
        }
    });
}

// Generar rocas una vez al iniciar el servidor
generateRandomRocks();

// --------------------------------
// ------------- PORT -------------

// Escuchar en el puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor responent en http://localhost:${PORT}`);
});