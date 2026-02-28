import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/cron-supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate Request
        const authHeader = request.headers.get('authorization');
        const superadminPassword = process.env.SUPERADMIN_PASSWORD;

        if (!superadminPassword) {
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        if (authHeader !== `Bearer ${superadminPassword}`) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const firmId = params.id;
        if (!firmId) {
            return NextResponse.json({ error: 'Firm ID is required.' }, { status: 400 });
        }

        // 2. Parse payload
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
        }

        const updateData: any = {};

        // Allowed fields for superadmin to update
        if (body.subscription_tier !== undefined) {
            if (!['free', 'growth'].includes(body.subscription_tier)) {
                return NextResponse.json({ error: 'Invalid subscription_tier.' }, { status: 400 });
            }
            updateData.subscription_tier = body.subscription_tier;
        }

        if (body.subscription_status !== undefined) {
            if (!['active', 'inactive', 'past_due', 'cancelled'].includes(body.subscription_status)) {
                return NextResponse.json({ error: 'Invalid subscription_status.' }, { status: 400 });
            }
            updateData.subscription_status = body.subscription_status;
        }

        if (body.custom_user_limit !== undefined) {
            updateData.custom_user_limit = body.custom_user_limit === '' || body.custom_user_limit === null
                ? null : Number(body.custom_user_limit);
        }

        if (body.custom_client_limit !== undefined) {
            updateData.custom_client_limit = body.custom_client_limit === '' || body.custom_client_limit === null
                ? null : Number(body.custom_client_limit);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
        }

        updateData.subscription_updated_at = new Date().toISOString();

        // 3. Update the firm
        const { data, error } = await supabaseAdmin
            .from('firms')
            .update(updateData)
            .eq('id', firmId)
            .select()
            .single();

        if (error) {
            console.error('Error updating firm limits/subscription:', error);
            return NextResponse.json({ error: 'Failed to update firm details.' }, { status: 500 });
        }

        return NextResponse.json({ firm: data });

    } catch (error: any) {
        console.error('Superadmin firm update error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
