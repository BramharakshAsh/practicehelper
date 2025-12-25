import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function checkAuth() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        // Check if we can read auth.users
        const res = await client.query('SELECT count(*) FROM auth.users');
        console.log('Auth Users Count:', res.rows[0].count);

        // Check for triggers on auth.users using pg_trigger
        const triggers = await client.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = 'auth.users'::regclass
    `);

        console.log('Triggers on auth.users:', triggers.rows.map(r => r.tgname));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkAuth();
