import * as fs from 'fs';
import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import passport from "passport";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// - SERVER SOCKET.IO
// Crear el servidor HTTP
const server = createServer();
// Crear el servidor de Socket.IO usando el servidor HTTP
const io = new Server(server);

// - GOOGLE OAUTH2
// Credencials Google
const credencials = JSON.parse(fs.readFileSync(path.join(__dirname, "/Oauth/credencialsOauth.json")));

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

// --------------------------------
// ------------- PORT -------------

// Escuchar en el puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor responent en http://localhost:${PORT}`);
});