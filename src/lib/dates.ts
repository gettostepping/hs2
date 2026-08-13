/** Full calendar year range (Jan 1 – Dec 31), including future dates for advance bookings. */
export function yearRange(year: number): { startDate: string; endDate: string } {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

/** Years available for cross-reference (2020 through current year). */
export function availableYears(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 2020; y--) {
    years.push(y);
  }
  return years;
}
