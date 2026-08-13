import type { Client } from '@/types/client';

export function crossReferenceClients(
  original: Client[],
  yearClients: Client[]
): { reRegistered: Client[]; notReRegistered: Client[] } {
  const reRegisteredEmails = new Set(
    yearClients.map(c => c.email.toLowerCase())
  );

  const reRegistered: Client[] = [];
  const notReRegistered: Client[] = [];

  for (const client of original) {
    if (reRegisteredEmails.has(client.email.toLowerCase())) {
      reRegistered.push(client);
    } else {
      notReRegistered.push(client);
    }
  }

  return { reRegistered, notReRegistered };
}

/** Merge year-calendar data onto original clients for the re-registered subset. */
export function enrichReRegistered(
  original: Client[],
  yearClients: Client[]
): Client[] {
  const yearMap = new Map(
    yearClients.map(c => [c.email.toLowerCase(), c])
  );

  return original
    .filter(c => yearMap.has(c.email.toLowerCase()))
    .map(c => {
      const yearData = yearMap.get(c.email.toLowerCase())!;
      return {
        ...c,
        meetings: yearData.meetings,
        lastMeeting: yearData.lastMeeting,
      };
    });
}
