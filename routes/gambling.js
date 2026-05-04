const express = require('express');
const db = require('../db');
const router = express.Router();

const cases = {
  bronze: {
    name: 'Caixa Bronze',
    price: 5,
    image: '📦',
    skins: [
      { weapon: 'Glock-18', name: 'Water Elemental', rarity: 'Azul', value: 3, chance: 40 },
      { weapon: 'P250', name: 'Mehndi', rarity: 'Azul', value: 4, chance: 30 },
      { weapon: 'MP9', name: 'Hot Rod', rarity: 'Rosa', value: 8, chance: 15 },
      { weapon: 'MAC-10', name: 'Neon Rider', rarity: 'Rosa', value: 12, chance: 10 },
      { weapon: 'AK-47', name: 'Slate', rarity: 'Roxo', value: 25, chance: 4 },
      { weapon: 'AWP', name: 'Chromatic Aberration', rarity: 'Vermelho', value: 60, chance: 1 },
    ]
  },
  prata: {
    name: 'Caixa Prata',
    price: 20,
    image: '🥈',
    skins: [
      { weapon: 'USP-S', name: 'Cortex', rarity: 'Azul', value: 12, chance: 40 },
      { weapon: 'M4A1-S', name: 'Decimator', rarity: 'Azul', value: 15, chance: 30 },
      { weapon: 'AK-47', name: 'Neon Revolution', rarity: 'Rosa', value: 35, chance: 15 },
      { weapon: 'Desert Eagle', name: 'Blaze', rarity: 'Rosa', value: 45, chance: 10 },
      { weapon: 'AWP', name: 'Fever Dream', rarity: 'Roxo', value: 90, chance: 4 },
      { weapon: 'M4A4', name: 'Howl', rarity: 'Vermelho', value: 250, chance: 1 },
    ]
  },
  ouro: {
    name: 'Caixa Ouro',
    price: 50,
    image: '🥇',
    skins: [
      { weapon: 'AK-47', name: 'Vulcan', rarity: 'Azul', value: 30, chance: 40 },
      { weapon: 'AWP', name: 'Asiimov', rarity: 'Azul', value: 40, chance: 30 },
      { weapon: 'M4A4', name: '龍王', rarity: 'Rosa', value: 80, chance: 15 },
      { weapon: 'Knife', name: 'Flip Knife Fade', rarity: 'Rosa', value: 120, chance: 10 },
      { weapon: 'AWP', name: 'Dragon Lore', rarity: 'Roxo', value: 300, chance: 4 },
      { weapon: 'Knife', name: 'Karambit Doppler', rarity: 'Vermelho', value: 600, chance: 1 },
    ]
  },
  diamante: {
    name: 'Caixa Diamante',
    price: 75,
    image: '💎',
    skins: [
      { weapon: 'AK-47', name: 'Fire Serpent', rarity: 'Azul', value: 50, chance: 40 },
      { weapon: 'AWP', name: 'Medusa', rarity: 'Azul', value: 70, chance: 30 },
      { weapon: 'Knife', name: 'Butterfly Fade', rarity: 'Rosa', value: 200, chance: 15 },
      { weapon: 'Knife', name: 'M9 Bayonet Marble Fade', rarity: 'Rosa', value: 300, chance: 10 },
      { weapon: 'Knife', name: 'Karambit Fade', rarity: 'Roxo', value: 600, chance: 4 },
      { weapon: 'Knife', name: 'Karambit Emerald', rarity: 'Vermelho', value: 1500, chance: 1 },
    ]
  },
  lendaria: {
    name: 'Caixa Lendária',
    price: 250,
    image: '👑',
    skins: [
      { weapon: 'Knife', name: 'Talon Doppler', rarity: 'Azul', value: 200, chance: 40 },
      { weapon: 'Knife', name: 'Stiletto Marble Fade', rarity: 'Azul', value: 300, chance: 30 },
      { weapon: 'Knife', name: 'Skeleton Crimson Web', rarity: 'Rosa', value: 600, chance: 15 },
      { weapon: 'Knife', name: 'Butterfly Crimson Web', rarity: 'Rosa', value: 900, chance: 10 },
      { weapon: 'Knife', name: 'Karambit Black Pearl', rarity: 'Roxo', value: 2000, chance: 4 },
      { weapon: 'Knife', name: 'Karambit Sapphire', rarity: 'Vermelho', value: 5000, chance: 1 },
    ]
  }
};

