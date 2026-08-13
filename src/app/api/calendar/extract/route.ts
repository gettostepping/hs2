import { google, calendar_v3 } from 'googleapis';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
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

    // Define strict type for User to avoid TS errors
    interface User {
      id: string;
      email: string;
      access_token?: string | null;
      refresh_token?: string | null;
    }

    // Cast the joined data to the expected type
    const user = session.users as unknown as User;

    // Explicitly check for null/undefined before accessing properties
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

    // Check if token needs refresh (googleapis handles this automatically if refresh_token is present)
    // However, we should listen to 'tokens' event to update DB if it changes, 
    // but in a stateless function we rely on library's auto-refresh behavior during request 
    // or manually refresh if we want to persist the new access token.
    // For simplicity, we let the library handle the request. If it fails, we might need manual refresh logic.
    // A better approach for persistence:

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await supabase.from('users').update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || user.refresh_token // refresh_token might not be returned
        }).eq('id', user.id);
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate time range from ISO date strings (yyyy-mm-dd)
    const rangeStart = new Date(startDate + 'T00:00:00');
    const rangeEnd = new Date(endDate + 'T23:59:59');

    const timeMin = rangeStart.toISOString();
    const timeMax = rangeEnd.toISOString();

    console.log(`Extracting for: ${timeMin} to ${timeMax}`);
    console.log(`User email: ${user.email}`);

    // Google Calendar returns max 250 events per page — paginate for busy calendars
    const events: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;

    do {
      const eventsResponse = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        pageToken,
      });

      events.push(...(eventsResponse.data.items || []));
      pageToken = eventsResponse.data.nextPageToken ?? undefined;
    } while (pageToken);

    console.log(`Found ${events.length} events`);
    if (events.length > 0) {
      console.log('Sample event attendees:', JSON.stringify(events[0].attendees, null, 2));
    }

    // Extract client info (attendees + description/summary scan)
    const clientMap = new Map();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    // Regex for phone numbers (North American formats mainly, plus international starting with +)
    // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890
    const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;

    events.forEach(event => {
      const userEmail = user.email?.toLowerCase();
      const eventDate = event.start?.dateTime || event.start?.date;

      // Extract phone numbers from description
      const foundPhones = event.description ? (event.description.match(phoneRegex) || []) : [];
      const bestPhone = foundPhones.length > 0 ? foundPhones[0].replace(/[\(\)\[\]\s\-]/g, '') : undefined;

      // 1. Check attendees
      if (event.attendees) {
        event.attendees.forEach(attendee => {
          const attendeeEmail = attendee.email?.toLowerCase();

          if (attendeeEmail && attendeeEmail !== userEmail && !attendee.self && !attendee.resource) {
            const displayName = attendee.displayName || attendee.email?.split('@')[0] || 'Unknown';
            addClient(attendeeEmail, displayName, eventDate, bestPhone);
          }
        });
      }

      // 2. Scan description for emails
      if (event.description) {
        const foundEmails = event.description.match(emailRegex) || [];
        foundEmails.forEach(email => {
          const normalizedEmail = email.toLowerCase();
          if (normalizedEmail !== userEmail) {
            addClient(normalizedEmail, normalizedEmail.split('@')[0], eventDate, bestPhone);
          }
        });
      }

      // 3. Scan summary (title) for emails
      if (event.summary) {
        const foundEmails = event.summary.match(emailRegex) || [];
        foundEmails.forEach(email => {
          const normalizedEmail = email.toLowerCase();
          if (normalizedEmail !== userEmail) {
            addClient(normalizedEmail, normalizedEmail.split('@')[0], eventDate, bestPhone);
          }
        });
      }
    });

    function addClient(email: string, name: string, lastMeetingDate: string | null | undefined, phone: string | undefined) {
      if (!clientMap.has(email)) {
        clientMap.set(email, {
          email: email,
          name: name,
          meetings: 0,
          lastMeeting: null,
          phoneNumber: null
        });
      }

      const client = clientMap.get(email);
      client.meetings++;

      if (phone && !client.phoneNumber) {
        client.phoneNumber = phone;
      }

      if (lastMeetingDate) {
        if (!client.lastMeeting || new Date(lastMeetingDate) > new Date(client.lastMeeting)) {
          client.lastMeeting = lastMeetingDate;
        }
      }
    }

    const clients = Array.from(clientMap.values());

    // We no longer save extraction results to the database as per user request.
    // Every request is a fresh extraction from Google Calendar.

    return NextResponse.json({
      clients,
      totalEvents: events.length,
      extractionId: null
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Calendar extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract calendar data' }, { status: 500 });
  }
}
