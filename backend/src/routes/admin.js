const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// TODO: Add admin auth middleware — for now these are open during dev

/**
 * GET /api/admin/organisations/pending
 * List organisations awaiting approval.
 */
router.get('/organisations/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('verified', false)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending organisations' });
  }
});

/**
 * POST /api/admin/organisations/:id/approve
 */
router.post('/organisations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { data, error } = await supabase
      .from('organisations')
      .update({ verified: true, verification_notes: notes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // TODO: Send approval email via SendGrid

    res.json({ message: 'Organisation approved', organisation: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve organisation' });
  }
});

/**
 * POST /api/admin/organisations/:id/reject
 */
router.post('/organisations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { error } = await supabase
      .from('organisations')
      .update({ verification_notes: notes })
      .eq('id', id);

    if (error) throw error;

    // TODO: Send rejection email via SendGrid with notes

    res.json({ message: 'Organisation rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject organisation' });
  }
});

/**
 * GET /api/admin/overview
 * Aggregate stats for admin dashboard.
 */
router.get('/overview', async (req, res) => {
  try {
    const [schools, needs, deliveries, orgs] = await Promise.all([
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('needs').select('id, status', { count: 'exact' }),
      supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('confirmed', true),
      supabase.from('organisations').select('id', { count: 'exact', head: true }).eq('verified', true),
    ]);

    res.json({
      total_schools: schools.count,
      total_needs: needs.count,
      total_confirmed_deliveries: deliveries.count,
      total_verified_organisations: orgs.count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/admin/flagged-schools
 * Schools flagged for suspicious need frequency.
 */
router.get('/flagged-schools', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('flagged', true);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flagged schools' });
  }
});

module.exports = router;
