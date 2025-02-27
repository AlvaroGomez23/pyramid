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

const app = express();
const PORT_HTTP = 8080; // Puerto para el servidor HTTP.
const PORT_WS = 8180; // Puerto para el servidor WebSockets.

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

// Configurar sessió.
app.use(session({ secret: "secreto", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Servidor HTTP.
const server = http.createServer(app);
server.listen(PORT_HTTP, () => {
    console.log(`Servidor HTTP en http://localhost:${PORT_HTTP}`);
});


const wss = new WebSocketServer({ port: PORT_WS });
console.log('Servidor WebSockets en ws://localhost:8180');

// Cargar credenciales OAuth.
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
            callbackURL: `http://localhost:${PORT_HTTP}/auth/google/callback`,
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

// Rutas:
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

// WebSockets.
wss.on('connection', (ws) => {
    let playerId;
    let isAdmin = false;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        //Comprovar tipus de connexió.
        // ADMIN
        if (data.type === 'admin') {
            isAdmin = true;
            console.log('Admin conectado');
            ws.send(JSON.stringify({ type: 'connected', playerId }));

            transmetreEstatJoc('update');
        } else if (data.type === 'player') { // JUGADOR
            const nouJugador = game.crearJugador(gameConfig, players, jugadors_equip_1, jugadors_equip_2);
            playerId = nouJugador.id;
            players[playerId] = nouJugador;

            // Actualizar los contadores de jugadores
            if (nouJugador.equip === 'equipLila') {
                jugadors_equip_1++;
            } else {
                jugadors_equip_2++;
            }

            ws.send(JSON.stringify({ type: 'connected', playerId }));

            // Enviar datos del juego a todos los clientes.
            transmetreEstatJoc('update');
        }

        if (data.type === 'start') {
            console.log('Juego iniciado');
            gameConfig.running = true;
            gameConfig.rocks = [];
            game.generarRoquesGameArea(gameConfig);

            gameConfig.running = true;
            transmetreEstatJoc('update');

            // Enviar los valores actualizados del campo de juego a todos los clientes
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'config', ...gameConfig }));
                }
            });
        } else if (data.type === 'stop') {
            console.log('Juego detenido');
            gameConfig.running = false;
            transmetreEstatJoc('update');
            resetejarJoc();
            
        } else if (data.type === 'config') {
            gameConfig.width = data.width;
            gameConfig.height = data.height;
            gameConfig.floors = data.floors;

            gameConfig.areaBlau.x = gameConfig.width - gameConfig.areaBlau.width;
            gameConfig.areaBlau.y = gameConfig.height - gameConfig.areaBlau.height;

            Object.values(players).forEach(player => {
                let attempts = 0;
                let newX, newY;
                if (player.x > gameConfig.width || player.y > gameConfig.height) {
                    do {
                        newX = Math.random() * (gameConfig.width - 30);
                        newY = Math.random() * (gameConfig.height - 30);
                        attempts++;
                    } while (game.reposicionamentJugador(newX, newY, players) && attempts < 100); // Limitar el número de intentos
                    if (attempts < 100) {
                        player.x = newX;
                        player.y = newY;
                    }
                }
            });

            
            if (gameConfig.running) {
                gameConfig.rocks = [];
                game.generarRoquesGameArea(gameConfig);
            }

            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ type: 'config', ...gameConfig }));
                }
            });

            
            transmetreEstatJoc('update');
        }

        // Tratamiento de las acciones de los jugadores.
        if (data.type === 'moure' && players[data.playerId]) {
            game.moureJugador(players[data.playerId], data.direction, players, gameConfig);
            transmetreEstatJoc('update');
        } else if (data.type === 'agafar' && players[data.playerId]) {
            game.agafarRoca(players[data.playerId], gameConfig);
            transmetreEstatJoc('update');
        }
    });

    ws.on('close', () => {
        if (isAdmin) {
            console.log('Admin desconectado');
            //Admin desconectat
        } else {
            if (players[playerId]) {
                if (players[playerId].equip === "equipLila") {
                    jugadors_equip_1--;
                } else {
                    jugadors_equip_2--;
                }
                delete players[playerId];
                transmetreEstatJoc('update');
            }
        }
    });
});

//Transmetre l'estat del joc.
export function transmetreEstatJoc(type, guanyador = null) {
    const state = JSON.stringify({
        type: type,
        players: players,
        rocks: gameConfig.rocks,
        width: gameConfig.width,
        height: gameConfig.height,
        floors: gameConfig.floors,
        running: gameConfig.running,
        areaBlau: gameConfig.areaBlau,
        areaLila: gameConfig.areaLila,
        puntsBlau: gameConfig.puntsBlau,
        puntsLila: gameConfig.puntsLila,
        guanyador: guanyador
    });

    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(state);
        }
    });
}

export function resetejarJoc() {
    gameConfig.rocks = [];
    gameConfig.puntsBlau = 0;
    gameConfig.puntsLila = 0;
    gameConfig.running = false;
    transmetreEstatJoc('update');
}