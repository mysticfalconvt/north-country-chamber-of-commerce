import type { Event } from '@/payload-types'

export interface EventOccurrence {
  event: Event
  occurrenceDate: string
  isRecurringInstance: boolean
}

/**
 * Get the week of month (1st, 2nd, 3rd, 4th, or last) for a given date
 */
function getWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate()
  return Math.ceil(dayOfMonth / 7)
}

/**
 * Check if a date is the last occurrence of its weekday in the month
 */
function isLastWeekdayOfMonth(date: Date): boolean {
  const nextWeek = new Date(date)
  nextWeek.setDate(date.getDate() + 7)
  return nextWeek.getMonth() !== date.getMonth()
}

/**
 * Get the nth occurrence of a weekday in a given month
 * @param year - The year
 * @param month - The month (0-indexed)
 * @param dayOfWeek - The day of the week (0 = Sunday, 6 = Saturday)
 * @param weekOfMonth - Which occurrence (1 = first, 2 = second, etc., -1 = last)
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  weekOfMonth: number,
): Date | null {
  if (weekOfMonth === -1) {
    // Last occurrence: start from end of month
    const lastDay = new Date(year, month + 1, 0)
    const current = new Date(lastDay)
    while (current.getDay() !== dayOfWeek) {
      current.setDate(current.getDate() - 1)
    }
    return current
  }

  // Find the first occurrence of the weekday
  const firstOfMonth = new Date(year, month, 1)
  const firstOccurrence = new Date(firstOfMonth)
  while (firstOccurrence.getDay() !== dayOfWeek) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1)
  }

  // Add weeks to get the nth occurrence
  const result = new Date(firstOccurrence)
  result.setDate(result.getDate() + (weekOfMonth - 1) * 7)

  // Check if we're still in the same month
  if (result.getMonth() !== month) {
    return null
  }

  return result
}

/**
 * Generate occurrences for a weekly recurring event
 * Uses event.date as start/pattern and event.endDate as when recurrence ends
 */
function generateWeeklyOccurrences(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []

  if (!event.date || !event.endDate) {
    return occurrences
  }

  // Use the main event date as the start and pattern source
  const eventStartDate = new Date(event.date)
  const recurrenceEnd = new Date(event.endDate)
  const startDayOfWeek = eventStartDate.getDay()

  // Start from the later of range start or event start date
  const current = new Date(Math.max(rangeStart.getTime(), eventStartDate.getTime()))

  // Align to the correct day of week
  while (current.getDay() !== startDayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  // Generate occurrences
  while (current <= rangeEnd && current <= recurrenceEnd) {
    if (current >= eventStartDate) {
      occurrences.push({
        event,
        occurrenceDate: current.toISOString(),
        isRecurringInstance: true,
      })
    }
    current.setDate(current.getDate() + 7)
  }

  return occurrences
}

/**
 * Generate occurrences for a monthly recurring event
 * Uses event.date as start/pattern and event.endDate as when recurrence ends
 */
function generateMonthlyOccurrences(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []
  const recurrence = event.recurrence

  if (!event.date || !event.endDate) {
    return occurrences
  }

  // Use the main event date as the start and pattern source
  const eventStartDate = new Date(event.date)
  const recurrenceEnd = new Date(event.endDate)
  const monthlyType = recurrence?.monthlyType || 'dayOfMonth'

  // Determine the pattern from the event start date
  const startDayOfMonth = eventStartDate.getDate()
  const startDayOfWeek = eventStartDate.getDay()
  const startWeekOfMonth = getWeekOfMonth(eventStartDate)
  const startIsLastWeekday = isLastWeekdayOfMonth(eventStartDate)

  // Start from the month of the later of range start or event start
  const currentMonth = new Date(Math.max(rangeStart.getTime(), eventStartDate.getTime()))
  currentMonth.setDate(1) // Start at beginning of month

  while (currentMonth <= rangeEnd && currentMonth <= recurrenceEnd) {
    let occurrenceDate: Date | null = null

    if (monthlyType === 'dayOfMonth') {
      // Same day of month (e.g., 15th)
      occurrenceDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        startDayOfMonth,
      )
      // Handle months with fewer days
      if (occurrenceDate.getMonth() !== currentMonth.getMonth()) {
        occurrenceDate = null
      }
    } else {
      // Same week & day (e.g., 2nd Tuesday)
      const weekNum = startIsLastWeekday ? -1 : startWeekOfMonth
      occurrenceDate = getNthWeekdayOfMonth(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        startDayOfWeek,
        weekNum,
      )
    }

    if (
      occurrenceDate &&
      occurrenceDate >= eventStartDate &&
      occurrenceDate <= recurrenceEnd &&
      occurrenceDate >= rangeStart &&
      occurrenceDate <= rangeEnd
    ) {
      occurrences.push({
        event,
        occurrenceDate: occurrenceDate.toISOString(),
        isRecurringInstance: true,
      })
    }

    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1)
  }

  return occurrences
}

/**
 * Expands recurring events into individual occurrences within a date range
 * @param events - Array of events from Payload
 * @param rangeStart - Start of display range
 * @param rangeEnd - End of display range
 * @returns Array of event occurrences sorted by date
 */
export function expandRecurringEvents(
  events: Event[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []

  for (const event of events) {
    if (!event.isRecurring || !event.recurrence?.recurrenceType) {
      // Non-recurring event - add as single occurrence
      occurrences.push({
        event,
        occurrenceDate: event.date,
        isRecurringInstance: false,
      })
      continue
    }

    // Generate occurrences for recurring events
    const recurrenceType = event.recurrence.recurrenceType

    if (recurrenceType === 'weekly') {
      occurrences.push(...generateWeeklyOccurrences(event, rangeStart, rangeEnd))
    } else if (recurrenceType === 'monthly') {
      occurrences.push(...generateMonthlyOccurrences(event, rangeStart, rangeEnd))
    }
  }

  // Sort by occurrence date
  return occurrences.sort(
    (a, b) => new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime(),
  )
}
