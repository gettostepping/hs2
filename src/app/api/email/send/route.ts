import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { clients, templateId, templateSubject, templateBody } = await request.json();

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: 'No clients provided' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify session and get user
    const { data: session, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('user_id, users(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Define strict type for User
    interface User {
        id: string;
        email: string;
        access_token?: string | null;
        refresh_token?: string | null;
    }

    // Cast the joined data
    const user = session.users as unknown as User;

    if (!user || !user.access_token) {
      return NextResponse.json({ error: 'Google account not linked' }, { status: 400 });
    }

    // Setup Google Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Send emails sequentially (could be parallelized but rate limits might be an issue)
    for (const client of clients) {
        if (!client.email) continue;

        try {
            // Replace variables
            const subject = templateSubject.replace('{{name}}', client.name);
            const body = templateBody.replace('{{name}}', client.name);

            // Create email content
            // Format:
            // To: email
            // Subject: subject
            // 
            // body
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            const messageParts = [
                `To: ${client.email}`,
                `Subject: ${utf8Subject}`,
                'Content-Type: text/plain; charset=utf-8',
                'MIME-Version: 1.0',
                '',
                body
            ];
            const message = messageParts.join('\n');
            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });

            results.push({ email: client.email, status: 'sent' });
            successCount++;
        } catch (error: any) {
            console.error(`Failed to send to ${client.email}:`, error);
            results.push({ email: client.email, status: 'failed', error: error.message });
            failCount++;
        }
    }

    return NextResponse.json({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        results 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
