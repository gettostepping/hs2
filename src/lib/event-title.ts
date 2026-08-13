/** Parse client name and course from calendar event titles like "John Smith - BLS (Renewal)". */
export function parseEventTitle(summary: string | null | undefined): {
  name: string | null;
  course: string | null;
} {
  if (!summary?.trim()) {
    return { name: null, course: null };
  }

  const trimmed = summary.trim();

  // Course: text after the first dash separator
  const dashMatch = trimmed.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  const course = dashMatch ? dashMatch[2].trim() : null;

  // Name: first two words in the title (skip standalone dash tokens)
  const words = trimmed.split(/\s+/).filter((w) => !/^[-–—]$/.test(w));
  const name =
    words.length >= 2 ? `${words[0]} ${words[1]}` : words.length === 1 ? words[0] : null;

  return { name, course };
}
