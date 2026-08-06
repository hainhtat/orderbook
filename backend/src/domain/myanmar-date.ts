const MYANMAR_OFFSET_MINUTES = 6 * 60 + 30;

export function parseMyanmarDateStart(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(
    Date.UTC(year!, month! - 1, day!, 0, -MYANMAR_OFFSET_MINUTES, 0, 0),
  );
}

export function parseMyanmarDateEnd(value: string): Date {
  return new Date(parseMyanmarDateStart(value).getTime() + 86_400_000 - 1);
}
