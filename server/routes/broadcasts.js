const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/broadcasts/active — Get active broadcasts for global display
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('is_active', true)
      .order('createddate', { ascending: false })
      .limit(1); // Usually we just show 1 global broadcast
    
    if (error) throw error;
    res.json(data[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/broadcasts/admin — Get all broadcasts
router.get('/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('createddate', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/broadcasts
router.post('/', async (req, res) => {
  try {
    const body = {
      ...req.body,
      createddate: new Date().toISOString(),
      lastupdateddate: new Date().toISOString()
    };
    if (!body.createdby) body.createdby = 'Admin';
    if (!body.lastupdatedby) body.lastupdatedby = body.createdby;

    // Optional: if this is set to active, maybe deactivate others?
    // Let's keep it simple for now and allow multiple, though frontend shows latest 1.

    const { error } = await supabase.from('broadcasts').insert(body);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/broadcasts/:id
router.put('/:id', async (req, res) => {
  try {
    const body = {
      ...req.body,
      lastupdateddate: new Date().toISOString()
    };
    if (!body.lastupdatedby) body.lastupdatedby = 'Admin';

    const { error } = await supabase.from('broadcasts').update(body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/broadcasts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('broadcasts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
