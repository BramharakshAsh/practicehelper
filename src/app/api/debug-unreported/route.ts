import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('is_unreported', true)
            .limit(5);

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ count: data?.length, tasks: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
