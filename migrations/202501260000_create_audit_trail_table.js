/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  const isPostgres = knex.client.config.client === 'pg';
  const isSQLite = knex.client.config.client === 'sqlite3';

  return knex.schema.createTable('audit_trail', (table) => {
    // Primary key - PostgreSQL uses UUID, SQLite uses TEXT
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    } else {
      table.uuid('id').primary();
    }

    // Audit metadata
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.string('event_type', 100).notNullable(); // classification, profile_generation, manifest_creation, etc.
    table.string('action', 50).notNullable(); // create, update, delete, approve, reject
    table.string('resource_type', 100).notNullable(); // waste_profile, manifest, facility, etc.
    table.string('resource_id', 255); // ID of the resource being audited

    // User information
    table.string('user_id', 255); // User who performed the action
    table.string('user_email', 255);
    table.string('user_role', 100); // admin, ehs_director, operator, system

    // IP address - PostgreSQL uses inet type, SQLite uses string
    if (isPostgres) {
      table.specificType('ip_address', 'inet'); // IPv4 or IPv6
    } else {
      table.string('ip_address', 45); // Max length for IPv6
    }

    // AI-specific fields
    table.string('ai_model', 100); // Model used for AI operations
    table.string('trace_id', 255); // Correlation ID for tracking requests
    table.decimal('confidence_score', 5, 4); // AI confidence (0.0000 to 1.0000)
    table.boolean('requires_human_review').defaultTo(false);
    table.boolean('human_review_completed').defaultTo(false);
    table.timestamp('reviewed_at');
    table.string('reviewed_by', 255);

    // Request/Response data - PostgreSQL uses jsonb, SQLite uses json (text)
    if (isPostgres) {
      table.jsonb('request_data'); // Input data (sanitized)
      table.jsonb('response_data'); // Output data (sanitized)
      table.jsonb('metadata'); // Additional context (errors, warnings, etc.)
    } else {
      table.json('request_data'); // Input data (sanitized)
      table.json('response_data'); // Output data (sanitized)
      table.json('metadata'); // Additional context (errors, warnings, etc.)
    }

    // Compliance fields
    table.string('waste_code', 20); // EPA waste code (D001, F001, etc.)
    table.string('regulation_reference', 500); // Citation (e.g., "40 CFR 261.21")
    table.text('compliance_notes'); // Compliance-specific notes
    table.string('status', 50); // pending, approved, rejected, completed

    // Session tracking
    table.string('session_id', 255); // User session ID
    table.string('request_id', 255); // Unique request ID

    // Indexes for fast querying
    table.index('timestamp');
    table.index('event_type');
    table.index('resource_type');
    table.index('resource_id');
    table.index('user_id');
    table.index('trace_id');
    table.index('waste_code');
    table.index('status');
    table.index(['user_id', 'timestamp']);
    table.index(['event_type', 'timestamp']);
    table.index(['requires_human_review', 'human_review_completed']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('audit_trail');
}
