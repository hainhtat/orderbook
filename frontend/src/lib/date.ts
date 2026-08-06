const YANGON_TIME_ZONE = 'Asia/Yangon'

type DateLike = string | Date

type FormatOptions = Intl.DateTimeFormatOptions

function toDate(value: DateLike): Date {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+06:30`)
  }
  return new Date(value)
}

function partsToIso(parts: Intl.DateTimeFormatPart[]) {
  const byType = new Map(parts.map((part) => [part.type, part.value]))
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`
}

export function formatYangonDate(
  value: DateLike,
  options: FormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: YANGON_TIME_ZONE,
    ...options,
  }).format(toDate(value))
}

export function todayYangonIsoDate(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: YANGON_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return partsToIso(formatter.formatToParts(now))
}

export function shiftYangonIsoDate(baseIsoDate: string, offsetDays: number) {
  const [year, month, day] = baseIsoDate.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return utcDate.toISOString().slice(0, 10)
}

export function differenceInYangonCalendarDays(left: DateLike, right: DateLike) {
  const leftIso = todayYangonIsoDate(toDate(left))
  const rightIso = todayYangonIsoDate(toDate(right))
  const leftMs = Date.parse(`${leftIso}T00:00:00Z`)
  const rightMs = Date.parse(`${rightIso}T00:00:00Z`)
  return Math.round((leftMs - rightMs) / 86_400_000)
}

export { YANGON_TIME_ZONE }
