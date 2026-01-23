import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:BramharakshAsh_1196@db.djcaimdpcdxvwekixjco.supabase.co:5432/postgres';

async function fixAndReset() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        // 1. Grant Permissions (Broad stroke to fix "Database error querying schema")
        console.log('Granting Permissions...');
        await client.query(`
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
      GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
      
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin, anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin, anon, authenticated;
      GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin, anon, authenticated;
    `);

        // 2. Clean EVERYTHING
        console.log('Cleaning Tables...');
        await client.query(`
      TRUNCATE TABLE auth.users CASCADE;
      -- Cascade should wipe public.users if FK exists, but let's be sure
      TRUNCATE TABLE public.users CASCADE; 
      TRUNCATE TABLE public.firms CASCADE;
    `);

        console.log('Reset Complete.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixAndReset();
