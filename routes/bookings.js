const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { findEntityBySlug } = require('../utils/lookupEntity');

const router = express.Router({ mergeParams: true });

// Public: a customer submits a booking request from the entity's page.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { customer_name, customer_email, customer_phone, party_size, booking_date, booking_time, notes } = req.body;
    if (!customer_name) return res.status(400).json({ error: 'customer_name is required' });

    const { data, error } = await db
      .from('bookings')
      .insert({
        entity_id: entity.id,
        customer_name,
        customer_email,
        customer_phone,
        party_size,
        booking_date,
        booking_time,
        notes,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ booking: data });
  })
);

// Business-facing: list booking requests for this entity.
// NOTE: no auth on this yet -- fine for local/dashboard dev, must be locked down
// (admin session check, same pattern as gcr-api-clean) before this is public.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { data, error } = await db
      .from('bookings')
      .select('*')
      .eq('entity_id', entity.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json({ bookings: data });
  })
);

module.exports = router;
