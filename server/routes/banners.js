const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/banners/active — Get active banners for homepage (Public)
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('createddate', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/banners/admin — Get all banners for AdminPanel
router.get('/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('createddate', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/banners — Create a new banner (Admin)
router.post('/', async (req, res) => {
  try {
    const body = {
      ...req.body,
      createddate: new Date().toISOString(),
      lastupdateddate: new Date().toISOString()
    };
    if (!body.createdby) body.createdby = 'Admin';
    if (!body.lastupdatedby) body.lastupdatedby = body.createdby;

    const { error } = await supabase.from('banners').insert(body);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/banners/:id — Update a banner (Admin)
router.put('/:id', async (req, res) => {
  try {
    const body = {
      ...req.body,
      lastupdateddate: new Date().toISOString()
    };
    if (!body.lastupdatedby) body.lastupdatedby = 'Admin';

    const { error } = await supabase.from('banners').update(body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/banners/:id — Delete a banner (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
