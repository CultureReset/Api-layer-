const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { attachSectionContent } = require('../utils/sections');
const bookingsRouter = require('./bookings');
const songRequestsRouter = require('./song-requests');
const toolsRouter = require('./tools');

const router = express.Router();

router.use('/:slug/bookings', bookingsRouter);
router.use('/:slug/song-requests', songRequestsRouter);
router.use('/:slug/tools', toolsRouter);

const LIST_COLUMNS =
  'id, slug, name, subtitle, entity_type, entity_subtype, city, state, ' +
  'rating, review_count, price_range, hero_image_url, cover_url, is_active, featured, sort_order';

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from('entity')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(from, to);

    if (req.query.includeInactive !== 'true') query = query.eq('is_active', true);
    if (req.query.type) query = query.eq('entity_type', req.query.type);
    if (req.query.subtype) query = query.eq('entity_subtype', req.query.subtype);
    if (req.query.city) query = query.ilike('city', req.query.city);
    if (req.query.search) query = query.ilike('name', `%${req.query.search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ entities: data, page, limit, total: count });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { data: entity, error: entityError } = await db
      .from('entity')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (entityError && entityError.code !== 'PGRST116') throw entityError;
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const [hours, photos, tags, features, perfectFor, events, specials, sections, tools] = await Promise.all([
      db.from('entity_hours').select('*').eq('entity_id', entity.id).order('day_of_week', { ascending: true }),
      db.from('entity_photos').select('*').eq('entity_id', entity.id).order('sort_order', { ascending: true }),
      db.from('entity_tags').select('*').eq('entity_id', entity.id).order('sort_order', { ascending: true }),
      db.from('entity_features').select('*').eq('entity_id', entity.id).order('sort_order', { ascending: true }),
      db.from('entity_perfect_for').select('*').eq('entity_id', entity.id).order('sort_order', { ascending: true }),
      db
        .from('entity_events')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('is_active', true)
        .order('event_date', { ascending: true }),
      db.from('entity_specials').select('*').eq('entity_id', entity.id).eq('is_active', true),
      db
        .from('entity_sections')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('visible', true)
        .order('sort_order', { ascending: true }),
      db
        .from('entity_tools')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('enabled', true)
        .order('sort_order', { ascending: true }),
    ]);

    for (const [name, result] of Object.entries({ hours, photos, tags, features, perfectFor, events, specials, sections, tools })) {
      if (result.error) throw Object.assign(result.error, { message: `Failed loading ${name}: ${result.error.message}` });
    }

    res.json({
      entity,
      hours: hours.data,
      photos: photos.data,
      tags: tags.data,
      features: features.data,
      perfectFor: perfectFor.data,
      events: events.data,
      specials: specials.data,
      sections: await attachSectionContent(sections.data),
      tools: tools.data,
    });
  })
);

module.exports = router;
