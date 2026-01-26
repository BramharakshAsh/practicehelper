import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function debugDeep() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Check Instances
        console.log('--- Auth Instances ---');
        try {
            const instances = await client.query('SELECT * FROM auth.instances');
            console.table(instances.rows);
        } catch (e) {
            console.log('Could not read auth.instances:', e.message);
        }

        // 2. Check Constraints
        console.log('--- Constraints on auth.users ---');
        const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint 
      WHERE conrelid = 'auth.users'::regclass
    `);
        constraints.rows.forEach(c => console.log(`${c.conname} (${c.contype}): ${c.def}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

debugDeep();
