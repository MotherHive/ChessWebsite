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

const formatCalendarDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}${month}${day}`
}

const formatUtcDateTime = (date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

const formatCalendarTime = (hour, minute) => {
    return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`
}

export const getNextTuesday = (fromDate = new Date()) => {
    const daysUntilTuesday = (2 - fromDate.getDay() + 7) % 7
    const nextTuesday = new Date(fromDate)

    nextTuesday.setDate(fromDate.getDate() + daysUntilTuesday)
    nextTuesday.setHours(0, 0, 0, 0)

    return nextTuesday
}

export const formatMeetingDateLabel = (date) => {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
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
    const date = formatCalendarDate(meetingDate)
    const stamp = formatUtcDateTime(new Date())
    const startTime = formatCalendarTime(details.startHour, details.startMinute)
    const endTime = formatCalendarTime(details.endHour, details.endMinute)
    const calendarLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Scranton Chess Club//Meeting Calendar//EN",
        "CALSCALE:GREGORIAN",
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
