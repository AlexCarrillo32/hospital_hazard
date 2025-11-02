/**
 * Add missing fields to manifests table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  const isPostgres = knex.client.config.client === 'pg';

  return knex.schema.table('manifests', (table) => {
    // Add transporter information fields
    table.string('transporter_epa_id', 50);
    table.string('transporter_name', 255);

    // Add waste profile reference
    table.string('waste_profile_id', 50);

    // Add route details - PostgreSQL uses jsonb, SQLite uses json
    if (isPostgres) {
      table.jsonb('route_details');
    } else {
      table.json('route_details');
    }
  });
}

/**
 * Remove added fields from manifests table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.table('manifests', (table) => {
    table.dropColumn('transporter_epa_id');
    table.dropColumn('transporter_name');
    table.dropColumn('waste_profile_id');
    table.dropColumn('route_details');
  });
}
