const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * GET /api/deliveries
 * List deliveries for an organisation.
 * Query: organisation_id, status (pending/confirmed/all)
 */
router.get('/', async (req, res) => {
  try {
    const { organisation_id, status } = req.query;

    let query = supabase
      .from('deliveries')
      .select(`
        *,
        school:schools!deliveries_school_id_fkey(name, county, latitude, longitude),
        need:needs!deliveries_need_id_fkey(reference_code, urgency, approximate_quantity)
      `)
      .order('created_at', { ascending: false });

    if (organisation_id) {
      query = query.eq('organisation_id', organisation_id);
    }

    if (status === 'pending') {
      query = query.eq('confirmed', false);
    } else if (status === 'confirmed') {
      query = query.eq('confirmed', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

/**
 * POST /api/deliveries/:id/manual-confirm
 * Manually confirm a delivery from the dashboard (when WhatsApp confirmation doesn't come).
 * Body: { quantity_delivered, note }
 */
router.post('/:id/manual-confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_delivered, note } = req.body;

    const now = new Date().toISOString();

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .update({
        confirmed: true,
        quantity_delivered,
        confirmation_timestamp: now,
        manual_confirmation: true,
        manual_confirmation_note: note,
        impact_logged: true,
      })
      .eq('id', id)
      .select('need_id')
      .single();

    if (error) throw error;

    // Also update the need status
    await supabase
      .from('needs')
      .update({
        status: 'delivered',
        delivered_at: now,
        confirmed_by_school: false, // manual, not school-confirmed
      })
      .eq('id', delivery.need_id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error confirming delivery:', err);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

module.exports = router;
