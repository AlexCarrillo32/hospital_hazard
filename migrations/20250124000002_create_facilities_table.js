/**
 * Create facilities table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function up(knex) {
  const isPostgres = knex.client.config.client === 'pg';

  return knex.schema.createTable('facilities', (table) => {
    table.string('id', 50).primary();
    table.string('name', 255).notNullable();
    table.string('epa_id', 50).notNullable().unique();
    table.text('address').notNullable();
    table.string('city', 100);
    table.string('state', 2).notNullable();
    table.string('zip_code', 10);
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);

    if (isPostgres) {
      table.jsonb('accepted_waste_codes');
    } else {
      table.json('accepted_waste_codes');
    }

    table.decimal('price_per_kg', 10, 2);
    table.integer('max_capacity_kg');
    table.integer('current_capacity_kg').defaultTo(0);

    if (isPostgres) {
      table.jsonb('certifications');
    } else {
      table.json('certifications');
    }

    table.decimal('rating', 3, 2).defaultTo(0);
    table.string('phone', 20);
    table.string('email', 255);
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);

    // Indexes for performance
    table.index('state');
    table.index('active');
    table.index(['latitude', 'longitude']);
  });
}

/**
 * Drop facilities table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('facilities');
}
