const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { findEntityBySlug } = require('../utils/lookupEntity');

const router = express.Router({ mergeParams: true });

// song_requests is keyed to an artist, not directly to an entity. Most entities
// using this tool ARE the artist, so find-or-create a default artist row for them.
async function findOrCreateDefaultArtist(entity) {
  const { data: existing, error: findError } = await db
    .from('artists')
    .select('id')
    .eq('entity_id', entity.id)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await db
    .from('artists')
    .insert({ entity_id: entity.id, name: entity.name })
    .select('id')
    .single();
  if (createError) throw createError;
  return created.id;
}

// Public: a fan submits a song request from the entity's page.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { requester_name, song_name, tip_amount, tip_method, tip_handle } = req.body;
    if (!song_name) return res.status(400).json({ error: 'song_name is required' });

    const artistId = await findOrCreateDefaultArtist(entity);

    const { data, error } = await db
      .from('song_requests')
      .insert({
        artist_id: artistId,
        requester_name,
        song_name,
        tip_amount,
        tip_method,
        tip_handle,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({ songRequest: data });
  })
);

// Business/performer-facing: the live queue for this entity.
// NOTE: no auth on this yet -- see routes/bookings.js note.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { data: artistRows, error: artistError } = await db.from('artists').select('id').eq('entity_id', entity.id);
    if (artistError) throw artistError;
    const artistIds = artistRows.map((a) => a.id);
    if (!artistIds.length) return res.json({ songRequests: [] });

    const { data, error } = await db
      .from('song_requests')
      .select('*')
      .in('artist_id', artistIds)
      .order('created_at', { ascending: true });
    if (error) throw error;

    res.json({ songRequests: data });
  })
);

module.exports = router;
