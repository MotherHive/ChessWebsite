const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

const pad = (part) => String(part).padStart(2, "0")

// Schedule entry details with special meaning to the editor.
const registrationStartDetail = "Registration start"
const registrationEndDetail = "Registration end"

// Older tournaments stored derived start/end rows in the schedule itself.
// Timing is now derived from the schedule, so these are stripped on load.
const legacyTimingDetails = ["Tournament starts", "Tournament ends"]

export const toDateTimeInputValue = (value) => {
  const date = new Date(value)

  if (!value || !Number.isFinite(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const fromDateTimeInputValue = (value) => {
  const date = new Date(value)

  return value && Number.isFinite(date.getTime()) ? date.toISOString() : ""
}

export const formatDateRange = (startsAt, endsAt) => {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  if (!Number.isFinite(start.getTime())) {
    return ""
  }

  if (!Number.isFinite(end.getTime())) {
    return dateFormatter.format(start)
  }

  const sameDay = start.getFullYear() === end.getFullYear()
    && start.getMonth() === end.getMonth()
    && start.getDate() === end.getDate()

  if (sameDay) {
    return dateFormatter.format(start)
  }

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}–${end.getDate()}, ${end.getFullYear()}`
  }

  if (sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${dateFormatter.format(end)}`
  }

  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`
}

export const formatScheduleDate = (value) => {
  const date = new Date(`${value}T12:00:00`)

  return value && Number.isFinite(date.getTime()) ? shortDateFormatter.format(date) : ""
}

export const scheduleDateInputValue = (label, startsAt) => {
  if (!label) {
    return ""
  }

  const year = new Date(startsAt).getFullYear()
  const date = new Date(`${label}, ${Number.isFinite(year) ? year : new Date().getFullYear()}`)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const hydrateScheduleDates = (days, startsAt) => (
  (days || []).map((day) => ({
    ...day,
    dateValue: day.dateValue || scheduleDateInputValue(day.date, startsAt),
    sections: (day.sections || []).map((section) => ({
      ...section,
      times: (section.times || []).filter((time) => (
        !legacyTimingDetails.includes(time.detail)
      )),
    })),
  }))
)

const dateTimeFromScheduleEntry = (dateValue, label) => {
  const time = timeLabelToInputValue(label)
  const date = new Date(`${dateValue}T${time}`)

  return dateValue && time && Number.isFinite(date.getTime()) ? date.toISOString() : ""
}

export const deriveTournamentTiming = (days) => {
  const scheduledDays = (days || [])
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.dateValue || ""))
    .sort((left, right) => left.dateValue.localeCompare(right.dateValue))
  const firstDay = scheduledDays[0]
  const lastDay = scheduledDays[scheduledDays.length - 1]
  // The earliest "Registration end" entry on the first day is when play
  // effectively starts, so it drives the published startsAt timestamp.
  const registrationEndTimes = (firstDay?.sections || [])
    .flatMap((section) => section.times || [])
    .filter((time) => time.detail.trim().toLowerCase() === registrationEndDetail.toLowerCase())
    .map((time) => dateTimeFromScheduleEntry(firstDay.dateValue, time.label))
    .filter(Boolean)
    .sort()
  const startsAt = registrationEndTimes[0]
    || (firstDay ? new Date(`${firstDay.dateValue}T00:00:00`).toISOString() : "")
  const endsAt = lastDay
    ? new Date(`${lastDay.dateValue}T23:59:59.999`).toISOString()
    : ""

  return {
    startsAt,
    endsAt,
    dateRange: formatDateRange(startsAt, endsAt),
  }
}

export const timeLabelToInputValue = (label) => {
  const match = String(label || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)

  if (!match) {
    return ""
  }

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()

  if (minutes > 59 || (meridiem && (hours < 1 || hours > 12)) || (!meridiem && hours > 23)) {
    return ""
  }

  if (meridiem) {
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0)
  }

  return `${pad(hours)}:${pad(minutes)}`
}

export const formatTimeLabel = (value) => {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/)

  if (!match) {
    return ""
  }

  const hours = Number(match[1])
  const minutes = match[2]

  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`
}

export const getNextRoundDetail = (times) => {
  const highestRound = (times || []).reduce((highest, time) => {
    const match = String(time?.detail || "").trim().match(/^Round\s+(\d+)$/i)

    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  return `Round ${highestRound + 1}`
}

const defaultRegistrationTimes = () => ([
  { label: "8:30 AM", detail: registrationStartDetail },
  { label: "9:30 AM", detail: registrationEndDetail },
])

export const createBlankTournament = (recentTournament = {}) => ({
  title: "",
  type: "Tournament",
  rating: recentTournament.rating || "USCF",
  entryFees: [{ section: recentTournament.entryFees?.[0]?.section || "Open", price: 0 }],
  discountEndsAt: "",
  startsAt: "",
  endsAt: "",
  dateRange: "",
  location: recentTournament.location || "",
  address: recentTournament.address || "",
  mapUrl: recentTournament.mapUrl || "",
  imageUrl: "",
  maxByes: recentTournament.maxByes ?? 0,
  director: {
    name: recentTournament.director?.name || "",
    email: recentTournament.director?.email || "",
    phone: recentTournament.director?.phone || "",
    website: "",
  },
  rulesUrl: "",
  flyerUrl: "",
  uscfUrl: "",
  days: [{
    date: "",
    dateValue: "",
    sections: [{
      name: recentTournament.entryFees?.[0]?.section || "Open",
      control: "",
      times: defaultRegistrationTimes(),
    }],
  }],
  prizes: [{
    section: recentTournament.entryFees?.[0]?.section || "Open",
    rows: [{ brackets: ["All players"], prize: "", place: "" }],
  }],
})

export const getSavedLocations = (tournaments) => {
  const locations = new Map()

  ;(tournaments || []).forEach((row) => {
    const data = row?.data || {}
    const name = data.location?.trim()

    if (name && !locations.has(name.toLowerCase())) {
      locations.set(name.toLowerCase(), {
        location: name,
        address: data.address || "",
        mapUrl: data.mapUrl || "",
      })
    }
  })

  return [...locations.values()]
}

export const getSavedDirectors = (tournaments) => {
  const directors = new Map()

  ;(tournaments || []).forEach((row) => {
    const director = row?.data?.director || {}
    const name = director.name?.trim()
    const email = director.email?.trim()

    if (!name && !email) {
      return
    }

    const key = `${name || ""}|${email || ""}`.toLowerCase()

    if (!directors.has(key)) {
      directors.set(key, {
        key,
        name: name || "",
        email: email || "",
        phone: director.phone || "",
        website: director.website || "",
      })
    }
  })

  return [...directors.values()]
}

export const getSavedSectionNames = (tournaments) => (
  [...new Set((tournaments || []).flatMap((row) => (
    (row?.data?.entryFees || []).map((fee) => fee.section?.trim()).filter(Boolean)
  )))].sort((left, right) => left.localeCompare(right))
)

const defaultPrizeGroups = [
  "All players",
  "U2000",
  "U1800",
  "U1600",
  "U1400",
  "U1200",
  "U1000",
  "U800",
  "Unrated",
  "School Team",
  "PA Resident",
]

export const getPrizeGroupPresets = (tournaments) => {
  const savedGroups = (tournaments || []).flatMap((row) => (
    (row?.data?.prizes || []).flatMap((section) => (
      (section.rows || []).flatMap((prizeRow) => prizeRow.brackets || [])
    ))
  )).map((group) => group === "Overall" ? "All players" : group)

  return [...new Set([...defaultPrizeGroups, ...savedGroups].filter(Boolean))]
}

export const syncScheduleSections = (days, entryFees) => {
  const sectionNames = (entryFees || []).map((fee) => fee.section)

  return (days || []).map((day, dayIndex) => ({
    ...day,
    sections: sectionNames.map((name) => {
      const existing = (day.sections || []).find((section) => section.name === name)

      return existing || {
        name,
        control: "",
        times: dayIndex === 0 ? defaultRegistrationTimes() : [],
      }
    }),
  }))
}

export const syncPrizeSections = (prizes, entryFees) => {
  const sectionNames = (entryFees || []).map((fee) => fee.section)

  return sectionNames.map((section) => {
    const existing = (prizes || []).find((prizeSection) => prizeSection.section === section)

    return existing ? {
      ...existing,
      rows: existing.rows.map((row) => ({
        ...row,
        brackets: row.brackets.map((bracket) => bracket === "Overall" ? "All players" : bracket),
      })),
    } : {
      section,
      rows: [{ brackets: ["All players"], prize: "", place: "" }],
    }
  })
}

export const createMapUrl = (address) => (
  address.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : ""
)
