import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function runV5() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sqlPath = resolve('supabase/migrations/20251223000006_reseed_v5.sql');
        const sqlContent = await readFile(sqlPath, 'utf8');
        console.log('Running reseed v5...');
        await client.query(sqlContent);
        console.log('V5 Success.');
    } catch (err) {
        console.error('V5 Failed:', err);
    } finally {
        await client.end();
    }
}

runV5();
