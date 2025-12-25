import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

// Connection string provided by user
const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function runMigration() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in some envs, implies trust
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Path to the reseed script
        const sqlPath = resolve('supabase/migrations/20251223000003_reseed_v3.sql');
        const sqlContent = await readFile(sqlPath, 'utf8');

        console.log('Running migration: 20251223000003_reseed_v3.sql ...');

        // Execute the SQL
        await client.query(sqlContent);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
