/**
 * Create manifests table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function up(knex) {
  const isPostgres = knex.client.config.client === 'pg';

  return knex.schema.createTable('manifests', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    } else {
      table.uuid('id').primary();
    }
    table.string('manifest_number', 50).notNullable().unique();
    table.string('status', 50).notNullable().defaultTo('created');
    table.string('waste_code', 10).notNullable();
    table.string('generator_id', 50).references('id').inTable('generators');
    table.string('facility_id', 50).references('id').inTable('facilities');

    if (isPostgres) {
      table.jsonb('waste_profile');
      table.jsonb('signatures');
      table.jsonb('audit_trail');
    } else {
      table.json('waste_profile');
      table.json('signatures');
      table.json('audit_trail');
    }

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('shipped_at');
    table.timestamp('received_at');
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index('manifest_number');
    table.index('status');
    table.index('waste_code');
    table.index('generator_id');
    table.index('facility_id');
    table.index('created_at');
  });
}

/**
 * Drop manifests table
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('manifests');
}
