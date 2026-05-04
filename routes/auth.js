const express = require('express');
const passport = require('passport');
const db = require('../db');
const router = express.Router();
 
router.get('/steam', passport.authenticate('steam'));
 
router.get('/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      await db.query(
        `INSERT INTO users (steamid, username, avatar, balance)
         VALUES (?, ?, ?, 100.00)
         ON DUPLICATE KEY UPDATE username = VALUES(username), avatar = VALUES(avatar)`,
        [req.user.steamid, req.user.displayName, req.user.photos[2].value]
      );
    } catch (err) {
      console.error('Erro ao guardar utilizador:', err);
    }
    res.redirect('/');
  }
);
 
router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});
 
router.get('/me', async (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });
  try {
    const [rows] = await db.query('SELECT balance FROM users WHERE steamid = ?', [req.user.steamid]);
    res.json({
      loggedIn: true,
      steamid: req.user.steamid,
      name: req.user.displayName,
      avatar: req.user.photos[2].value,
      balance: rows[0]?.balance || 100
    });
  } catch (err) {
    res.json({
      loggedIn: true,
      steamid: req.user.steamid,
      name: req.user.displayName,
      avatar: req.user.photos[2].value,
      balance: 0
    });
  }
});
 
module.exports = router;
