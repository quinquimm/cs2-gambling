const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static('public'));

passport.use(new SteamStrategy({
  returnURL: `${process.env.SITE_URL}/auth/steam/return`,
  realm: `${process.env.SITE_URL}/`,
  apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
  profile.steamid = identifier.split('/').pop();
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use('/auth', require('./routes/auth'));
app.use('/gambling', require('./routes/gambling'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Site a correr na porta ${PORT}`));