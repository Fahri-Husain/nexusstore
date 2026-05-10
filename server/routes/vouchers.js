const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/vouchers — Get all vouchers (admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('createddate', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vouchers/available — Get active vouchers for users (public, hides sensitive fields)
router.get('/available', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('code, description, discount_type, discount_value, min_purchase, max_uses, used_count, expired_at')
      .eq('is_active', true)
      .or(`expired_at.is.null,expired_at.gt.${new Date().toISOString()}`)
      .order('createddate', { ascending: false });
    if (error) throw error;
    // Filter out fully used vouchers
    const available = (data || []).filter(v => v.max_uses === null || v.used_count < v.max_uses);
    res.json(available);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vouchers/validate/:code — Validate a voucher code (public, used at checkout)
router.get('/validate/:code', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', req.params.code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Voucher tidak ditemukan atau sudah tidak aktif' });

    // Check expiry
    if (data.expired_at && new Date(data.expired_at) < new Date()) {
      return res.status(400).json({ error: 'Voucher sudah kadaluarsa' });
    }

    // Check max uses
    if (data.max_uses !== null && data.used_count >= data.max_uses) {
      return res.status(400).json({ error: 'Voucher sudah mencapai batas penggunaan' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vouchers — Create a new voucher (admin)
router.post('/', async (req, res) => {
  try {
    const body = {
      ...req.body,
      code: req.body.code?.toUpperCase(),
      createddate: new Date().toISOString(),
      lastupdateddate: new Date().toISOString(),
    };
    const { error } = await supabase.from('vouchers').insert(body);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vouchers/:id — Update a voucher (admin)
router.put('/:id', async (req, res) => {
  try {
    const body = {
      ...req.body,
      code: req.body.code?.toUpperCase(),
      lastupdateddate: new Date().toISOString(),
    };
    const { error } = await supabase.from('vouchers').update(body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vouchers/:id — Delete a voucher (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('vouchers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
