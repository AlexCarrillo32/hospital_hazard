/**
 * Make waste_code column nullable in manifests table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  const isPostgres = knex.client.config.client === 'pg';

  return knex.schema.alterTable('manifests', (table) => {
    if (isPostgres) {
      // PostgreSQL: ALTER COLUMN to drop NOT NULL constraint
      table.string('waste_code', 10).nullable().alter();
    } else {
      // SQLite doesn't support ALTER COLUMN directly
      // We'll need to recreate the column, but SQLite doesn't enforce NOT NULL on existing data
      // So we just need to ensure future schema changes account for this
      table.string('waste_code', 10).nullable().alter();
    }
  });
}

/**
 * Revert waste_code column to NOT NULL
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  const isPostgres = knex.client.config.client === 'pg';

  return knex.schema.alterTable('manifests', (table) => {
    if (isPostgres) {
      table.string('waste_code', 10).notNullable().alter();
    } else {
      table.string('waste_code', 10).notNullable().alter();
    }
  });
}
