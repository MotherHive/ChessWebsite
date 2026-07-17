export const meetingDetails = {
    title: "Scranton Chess Club",
    location: "Nazareth Center 2nd Floor, Marywood University",
    startHour: 18,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
    dayLabel: "Tuesdays",
    timezone: "America/New_York",
}

const weekdayIndexes = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
}

const getDatePartsInTimezone = (date, timezone = meetingDetails.timezone) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        weekday: weekdayIndexes[values.weekday],
    }
}

const formatCalendarDate = (date, timezone = meetingDetails.timezone) => {
    const { year, month, day } = getDatePartsInTimezone(date, timezone)

    return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`
}

const formatUtcDateTime = (date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

const formatCalendarTime = (hour, minute) => {
    return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`
}

export const getNextTuesday = (
    fromDate = new Date(),
    timezone = meetingDetails.timezone,
) => {
    const { year, month, day, weekday } = getDatePartsInTimezone(fromDate, timezone)
    const daysUntilTuesday = (2 - weekday + 7) % 7

    // Noon UTC keeps this date on the same Eastern calendar day while allowing
    // callers to continue working with a Date object.
    return new Date(Date.UTC(year, month - 1, day + daysUntilTuesday, 12))
}

export const formatMeetingDateLabel = (
    date,
    { weekday = "long", timezone = meetingDetails.timezone } = {},
) => {
    return date.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday,
        month: "long",
        day: "numeric",
    })
}

export const getMeetingDayDifference = (
    meetingDate,
    fromDate = new Date(),
    timezone = meetingDetails.timezone,
) => {
    const meeting = getDatePartsInTimezone(meetingDate, timezone)
    const from = getDatePartsInTimezone(fromDate, timezone)
    const meetingDay = Date.UTC(meeting.year, meeting.month - 1, meeting.day)
    const fromDay = Date.UTC(from.year, from.month - 1, from.day)

    return Math.round((meetingDay - fromDay) / 86400000)
}

export const formatMeetingTimeLabel = ({
    dayLabel,
    startHour,
    startMinute,
    endHour,
    endMinute,
} = meetingDetails) => {
    const startPeriod = startHour >= 12 ? "pm" : "am"
    const endPeriod = endHour >= 12 ? "pm" : "am"
    const formatTime = (hour, minute, showPeriod) => {
        const displayHour = hour % 12 || 12
        const displayMinute = String(minute).padStart(2, "0")
        const period = hour >= 12 ? "pm" : "am"

        return `${displayHour}:${displayMinute}${showPeriod ? ` ${period}` : ""}`
    }

    return `${dayLabel} ${formatTime(startHour, startMinute, startPeriod !== endPeriod)} - ${formatTime(endHour, endMinute, true)}`
}

export const createMeetingCalendarHref = (meetingDate, details = meetingDetails) => {
    const date = formatCalendarDate(meetingDate, details.timezone)
    const stamp = formatUtcDateTime(new Date())
    const startTime = formatCalendarTime(details.startHour, details.startMinute)
    const endTime = formatCalendarTime(details.endHour, details.endMinute)
    const calendarLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Scranton Chess Club//Meeting Calendar//EN",
        "CALSCALE:GREGORIAN",
        `X-WR-TIMEZONE:${details.timezone}`,
        "BEGIN:VEVENT",
        `UID:scranton-chess-club-${date}@scrantonchessclub.org`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${details.timezone}:${date}T${startTime}`,
        `DTEND;TZID=${details.timezone}:${date}T${endTime}`,
        "RRULE:FREQ=WEEKLY;BYDAY=TU",
        `SUMMARY:${details.title}`,
        `LOCATION:${details.location}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ]

    return `data:text/calendar;charset=utf8,${encodeURIComponent(calendarLines.join("\r\n"))}`
}
