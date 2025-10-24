/**
 * Create generators table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function up(knex) {
  return knex.schema.createTable('generators', (table) => {
    table.string('id', 50).primary();
    table.string('name', 255).notNullable();
    table.string('epa_id', 50).notNullable().unique();
    table.text('address').notNullable();
    table.string('city', 100);
    table.string('state', 2).notNullable();
    table.string('zip_code', 10);
    table.string('contact_name', 255);
    table.string('contact_email', 255);
    table.string('contact_phone', 20);
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);

    // Indexes for performance
    table.index('state');
    table.index('active');
  });
}

/**
 * Drop generators table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('generators');
}
