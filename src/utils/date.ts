import dayjs from 'dayjs'
import type { DateRange } from '~/types'

export function calculateDuration(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1

  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (end.isBefore(start)) return 1

  let days = 0
  let current = start

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dayOfWeek = current.day()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++
    }
    current = current.add(1, 'day')
  }

  return Math.max(1, days)
}

export function addWorkingDays(date: string, days: number): string {
  if (!date) return ''
  if (days <= 0) return date

  let result = dayjs(date)
  let daysAdded = 0

  while (daysAdded < days) {
    result = result.add(1, 'day')
    const dayOfWeek = result.day()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return result.format('YYYY-MM-DD')
}

export function subtractWorkingDays(date: string, days: number): string {
  if (!date) return ''
  if (days <= 0) return date

  let result = dayjs(date)
  let daysSubtracted = 0

  while (daysSubtracted < days) {
    result = result.subtract(1, 'day')
    const dayOfWeek = result.day()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysSubtracted++
    }
  }

  return result.format('YYYY-MM-DD')
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateChinese(date: string | Date): string {
  if (!date) return ''
  return dayjs(date).format('YYYY年MM月DD日')
}

export function parseDate(dateString: string): dayjs.Dayjs {
  if (!dateString) return dayjs()
  return dayjs(dateString)
}

export function isValidDate(dateString: string): boolean {
  if (!dateString) return false
  return dayjs(dateString).isValid()
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false
  return dayjs(startDate).isBefore(dayjs(endDate)) || dayjs(startDate).isSame(dayjs(endDate), 'day')
}

export function getDateRange(period: string, referenceDate: string | Date | null = null): DateRange {
  const ref = referenceDate ? dayjs(referenceDate) : dayjs()

  switch (period) {
    case 'week':
      return {
        startDate: ref.startOf('week').format('YYYY-MM-DD'),
        endDate: ref.endOf('week').format('YYYY-MM-DD')
      }
    case 'month':
      return {
        startDate: ref.startOf('month').format('YYYY-MM-DD'),
        endDate: ref.endOf('month').format('YYYY-MM-DD')
      }
    case 'quarter':
      return {
        startDate: ref.startOf('quarter').format('YYYY-MM-DD'),
        endDate: ref.endOf('quarter').format('YYYY-MM-DD')
      }
    case 'year':
      return {
        startDate: ref.startOf('year').format('YYYY-MM-DD'),
        endDate: ref.endOf('year').format('YYYY-MM-DD')
      }
    default:
      return {
        startDate: ref.format('YYYY-MM-DD'),
        endDate: ref.format('YYYY-MM-DD')
      }
  }
}

export function calculateEndDate(startDate: string, duration: number): string {
  if (!startDate || duration <= 0) return startDate
  return addWorkingDays(startDate, duration - 1)
}

export function getDaysDiff(date1: string, date2: string): number {
  if (!date1 || !date2) return 0
  return dayjs(date2).diff(dayjs(date1), 'day')
}

export function isWeekend(date: string | Date): boolean {
  if (!date) return false
  const day = dayjs(date).day()
  return day === 0 || day === 6
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  if (!date || !startDate || !endDate) return false
  const d = dayjs(date)
  return (d.isAfter(dayjs(startDate)) && d.isBefore(dayjs(endDate))) ||
         d.isSame(dayjs(startDate), 'day') ||
         d.isSame(dayjs(endDate), 'day')
}
