const express = require('express');
const db = require('../db');
const router = express.Router();

// Ver skins do jogador
router.get('/skins', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await db.query(
      'SELECT * FROM wp_player_skins WHERE steamid = ?',
      [req.user.steamid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

// Coinflip
router.post('/coinflip', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const { weapon_defindex, paint } = req.body;
  const ganhou = Math.random() > 0.5;

  try {
    if (ganhou) {
      await db.query(
        `INSERT INTO wp_player_skins (steamid, weapon_defindex, paint)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE paint = VALUES(paint)`,
        [req.user.steamid, weapon_defindex, paint]
      );
      res.json({ resultado: 'ganhou', mensagem: '🎉 Ganhaste! Entra no servidor para ver a skin.' });
    } else {
      res.json({ resultado: 'perdeu', mensagem: '😔 Perdeste! Mais sorte para a próxima.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

module.exports = router;