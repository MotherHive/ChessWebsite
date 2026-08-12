import { z } from "zod"

const shortText = z.string().max(200)
const longText = z.string().max(500)
const money = z.number().finite().nonnegative().max(100000)
// Zod's URL check accepts any parsable scheme, including `javascript:` and
// `data:`. These values are rendered into anchor hrefs, so the scheme is pinned.
const isHttpUrl = (value) => {
  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

const blankOrUrl = z.union([
  z.literal(""),
  z.string().url().refine(isHttpUrl, "Use an http:// or https:// address."),
])
const blankOrEmail = z.union([z.literal(""), z.string().email()])
const blankOrDateTime = z.string().refine(
  (value) => !value || Number.isFinite(new Date(value).getTime()),
  "Use a valid date and time.",
)
const blankOrDate = z.string().refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Use a valid date.",
)

const entryFeeSchema = z.object({
  section: shortText,
  price: money,
  earlyPrice: money.optional(),
}).strict()

const directorSchema = z.object({
  name: shortText,
  email: blankOrEmail,
  phone: shortText,
  website: blankOrUrl,
}).strict()

const scheduleTimeSchema = z.object({
  label: shortText,
  detail: shortText,
}).strict()

const scheduleSectionSchema = z.object({
  name: shortText,
  control: shortText,
  times: z.array(scheduleTimeSchema).max(30),
}).strict()

const scheduleDaySchema = z.object({
  date: shortText,
  dateValue: blankOrDate.optional(),
  sections: z.array(scheduleSectionSchema).max(20),
}).strict()

const prizeRowSchema = z.object({
  brackets: z.array(shortText).max(30),
  prize: shortText,
  place: shortText,
}).strict()

const prizeSectionSchema = z.object({
  section: shortText,
  rows: z.array(prizeRowSchema).max(50),
}).strict()

export const tournamentDraftSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL-safe tournament id.").optional(),
  title: z.string().trim().min(1, "Enter a tournament title.").max(200),
  type: shortText.default(""),
  rating: shortText.default(""),
  entryFees: z.array(entryFeeSchema).max(30).default([]),
  discountEndsAt: blankOrDateTime.default(""),
  startsAt: blankOrDateTime.default(""),
  endsAt: blankOrDateTime.default(""),
  dateRange: shortText.default(""),
  location: longText.default(""),
  address: longText.default(""),
  mapUrl: blankOrUrl.default(""),
  imageUrl: blankOrUrl.default(""),
  maxByes: z.number().int().nonnegative().max(20).default(0),
  director: directorSchema.optional(),
  rulesUrl: blankOrUrl.default(""),
  flyerUrl: blankOrUrl.default(""),
  uscfUrl: blankOrUrl.default(""),
  days: z.array(scheduleDaySchema).max(14).default([]),
  prizes: z.array(prizeSectionSchema).max(30).default([]),
}).strict()

const addRequiredTextIssue = (data, context, field, label) => {
  if (!data[field]?.trim()) {
    context.addIssue({
      code: "custom",
      message: `${label} is required before publishing.`,
      path: [field],
    })
  }
}

export const publishedTournamentSchema = tournamentDraftSchema.superRefine((data, context) => {
  addRequiredTextIssue(data, context, "type", "Event type")
  addRequiredTextIssue(data, context, "rating", "Rating")
  addRequiredTextIssue(data, context, "startsAt", "First schedule day date")
  addRequiredTextIssue(data, context, "endsAt", "Last schedule day date")
  addRequiredTextIssue(data, context, "dateRange", "Schedule date range")
  addRequiredTextIssue(data, context, "location", "Location")
  addRequiredTextIssue(data, context, "address", "Address")

  if (!data.entryFees.length) {
    context.addIssue({
      code: "custom",
      message: "Add at least one entry fee before publishing.",
      path: ["entryFees"],
    })
  }

  const sectionNames = new Set()

  data.entryFees.forEach((fee, index) => {
    const section = fee.section.trim().toLowerCase()

    if (!section) {
      context.addIssue({
        code: "custom",
        message: "Each entry fee needs a section name.",
        path: ["entryFees", index, "section"],
      })
    } else if (sectionNames.has(section)) {
      context.addIssue({
        code: "custom",
        message: "Entry fee section names must be unique.",
        path: ["entryFees", index, "section"],
      })
    }

    sectionNames.add(section)

    if (fee.earlyPrice !== undefined && !data.discountEndsAt) {
      context.addIssue({
        code: "custom",
        message: "Set an early discount deadline when an early price is provided.",
        path: ["discountEndsAt"],
      })
    }
  })

  const startsAt = new Date(data.startsAt).getTime()
  const endsAt = new Date(data.endsAt).getTime()

  if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt) {
    context.addIssue({
      code: "custom",
      message: "The tournament end must be after its start.",
      path: ["endsAt"],
    })
  }

  data.days.forEach((day, dayIndex) => {
    if (!day.date.trim()) {
      context.addIssue({ code: "custom", message: "Each schedule day needs a label.", path: ["days", dayIndex, "date"] })
    }

    day.sections.forEach((section, sectionIndex) => {
      if (!section.name.trim()) {
        context.addIssue({
          code: "custom",
          message: "Each scheduled section needs a name.",
          path: ["days", dayIndex, "sections", sectionIndex, "name"],
        })
      }

      section.times.forEach((time, timeIndex) => {
        if (!time.label.trim() || !time.detail.trim()) {
          context.addIssue({
            code: "custom",
            message: "Each schedule entry needs a time and detail.",
            path: ["days", dayIndex, "sections", sectionIndex, "times", timeIndex],
          })
        }
      })
    })
  })
})

export const formatTournamentSchemaError = (error) => (
  error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`)
    .join(" ")
)

export const parsePublishedTournamentRow = (row) => (
  publishedTournamentSchema.safeParse({ ...row?.data, id: row?.id })
)
