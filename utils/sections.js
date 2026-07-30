const db = require('../config/db');

// Maps entity_sections.section_type -> table holding that section's content.
const SECTION_TABLES = {
  rich_text: 'section_rich_text',
  bullets: 'section_bullets',
  groups: 'section_groups',
  items: 'section_items',
  cards: 'section_cards',
  photos: 'section_photos',
  hours: 'section_hours',
  location: 'section_location',
};

async function fetchSectionContent(section) {
  const table = SECTION_TABLES[section.section_type];
  if (!table) return null;

  const query = db.from(table).select('*').eq('section_id', section.id);
  if (table !== 'section_location') query.order('sort_order', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  if (section.section_type === 'location') return data?.[0] || null;

  if (section.section_type === 'groups') {
    const groupIds = data.map((g) => g.id);
    if (groupIds.length === 0) return data.map((g) => ({ ...g, items: [] }));
    const { data: items, error: itemsError } = await db
      .from('section_items')
      .select('*')
      .in('group_id', groupIds)
      .order('sort_order', { ascending: true });
    if (itemsError) throw itemsError;
    return data.map((group) => ({
      ...group,
      items: items.filter((item) => item.group_id === group.id),
    }));
  }

  return data;
}

async function attachSectionContent(sections) {
  return Promise.all(
    sections.map(async (section) => ({
      ...section,
      content: await fetchSectionContent(section),
    }))
  );
}

module.exports = { fetchSectionContent, attachSectionContent };
