import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function runMinimal() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Path to the reseed script
        const sqlPath = resolve('supabase/migrations/20251223000004_reseed_minimal.sql');
        const sqlContent = await readFile(sqlPath, 'utf8');

        console.log('Running migration: 20251223000004_reseed_minimal.sql ...');
        await client.query(sqlContent);
        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMinimal();
