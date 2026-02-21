import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // Use NEXT_PUBLIC_BASE_URL if set (e.g. production), but fallback to dynamic if on localhost or env var missing
  // Note: Vercel may return 'https,https' for x-forwarded-proto — take only the first value
  const rawProto = request.headers.get('x-forwarded-proto') || 'http';
  const protocol = rawProto.split(',')[0].trim();
  const host = request.headers.get('host');
  const dynamicUrl = `${protocol}://${host}`;

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl || (host && host.includes('localhost'))) {
    baseUrl = dynamicUrl;
  }

  const redirectUri = `${baseUrl?.replace(/\/+$/, '')}/api/auth/callback`;

  console.log('Callback Route Hit');
  console.log('Code:', code ? 'Present' : 'Missing');
  console.log('Redirect URI used for Exchange:', redirectUri);

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email || !userInfo.id) {
      throw new Error('Failed to get user info');
    }

    const supabase = createAdminClient();

    // Upsert user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          email: userInfo.email,
          google_id: userInfo.id,
          name: userInfo.name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token, // Only present if access_type=offline and prompt=consent
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'google_id' }
      )
      .select()
      .single();

    if (userError) {
      console.error('Error upserting user:', userError);
      throw new Error(`DB upsert user failed: ${userError.message ?? JSON.stringify(userError)}`);
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error(`DB insert session failed: ${sessionError.message ?? JSON.stringify(sessionError)}`);
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (error) {
    console.error('Auth error:', error);
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      try { errorMessage = JSON.stringify(error); } catch { errorMessage = String(error); }
    }
    const errorCode = encodeURIComponent(errorMessage.slice(0, 200));
    return NextResponse.redirect(`${baseUrl}?error=auth_failed&detail=${errorCode}`);
  }
}
