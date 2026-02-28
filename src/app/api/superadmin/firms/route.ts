import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/cron-supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // 1. Authenticate Request
        const authHeader = request.headers.get('authorization');
        const superadminPassword = process.env.SUPERADMIN_PASSWORD;

        if (!superadminPassword) {
            console.error('SUPERADMIN_PASSWORD is not set in environment variables');
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        if (authHeader !== `Bearer ${superadminPassword}`) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        // 2. Fetch all firms
        const { data: firms, error: firmsError } = await supabaseAdmin
            .from('firms')
            .select(`
                id,
                name,
                email,
                contact_number,
                subscription_tier,
                subscription_status,
                custom_user_limit,
                custom_client_limit,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (firmsError) {
            console.error('Error fetching firms:', firmsError);
            return NextResponse.json({ error: 'Failed to fetch firms.' }, { status: 500 });
        }

        // 3. Get staff and client counts for each firm
        // For a production app with thousands of firms, this should be done via a Postgres function/RPC.
        // For the scope of this portal, we will fetch counts concurrently.
        const firmsWithCounts = await Promise.all((firms || []).map(async (firm) => {
            // Count active staff
            const { count: staffCount, error: staffError } = await supabaseAdmin
                .from('staff')
                .select('*', { count: 'exact', head: true })
                .eq('firm_id', firm.id)
                .eq('is_active', true);

            // Count active clients
            const { count: clientCount, error: clientError } = await supabaseAdmin
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('firm_id', firm.id)
                .eq('is_active', true);

            return {
                ...firm,
                staff_count: staffError ? 0 : (staffCount || 0),
                client_count: clientError ? 0 : (clientCount || 0)
            };
        }));

        return NextResponse.json({ firms: firmsWithCounts });

    } catch (error: any) {
        console.error('Superadmin firms error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
