const db = require('../config/db');

async function findEntityBySlug(slug) {
  const { data, error } = await db.from('entity').select('id, slug, name').eq('slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

module.exports = { findEntityBySlug };