// Get all cases info
router.get('/cases', (req, res) => {
  const info = Object.entries(cases).map(([id, c]) => ({
    id,
    name: c.name,
    price: c.price,
    image: c.image,
    skins: c.skins
  }));
  res.json(info);
});

// Open a case
router.post('/open/:caseId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  const caseData = cases[req.params.caseId];
  if (!caseData) return res.status(404).json({ error: 'Caixa não encontrada' });

  try {
    const [rows] = await db.query('SELECT balance FROM users WHERE steamid = ?', [req.user.steamid]);
    if (!rows.length || rows[0].balance < caseData.price) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Pick skin based on chance
    const roll = Math.random() * 100;
    let cumulative = 0;
    let won = caseData.skins[0];
    for (const skin of caseData.skins) {
      cumulative += skin.chance;
      if (roll <= cumulative) { won = skin; break; }
    }

    // Deduct balance and save skin
    await db.query('UPDATE users SET balance = balance - ? WHERE steamid = ?', [caseData.price, req.user.steamid]);
    await db.query(
      'INSERT INTO user_skins (steamid, weapon, skin_name, rarity, value) VALUES (?, ?, ?, ?, ?)',
      [req.user.steamid, won.weapon, won.name, won.rarity, won.value]
    );
    await db.query(
      'INSERT INTO transactions (steamid, type, amount, description) VALUES (?, ?, ?, ?)',
      [req.user.steamid, 'case_open', -caseData.price, `Abriu ${caseData.name} - Ganhou ${won.weapon} | ${won.name}`]
    );

    const [updated] = await db.query('SELECT balance FROM users WHERE steamid = ?', [req.user.steamid]);
    res.json({ skin: won, newBalance: updated[0].balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

// Get user inventory
router.get('/inventory', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await db.query('SELECT * FROM user_skins WHERE steamid = ? ORDER BY created_at DESC', [req.user.steamid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

// Sell skin
router.post('/sell/:skinId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await db.query('SELECT * FROM user_skins WHERE id = ? AND steamid = ?', [req.params.skinId, req.user.steamid]);
    if (!rows.length) return res.status(404).json({ error: 'Skin não encontrada' });

    const skin = rows[0];
    await db.query('DELETE FROM user_skins WHERE id = ?', [skin.id]);
    await db.query('UPDATE users SET balance = balance + ? WHERE steamid = ?', [skin.value, req.user.steamid]);
    await db.query(
      'INSERT INTO transactions (steamid, type, amount, description) VALUES (?, ?, ?, ?)',
      [req.user.steamid, 'sell', skin.value, `Vendeu ${skin.weapon} | ${skin.skin_name}`]
    );

    const [updated] = await db.query('SELECT balance FROM users WHERE steamid = ?', [req.user.steamid]);
    res.json({ success: true, earned: skin.value, newBalance: updated[0].balance });
  } catch (err) {
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

// Equip/unequip skin
router.post('/equip/:skinId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await db.query('SELECT * FROM user_skins WHERE id = ? AND steamid = ?', [req.params.skinId, req.user.steamid]);
    if (!rows.length) return res.status(404).json({ error: 'Skin não encontrada' });

    const skin = rows[0];
    // Unequip other skins of same weapon
    await db.query('UPDATE user_skins SET equipped = FALSE WHERE steamid = ? AND weapon = ?', [req.user.steamid, skin.weapon]);
    // Toggle equip
    const newEquipped = !skin.equipped;
    await db.query('UPDATE user_skins SET equipped = ? WHERE id = ?', [newEquipped, skin.id]);

    res.json({ success: true, equipped: newEquipped });
  } catch (err) {
    res.status(500).json({ error: 'Erro na base de dados' });
  }
});

// Get balance
router.get('/balance', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await db.query('SELECT balance FROM users WHERE steamid = ?', [req.user.steamid]);
    res.json({ balance: rows[0]?.balance || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
