// server.mjs
import * as fs from 'fs';
import * as game from './game.mjs';
import express from 'express';
import session from "express-session";
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { WebSocketServer } from 'ws';
import http from 'http';
import crypto from 'crypto';

const app = express();
const PORT = 8180;

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

// Configurar sesió
app.use(session({ secret: "secreto", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Servidor HTTP
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Cargar credenciales OAuth
const credencials = JSON.parse(fs.readFileSync(path.join(_dirname, '/Oauth/credencialsOauth.json')));

let gameConfig = {
    width: 800,
    height: 600,
    running: false,
    rocks: []
};

let players = {};

passport.use(
    new GoogleStrategy(
        {
            clientID: credencials.clientId,
            clientSecret: credencials.clientSecret,
            callbackURL: `http://localhost:${PORT}/auth/google/callback`,
        },
        (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(express.json());
app.use(express.static(path.join(_dirname, '../public')));
app.set('views', path.join(_dirname, '../plantilles'));
app.set('view engine', 'ejs');

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(_dirname, '../public', 'index.html'));
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) =>
    res.redirect('/profile')
);

app.get('/profile', (req, res) => {
    const email = req.user?.emails[0].value;

    if (!email.endsWith('@sapalomera.cat')) { return res.redirect('/'); }

    if (!req.isAuthenticated()) return res.redirect('/');

    res.redirect('/pantallaCarrega');
});

app.get('/pantallaCarrega', (req, res) => {
    res.sendFile(path.join(_dirname, '../public', '/game/pantallaCarrega.html'));
});

// app.get('/logout', (req, res) => {
//     req.logout(err => {
//         if (err) return next(err);
//         res.redirect('/');
//     });
// });

// ------------------
// --- JUEGO --------

// WebSockets
wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');
    const playerId = crypto.randomUUID(); // Genera una ID de caracteres random para el usuario
    const startX = Math.random() * gameConfig.width;
    const startY = Math.random() * gameConfig.height;
    
    players[playerId] = { id: playerId, x: startX, y: startY, color: game.getRandomColor() };
    ws.send(JSON.stringify({ type: 'config', ...gameConfig }));
    ws.send(JSON.stringify({ type: 'connected', playerId }));
    broadcastGameState();
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'move' && players[data.playerId]) {
            game.movePlayer(players[data.playerId], data.direction, players, gameConfig);
            broadcastGameState();
        }
    });
    
    ws.on('close', () => {
        delete players[playerId];
        broadcastGameState();
    });
});

function broadcastGameState() {
    const state = JSON.stringify({ type: 'update', players, rocks: gameConfig.rocks });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(state);
        }
    });
}

game.generateRandomRocks(gameConfig);

server.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
