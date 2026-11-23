export function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
