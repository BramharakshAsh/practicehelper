import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function runUltra() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Path to the reseed script
        const sqlPath = resolve('supabase/migrations/20251223000005_reseed_ultra_minimal.sql');
        const sqlContent = await readFile(sqlPath, 'utf8');

        console.log('Running migration: 20251223000005_reseed_ultra_minimal.sql ...');
        await client.query(sqlContent);
        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err.message); // Print message ONLY to avoid huge object
        if (err.detail) console.error('Detail:', err.detail);
        if (err.hint) console.error('Hint:', err.hint);
    } finally {
        await client.end();
    }
}

runUltra();
