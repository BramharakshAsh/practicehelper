import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function debugAuth() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        // 1. Check Triggers
        console.log('\n--- Checking Triggers ---');
        const triggers = await client.query(`
      SELECT event_object_schema as schema, event_object_table as table, trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_schema IN ('public', 'auth')
      ORDER BY schema, table;
    `);
        triggers.rows.forEach(r => console.log(`${r.schema}.${r.table} -> ${r.trigger_name}`));

        // 2. Check Auth Users
        console.log('\n--- Checking Auth Users ---');
        const users = await client.query(`SELECT id, email, created_at FROM auth.users`);
        users.rows.forEach(u => console.log(`${u.id} | ${u.email} | ${u.created_at}`));

        if (users.rows.length === 0) {
            console.log('NO AUTH USERS FOUND. Seeding failed silently?');
        } else {
            // 3. Simulation: Try to update last_sign_in_at to see if it explodes
            console.log('\n--- Simulating Login Update ---');
            const userId = users.rows[0].id;
            try {
                await client.query(`UPDATE auth.users SET last_sign_in_at = NOW() WHERE id = $1`, [userId]);
                console.log('Manual update of auth.users SUCCEEDED.');
            } catch (e) {
                console.error('Manual update of auth.users FAILED:', e.message);
            }
        }

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await client.end();
    }
}

debugAuth();
