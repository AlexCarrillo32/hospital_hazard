/**
 * Create waste_codes table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function up(knex) {
  return knex.schema.createTable('waste_codes', (table) => {
    table.string('code', 10).primary();
    table.string('category', 50).notNullable();
    table.string('type', 50).notNullable();
    table.text('description').notNullable();
    table.string('haz_class', 100);
    table.jsonb('examples');
    table.text('disposal_method');
    table.text('handling_precautions');
    table.string('cas_number', 50);
    table.timestamps(true, true);

    // Indexes for performance
    table.index('category');
    table.index('type');
  });
}

/**
 * Drop waste_codes table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('waste_codes');
}
