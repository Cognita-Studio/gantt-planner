import {
  parseISO, format, addDays, addWeeks, addMonths,
  differenceInDays, differenceInCalendarWeeks, differenceInCalendarMonths,
  startOfWeek, startOfMonth, startOfQuarter, endOfQuarter,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  isWeekend, isSameDay, isValid,
} from 'date-fns'
import type { DurationUnit, ZoomLevel } from '../types'

export { parseISO, format, addDays, isWeekend, isSameDay, isValid }

export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function fromISO(s: string): Date {
  return parseISO(s)
}

export function durationInDays(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start)) + 1
}

export function convertDuration(days: number, unit: DurationUnit): number {
  if (unit === 'days') return days
  if (unit === 'weeks') return Math.round(days / 7)
  return Math.round(days / 30)
}

export function daysFromUnit(value: number, unit: DurationUnit): number {
  if (unit === 'days') return value
  if (unit === 'weeks') return value * 7
  return value * 30
}

export function addLag(date: Date, lagDays: number): Date {
  return addDays(date, lagDays)
}

/** Given a zoom level and a viewport width, compute how many px per day */
export function pxPerDay(zoom: ZoomLevel): number {
  if (zoom === 'day') return 40
  if (zoom === 'week') return 24
  if (zoom === 'month') return 8
  return 3 // quarter
}

/** Build the array of header columns for the timeline header */
export interface TimeColumn {
  label: string
  subLabel?: string
  date: Date
  width: number // px
  isWeekend?: boolean
  isToday?: boolean
}

export function buildTimeColumns(
  start: Date,
  end: Date,
  zoom: ZoomLevel,
): TimeColumn[] {
  const today = new Date()
  const ppd = pxPerDay(zoom)

  if (zoom === 'day') {
    return eachDayOfInterval({ start, end }).map(d => ({
      label: format(d, 'd'),
      subLabel: format(d, 'EEE'),
      date: d,
      width: ppd,
      isWeekend: isWeekend(d),
      isToday: isSameDay(d, today),
    }))
  }

  if (zoom === 'week') {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weeks.map(w => ({
      label: `W${format(w, 'w')}`,
      subLabel: format(w, 'MMM d'),
      date: w,
      width: ppd * 7,
    }))
  }

  if (zoom === 'month') {
    const months = eachMonthOfInterval({ start, end })
    return months.map(m => {
      const daysInMonth = differenceInDays(
        addMonths(startOfMonth(m), 1),
        startOfMonth(m),
      )
      return {
        label: format(m, 'MMM'),
        subLabel: format(m, 'yyyy'),
        date: m,
        width: daysInMonth * ppd,
      }
    })
  }

  // quarter
  const quarters: Date[] = []
  let cur = startOfQuarter(start)
  while (cur <= endOfQuarter(end)) {
    quarters.push(cur)
    cur = startOfQuarter(addMonths(cur, 4))
  }
  return quarters.map(q => {
    const daysInQ = differenceInDays(endOfQuarter(q), startOfQuarter(q)) + 1
    return {
      label: `Q${Math.ceil((q.getMonth() + 1) / 3)} ${format(q, 'yyyy')}`,
      date: q,
      width: daysInQ * ppd,
    }
  })
}

/** Convert a date to x-offset in px from the timeline start */
export function dateToX(date: Date, timelineStart: Date, zoom: ZoomLevel): number {
  const days = differenceInDays(date, timelineStart)
  return days * pxPerDay(zoom)
}

/** Convert x-offset to date */
export function xToDate(x: number, timelineStart: Date, zoom: ZoomLevel): Date {
  const days = Math.round(x / pxPerDay(zoom))
  return addDays(timelineStart, days)
}

export function formatDisplayDate(iso: string | null, unit: DurationUnit): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (unit === 'days') return format(d, 'MMM d, yyyy')
  if (unit === 'weeks') return `W${format(d, 'w, yyyy')}`
  return format(d, 'MMM yyyy')
}

export function _ (n: number, unit: DurationUnit): string {
  if (unit === 'days') return `${n}d`
  if (unit === 'weeks') return `${n}w`
  return `${n}mo`
}

export {
  addWeeks, addMonths, startOfWeek, startOfMonth,
  differenceInCalendarWeeks, differenceInCalendarMonths,
}
