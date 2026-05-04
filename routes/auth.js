const express = require('express');
const passport = require('passport');
const router = express.Router();

// Login com Steam
router.get('/steam', passport.authenticate('steam'));

// Callback após login
router.get('/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// Ver utilizador atual
router.get('/me', (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    steamid: req.user.steamid,
    name: req.user.displayName,
    avatar: req.user.photos[2].value
  });
});

module.exports = router;