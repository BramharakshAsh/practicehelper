
import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function updatePasswordV2() {
    const password = 'admin123';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    console.log('Generated Hash:', hash);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        await client.query(`
      UPDATE auth.users 
      SET encrypted_password = $1 
      WHERE email = 'admin@democaassociates.com'
    `, [hash]);

        console.log('Password updated successfully.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

updatePasswordV2();
