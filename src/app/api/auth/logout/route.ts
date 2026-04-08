import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session_token')?.value;

        if (sessionToken) {
            const supabase = createAdminClient();

            // Delete session from database
            await supabase
                .from('auth_sessions')
                .delete()
                .eq('session_token', sessionToken);
        }

        // Always delete the cookie
        cookieStore.delete('session_token');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
    }
}
