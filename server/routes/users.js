const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/users/admin — Get all profiles
router.get('/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('createddate', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/admin/:id/role — Update user role
router.put('/admin/:id/role', async (req, res) => {
  try {
    const { role } = req.body; // 'admin' or 'user'
    const { error } = await supabase
      .from('profiles')
      .update({ role, lastupdateddate: new Date().toISOString() })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/admin/:id/suspend — Toggle suspend status
router.put('/admin/:id/suspend', async (req, res) => {
  try {
    const { is_banned } = req.body;
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned, lastupdateddate: new Date().toISOString() })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
