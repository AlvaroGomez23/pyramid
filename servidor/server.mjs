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
import e from 'express';

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
    rocks: [],
    areaLila: { x: 0, y: 0, width: 150, height: 150 }, // Área del equipo Lila
    areaBlau: { x: 650, y: 450, width: 150, height: 150 }, // Área del equipo Blau
    puntsBlau: 0,
    puntsLila: 0
};

let players = {};

//Jugadors per equip:
let jugadors_equip_1 = 0
let jugadors_equip_2 = 0

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

// ------------------
// --- JUEGO --------

// WebSockets
wss.on('connection', (ws) => {
    // Crear i assignar dades del jugador.
    const nouJugador = crearJugador();
    const playerId = nouJugador.id;
    players[playerId] = nouJugador;
    
    // Enviar dades del joc al client.
    ws.send(JSON.stringify({ type: 'config', ...gameConfig }));
    ws.send(JSON.stringify({ type: 'connected', playerId }));

    // Enviar dades del joc a tots els clients.
    broadcastGameState();
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'move' && players[data.playerId]) {
            game.movePlayer(players[data.playerId], data.direction, players, gameConfig);
            broadcastGameState();
        } else if (data.type === 'grab' && players[data.playerId]) {
            game.pickUpRock(players[data.playerId], gameConfig);
            broadcastGameState();
        }
    });
    
    ws.on('close', () => {
        if (players[playerId].equip === "equipLila") { jugadors_equip_1--; } 
        else { jugadors_equip_2--; }
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

function crearJugador() {
    console.log('Nuevo jugador conectado!');

    //Generar ID unic:
    const playerId = crypto.randomUUID();

    //Assignar equip:
    const equipJugador = assignarEquip();

    let startX, startY;
    //Posició inicial:
    do {
        if (equipJugador === 'equipLila') {
            startX = Math.random() * gameConfig.areaLila.width - 30;
            startY = Math.random() * gameConfig.areaLila.height - 30;
        } else {
            startX = Math.random() * gameConfig.areaBlau.width + gameConfig.areaBlau.x + 30;
            startY = Math.random() * gameConfig.areaBlau.height + gameConfig.areaBlau.y + 30;
        }
    } while (isPositionOccupied(startX, startY));
    
    return { id: playerId, x: startX, y: startY, equip: equipJugador, color: assignarColor(equipJugador), piedra: false };
}

function isPositionOccupied(x, y) {
    return Object.values(players).some(player => {
        return Math.hypot(player.x - x, player.y - y) < 30; // Verificar si la distancia entre jugadores es menor a 30
    });
}

function assignarEquip() {
    //Equips:
    const EQUIP_1 = "equipLila";
    const EQUIP_2 = "equipBlau";

    const jugadoresTotales = Object.keys(players).length;
    console.log(`Total de jugadores conectados: ${jugadoresTotales + 1}`);
    // Recuerda que la assignacion comienza en 0 por el array :)

    if (jugadoresTotales < 0) {
        console.log('¡No hay jugadores conectados!');
        return;
    }

    if (jugadors_equip_1 === 0 && jugadors_equip_2 === 0) { // Si no hay jugadores en ningun equipo.
        // Aleatoriament mira quin equip comença:
        const primerEquip = Math.floor(Math.random() * 2) + 1;

        if (primerEquip === 1) { return equipFinal(EQUIP_1); } 
        else { return equipFinal(EQUIP_2); }

    } else if (jugadors_equip_1 === jugadors_equip_2) { // Si son iguals, assigna aleatoriament.

        // Aleatoriament mira quin equip comença:
        const primerEquip = Math.floor(Math.random() * 2) + 1;

        if (primerEquip === 1) { return equipFinal(EQUIP_1); } 
        else { return equipFinal(EQUIP_2); }

    } else if (jugadors_equip_1 > jugadors_equip_2) { // Si hi ha més jugadors en l'equip 1, assigna al equip 2.
        return equipFinal(EQUIP_2);
    } else { // Si hi ha més jugadors en l'equip 2, assigna al equip 1.
        return equipFinal(EQUIP_1);
    }
}

function equipFinal(equipJugador) {
    if (equipJugador === "equipLila") {
        console.log('¡El equipo 1 ha sido asignado!');
        const equipAssignat = equipJugador;
        jugadors_equip_1++;
        return equipAssignat;
    } else {
        console.log('¡El equipo 2 ha sido asignado!');
        const equipAssignat = equipJugador;
        jugadors_equip_2++;
        return equipAssignat;
    }
}

function assignarColor(equipJugador) {
    //Colors:
    const COLOR1 = 'purple';
    const COLOR2 = 'blue';

    if (equipJugador === undefined || equipJugador === null || equipJugador === '') {
        console.log('¡No se ha asignado ningún color!');
        return;
    }

    if (equipJugador === 'equipLila') {
        console.log('¡El color lila ha sido asignado!');
        const colorAssignat = COLOR1;
        return colorAssignat;

    } 
    
    if (equipJugador === 'equipBlau') {
        console.log('¡El color azul ha sido asignado!');
        const colorAssignat = COLOR2;
        return colorAssignat;
    }
}

//Se tiene que cambiar:
game.generateRandomRocks(gameConfig);

server.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});