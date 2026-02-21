import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Note: Vercel may return 'https,https' for x-forwarded-proto — take only the first value
  const rawProto = request.headers.get('x-forwarded-proto') || 'http';
  const protocol = rawProto.split(',')[0].trim();
  const host = request.headers.get('host');
  const dynamicUrl = `${protocol}://${host}`;

  // Use NEXT_PUBLIC_BASE_URL if set (e.g. production), but fallback to dynamic if on localhost or env var missing
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl || (host && host.includes('localhost'))) {
    baseUrl = dynamicUrl;
  }

  const redirectUri = `${baseUrl?.replace(/\/+$/, '')}/api/auth/callback`;

  console.log('Google Auth Initialized');
  console.log('Base URL:', baseUrl);
  console.log('Redirect URI:', redirectUri);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: scopes,
    prompt: 'consent', // Force consent to ensure refresh token is returned
  });

  return NextResponse.redirect(url);
}
