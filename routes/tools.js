const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { findEntityBySlug } = require('../utils/lookupEntity');

const router = express.Router({ mergeParams: true });

// All installed tools for this entity, enabled or not (the entity detail endpoint
// only returns enabled ones -- this is for a future "app store" dashboard view).
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { data, error } = await db
      .from('entity_tools')
      .select('*')
      .eq('entity_id', entity.id)
      .order('sort_order', { ascending: true });
    if (error) throw error;

    res.json({ tools: data });
  })
);

// Install a tool, or update its config/label/enabled state if already installed.
router.put(
  '/:toolKey',
  asyncHandler(async (req, res) => {
    const entity = await findEntityBySlug(req.params.slug);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    const { enabled = true, label, sortOrder = 0, config = {} } = req.body;

    const { data, error } = await db
      .from('entity_tools')
      .upsert(
        {
          entity_id: entity.id,
          tool_key: req.params.toolKey,
          enabled,
          label,
          sort_order: sortOrder,
          config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entity_id,tool_key' }
      )
      .select()
      .single();
    if (error) throw error;

    res.json({ tool: data });
  })
);

module.exports = router;
