const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/games — Get all games
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let query = supabase
      .from('games')
      .select('*')
      .eq('status', 1)
      .eq('isdeleted', 0);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    switch (sort) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'name':
        query = query.order('title', { ascending: true });
        break;
      default:
        query = query.order('createddate', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/games/:id — Get single game by game_id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('game_id', req.params.id)
      .eq('status', 1)
      .eq('isdeleted', 0)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Game tidak ditemukan' });

    res.json(data);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/games/admin — Add a game (admin, bypasses RLS)
router.post('/admin', async (req, res) => {
  try {
    const body = {
      ...req.body,
      status: 1,
      isdeleted: 0,
      createddate: new Date().toISOString(),
      lastupdateddate: new Date().toISOString(),
    };
    if (!body.createdby) body.createdby = 'Admin';
    if (!body.lastupdatedby) body.lastupdatedby = body.createdby;

    const { error } = await supabase.from('games').insert(body);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/games/admin/:id — Update a game (admin, bypasses RLS)
router.put('/admin/:id', async (req, res) => {
  try {
    const body = {
      ...req.body,
      lastupdateddate: new Date().toISOString()
    };
    if (!body.lastupdatedby) body.lastupdatedby = 'Admin';

    const { error } = await supabase.from('games').update(body).eq('game_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/games/admin/:id — Soft delete a game (admin, bypasses RLS)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('games').update({ isdeleted: 1, lastupdateddate: new Date().toISOString() }).eq('game_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
