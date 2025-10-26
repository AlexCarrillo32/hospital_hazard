# Database Migrations Guide

This guide explains how to manage database schema changes using Knex.js
migrations.

## Overview

Database migrations provide version control for your database schema. They allow
you to:

- Track schema changes over time
- Roll back changes if needed
- Share schema updates with your team
- Deploy consistent schemas across environments

## Quick Start

### Run All Pending Migrations

```bash
npm run migrate:latest
```

### Check Migration Status

```bash
npm run migrate:status
```

Output:

```
Migrations:
  [✓] 20250124000001_create_waste_codes_table.js
  [✓] 20250124000002_create_facilities_table.js
  [✓] 20250124000003_create_generators_table.js
  [✓] 20250124000004_create_manifests_table.js
```

### Rollback Last Migration

```bash
npm run migrate:rollback
```

### Create New Migration

```bash
npm run migrate:make add_user_table
```

This creates a new migration file in `migrations/` directory.

## Migration Files

### Current Migrations

1. **20250124000001_create_waste_codes_table.js**
   - Creates `waste_codes` table
   - Stores EPA waste code definitions
   - Indexes on `category` and `type`

2. **20250124000002_create_facilities_table.js**
   - Creates `facilities` table
   - Stores disposal facility information
   - Indexes on `state`, `active`, and geolocation

3. **20250124000003_create_generators_table.js**
   - Creates `generators` table
   - Stores waste generator information
   - Indexes on `state` and `active`

4. **20250124000004_create_manifests_table.js**
   - Creates `manifests` table
   - Stores electronic waste manifests
   - Foreign keys to generators and facilities
   - Indexes on status, dates, and relationships

## Writing Migrations

### Basic Structure

```javascript
/**
 * Run migration (create/alter tables)
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function up(knex) {
  return knex.schema.createTable('my_table', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

/**
 * Rollback migration (undo changes)
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('my_table');
}
```

### Adding Columns

```javascript
export function up(knex) {
  return knex.schema.table('facilities', (table) => {
    table.string('website', 255);
    table.text('notes');
  });
}

export function down(knex) {
  return knex.schema.table('facilities', (table) => {
    table.dropColumn('website');
    table.dropColumn('notes');
  });
}
```

### Adding Indexes

```javascript
export function up(knex) {
  return knex.schema.table('manifests', (table) => {
    table.index('status');
    table.index(['generator_id', 'status']);
  });
}

export function down(knex) {
  return knex.schema.table('manifests', (table) => {
    table.dropIndex('status');
    table.dropIndex(['generator_id', 'status']);
  });
}
```

### Adding Foreign Keys

```javascript
export function up(knex) {
  return knex.schema.table('waste_shipments', (table) => {
    table.string('manifest_id');
    table.foreign('manifest_id').references('id').inTable('manifests');
  });
}

export function down(knex) {
  return knex.schema.table('waste_shipments', (table) => {
    table.dropForeign('manifest_id');
    table.dropColumn('manifest_id');
  });
}
```

## Best Practices

### 1. Always Write Down() Method

Every migration should be reversible:

```javascript
// ✅ Good - can rollback
export function up(knex) {
  return knex.schema.createTable('users', ...);
}
export function down(knex) {
  return knex.schema.dropTableIfExists('users');
}

// ❌ Bad - can't rollback
export function down(knex) {
  return Promise.resolve();
}
```

### 2. One Logical Change Per Migration

```javascript
// ✅ Good - focused on one feature
// migrations/20250124_add_user_authentication.js

// ❌ Bad - mixing unrelated changes
// migrations/20250124_add_users_and_fix_facilities_and_update_waste_codes.js
```

### 3. Test Migrations Before Deploying

```bash
# Run migration
npm run migrate:latest

# Test the application
npm test

# If issues, rollback
npm run migrate:rollback

# Fix migration and try again
```

### 4. Use Transactions for Data Migrations

```javascript
export async function up(knex) {
  return knex.transaction(async (trx) => {
    // Schema changes
    await trx.schema.table('facilities', (table) => {
      table.boolean('verified').defaultTo(false);
    });

    // Data migration
    await trx('facilities')
      .where('certifications', '@>', '["EPA-Certified"]')
      .update({ verified: true });
  });
}
```

### 5. Never Modify Existing Migrations

Once deployed to production:

- Never edit existing migration files
- Create new migrations to fix issues
- Maintain migration history integrity

## Environments

### Development

```bash
# Standard migrations
npm run migrate:latest
```

### Testing

```bash
# Use test database
NODE_ENV=test npm run migrate:latest
```

### Production

```bash
# Run migrations on production database
NODE_ENV=production npm run migrate:latest

# Or using Docker
docker-compose exec app npm run migrate:latest
```

## Troubleshooting

### Migration Already Applied

If you see this error:

```
Migration "xxx" has already been run
```

Check status:

```bash
npm run migrate:status
```

Force re-run (⚠️ dangerous):

```bash
npm run migrate:rollback
npm run migrate:latest
```

### Migration Failed Mid-Way

1. Check database state:

```bash
psql -U postgres waste_compliance
\dt  -- List tables
```

2. Manually rollback if needed:

```sql
DELETE FROM knex_migrations WHERE name = 'failed_migration_name';
```

3. Fix migration file and retry

### Missing Migration Files

Error: "Can't find migration file"

Solution: Ensure migration files are committed to git:

```bash
git add migrations/
git commit -m "Add new migrations"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run database migrations
  run: npm run migrate:latest
  env:
    DB_HOST: ${{ secrets.DB_HOST }}
    DB_NAME: ${{ secrets.DB_NAME }}
    DB_USER: ${{ secrets.DB_USER }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

### Docker Compose

```yaml
app:
  command: sh -c "npm run migrate:latest && node src/server.js"
```

## Additional Resources

- Knex.js Documentation: https://knexjs.org/guide/migrations.html
- Schema Builder: https://knexjs.org/guide/schema-builder.html
- Query Builder: https://knexjs.org/guide/query-builder.html
