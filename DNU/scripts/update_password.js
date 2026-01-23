import { readFile } from 'fs/promises';
import { resolve } from 'path';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

// Arg 1 = Hash
const hash = process.argv[2];

if (!hash) {
    console.error('Please provide hash as argument');
    process.exit(1);
}

async function updatePassword() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('Updating password to:', hash);

        await client.query(`
      UPDATE auth.users 
      SET encrypted_password = $1 
      WHERE email = 'admin@democaassociates.com'
    `, [hash]);

        console.log('Update Success.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

updatePassword();
