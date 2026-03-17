const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { sendWhatsApp } = require('../config/twilio');
const MESSAGES = require('../constants/messages');

/**
 * GET /api/needs
 * List open needs — used by the dashboard map and sidebar.
 * Supports filtering by county and urgency.
 */
router.get('/', async (req, res) => {
  try {
    const { county, urgency, status = 'open' } = req.query;

    let query = supabase
      .from('needs')
      .select(`
        *,
        school:schools!needs_school_id_fkey(
          id, name, county, sub_county, latitude, longitude, student_population
        )
      `)
      .eq('status', status)
      .order('urgency', { ascending: false })
      .order('posted_at', { ascending: true });

    if (county) {
      query = query.eq('school.county', county);
    }
    if (urgency) {
      query = query.eq('urgency', parseInt(urgency, 10));
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching needs:', err);
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

/**
 * POST /api/needs/:id/claim
 * Organisation claims a need. Sends WhatsApp notification to school.
 * Body: { organisation_id, expected_delivery_date }
 */
router.post('/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { organisation_id, expected_delivery_date } = req.body;

    // Verify org is verified
    const { data: org } = await supabase
      .from('organisations')
      .select('id, name, verified')
      .eq('id', organisation_id)
      .single();

    if (!org || !org.verified) {
      return res.status(403).json({ error: 'Organisation not verified' });
    }

    // Claim the need
    const now = new Date().toISOString();
    const { data: need, error } = await supabase
      .from('needs')
      .update({
        status: 'claimed',
        claimed_by: organisation_id,
        claimed_at: now,
        expected_delivery_date,
      })
      .eq('id', id)
      .eq('status', 'open') // Only claim if still open (prevents race conditions)
      .select('*, school:schools!needs_school_id_fkey(whatsapp_number, language_preference, name)')
      .single();

    if (error || !need) {
      return res.status(409).json({ error: 'Need is no longer available' });
    }

    // Create a delivery record
    await supabase.from('deliveries').insert({
      need_id: id,
      organisation_id,
      school_id: need.school_id,
      delivery_date: expected_delivery_date,
    });

    // Notify school via WhatsApp
    const lang = need.school?.language_preference || 'EN';
    const daysUntil = expected_delivery_date
      ? Math.ceil((new Date(expected_delivery_date) - Date.now()) / 86400000)
      : 5;

    const msgKey = 'DELIVERY_INCOMING';
    const localized = MESSAGES[msgKey][lang];
    const notification = typeof localized === 'function'
      ? localized(org.name, daysUntil)
      : localized;

    await sendWhatsApp(need.school.whatsapp_number, notification);

    res.json({ success: true, need });
  } catch (err) {
    console.error('Error claiming need:', err);
    res.status(500).json({ error: 'Failed to claim need' });
  }
});

module.exports = router;
