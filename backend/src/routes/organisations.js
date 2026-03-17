const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * POST /api/organisations/apply
 * New organisation submits an application.
 */
router.post('/apply', async (req, res) => {
  try {
    const {
      name,
      registration_number,
      type,
      description,
      contact_name,
      contact_email,
      contact_whatsapp,
      coverage_counties,
    } = req.body;

    if (!name || !type || !contact_email) {
      return res.status(400).json({ error: 'Name, type, and contact email are required' });
    }

    const { data, error } = await supabase
      .from('organisations')
      .insert({
        name,
        registration_number,
        type,
        description,
        contact_name,
        contact_email,
        contact_whatsapp,
        coverage_counties: coverage_counties || [],
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Application submitted. You will receive an email once approved.',
      organisation: data,
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * GET /api/organisations/me
 * Get the current user's organisation profile.
 * Expects auth_user_id from Supabase auth (via middleware).
 */
router.get('/me', async (req, res) => {
  try {
    const authUserId = req.headers['x-user-id']; // Simplified; real impl uses Supabase JWT
    if (!authUserId) return res.status(401).json({ error: 'Not authenticated' });

    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organisation' });
  }
});

/**
 * GET /api/organisations/:id/impact
 * Impact stats for an organisation.
 */
router.get('/:id/impact', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: deliveries, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        school:schools!deliveries_school_id_fkey(name, county, student_population, latitude, longitude)
      `)
      .eq('organisation_id', id)
      .eq('confirmed', true);

    if (error) throw error;

    const totalDeliveries = deliveries.length;
    const totalPads = deliveries.reduce((sum, d) => sum + (d.quantity_delivered || 0), 0);
    const schoolsServed = new Set(deliveries.map((d) => d.school_id)).size;
    const girlsReached = deliveries.reduce(
      (sum, d) => sum + (d.school?.student_population || 0),
      0
    );

    res.json({
      total_deliveries: totalDeliveries,
      total_pads: totalPads,
      schools_served: schoolsServed,
      girls_reached: girlsReached,
      deliveries,
    });
  } catch (err) {
    console.error('Error fetching impact:', err);
    res.status(500).json({ error: 'Failed to fetch impact data' });
  }
});

module.exports = router;
