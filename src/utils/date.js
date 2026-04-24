import dayjs from 'dayjs'

/**
 * Calculate duration (in days) between two dates
 * @param {String} startDate - Start date (YYYY-MM-DD format)
 * @param {String} endDate - End date (YYYY-MM-DD format)
 * @returns {Number} Duration in days (excluding weekends)
 */
export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 1

  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (end.isBefore(start)) return 1

  let days = 0
  let current = start

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dayOfWeek = current.day()
    // Exclude Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++
    }
    current = current.add(1, 'day')
  }

  return Math.max(1, days)
}

/**
 * Add working days to a date (skipping weekends)
 * @param {String} date - Start date (YYYY-MM-DD format)
 * @param {Number} days - Number of working days to add
 * @returns {String} Resulting date (YYYY-MM-DD format)
 */
export function addWorkingDays(date, days) {
  if (!date) return ''
  if (days <= 0) return date

  let result = dayjs(date)
  let daysAdded = 0

  while (daysAdded < days) {
    result = result.add(1, 'day')
    const dayOfWeek = result.day()
    // Count only weekdays
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return result.format('YYYY-MM-DD')
}

/**
 * Subtract working days from a date (skipping weekends)
 * @param {String} date - Start date (YYYY-MM-DD format)
 * @param {Number} days - Number of working days to subtract
 * @returns {String} Resulting date (YYYY-MM-DD format)
 */
export function subtractWorkingDays(date, days) {
  if (!date) return ''
  if (days <= 0) return date

  let result = dayjs(date)
  let daysSubtracted = 0

  while (daysSubtracted < days) {
    result = result.subtract(1, 'day')
    const dayOfWeek = result.day()
    // Count only weekdays
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysSubtracted++
    }
  }

  return result.format('YYYY-MM-DD')
}

/**
 * Format date for display
 * @param {String|Date} date - Date to format
 * @param {String} format - Desired format (default: YYYY-MM-DD)
 * @returns {String} Formatted date string
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * Format date in Chinese format
 * @param {String|Date} date - Date to format
 * @returns {String} Formatted date string (YYYY年MM月DD日)
 */
export function formatDateChinese(date) {
  if (!date) return ''
  return dayjs(date).format('YYYY年MM月DD日')
}

/**
 * Parse date string to dayjs object
 * @param {String} dateString - Date string to parse
 * @returns {Object} dayjs object
 */
export function parseDate(dateString) {
  if (!dateString) return dayjs()
  return dayjs(dateString)
}

/**
 * Check if a date is valid
 * @param {String} dateString - Date string to validate
 * @returns {Boolean} True if valid date
 */
export function isValidDate(dateString) {
  if (!dateString) return false
  return dayjs(dateString).isValid()
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {String} Today's date
 */
export function getToday() {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Check if date range is valid
 * @param {String} startDate - Start date
 * @param {String} endDate - End date
 * @returns {Boolean} True if start is before or equal to end
 */
export function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false
  return dayjs(startDate).isBefore(dayjs(endDate)) || dayjs(startDate).isSame(dayjs(endDate), 'day')
}

/**
 * Get date range for a given period
 * @param {String} period - Period type: 'week', 'month', 'quarter', 'year'
 * @param {Date|String} referenceDate - Reference date (default: today)
 * @returns {Object} Object with startDate and endDate
 */
export function getDateRange(period, referenceDate = null) {
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

/**
 * Calculate end date based on start date and duration
 * @param {String} startDate - Start date
 * @param {Number} duration - Duration in working days
 * @returns {String} End date
 */
export function calculateEndDate(startDate, duration) {
  if (!startDate || duration <= 0) return startDate
  return addWorkingDays(startDate, duration - 1) // -1 because start day counts as day 1
}

/**
 * Get the difference in days between two dates
 * @param {String} date1 - First date
 * @param {String} date2 - Second date
 * @returns {Number} Difference in days
 */
export function getDaysDiff(date1, date2) {
  if (!date1 || !date2) return 0
  return dayjs(date2).diff(dayjs(date1), 'day')
}

/**
 * Check if a date is a weekend
 * @param {String|Date} date - Date to check
 * @returns {Boolean} True if Saturday or Sunday
 */
export function isWeekend(date) {
  if (!date) return false
  const day = dayjs(date).day()
  return day === 0 || day === 6
}

/**
 * Check if a date is within a range
 * @param {String} date - Date to check
 * @param {String} startDate - Range start date
 * @param {String} endDate - Range end date
 * @returns {Boolean} True if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
  if (!date || !startDate || !endDate) return false
  const d = dayjs(date)
  return d.isAfter(dayjs(startDate)) && d.isBefore(dayjs(endDate)) ||
         d.isSame(dayjs(startDate), 'day') ||
         d.isSame(dayjs(endDate), 'day')
}
