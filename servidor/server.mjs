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
    let playerId;
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        //Comporvacio de tipus de jugador.
        //ADMIN
        if (data.type === 'admin') {
            //lo que hace el admin
            console.log('Admin conectado');
        } else if (data.type === 'player') { //JUGADOR
            const nouJugador = game.crearJugador(gameConfig, players, jugadors_equip_1, jugadors_equip_2);
            playerId = nouJugador.id;
            players[playerId] = nouJugador;
            
            // Enviar dades del joc al client.
            ws.send(JSON.stringify({ type: 'config', ...gameConfig }));
            ws.send(JSON.stringify({ type: 'connected', playerId }));
    
            // Enviar dades del joc a tots els clients.
            transmetreEstatJoc();
        }

        if (data.type === 'start') {
            console.log('Joc iniciat');
            modificarEstatJoc(true);
        } else if (data.type === 'stop') {
            console.log('Joc aturat');
            modificarEstatJoc(false);
        }

        // Tractament de les accions dels jugadors.
        if (data.type === 'moure' && players[data.playerId]) {
            game.moureJugador(players[data.playerId], data.direction, players, gameConfig);
            transmetreEstatJoc();
        } else if (data.type === 'agafar' && players[data.playerId]) {
            game.agafarRoca(players[data.playerId], gameConfig);
            transmetreEstatJoc();
        }
    });
    
    ws.on('close', () => {
        if (players[playerId].equip === "equipLila") { 
            jugadors_equip_1--; 
        } else { 
            jugadors_equip_2--; 
        }
        delete players[playerId];
        transmetreEstatJoc();
    });
});

function transmetreEstatJoc() {
    const state = JSON.stringify({ type: 'update', players, rocks: gameConfig.rocks });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(state);
        }
    });
}

function modificarEstatJoc(estat) {
    gameConfig.running = estat;
    const mensaje = estat ? { type: 'startStop', running: true } : { type: 'startStop', running: false };

    // Enviar el mensaje a todos los clientes sobre el estado del juego
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(mensaje));
        }
    });
}

server.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});