import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function checkDefaults() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users'
    `);

        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkDefaults();
