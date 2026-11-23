export function shortDate(value: string | null | undefined): string {
  if (!value) {
    return 'No data logged';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No data logged';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function valueOrNone(value: number | string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') {
    return 'No data logged';
  }

  return `${value}${suffix}`;
}

export function clockTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) {
    return 'No data logged';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function pace(secondsPerKm: number | null | undefined): string {
  if (secondsPerKm === null || secondsPerKm === undefined) {
    return 'No data logged';
  }

  return `${clockTime(secondsPerKm)}/km`;
}

export function label(value: string | null | undefined): string {
  if (!value) {
    return 'No data logged';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
