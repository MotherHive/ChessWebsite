import assert from "node:assert/strict"
import test from "node:test"
import {
  createMeetingCalendarHref,
  getMeetingDayDifference,
  getNextTuesday,
} from "./meetingCalendar.js"

test("builds deterministic calendar links from an explicit render timestamp", () => {
  const renderedAt = new Date("2026-07-20T15:00:00.000Z")
  const meetingDate = getNextTuesday(renderedAt)
  const firstHref = createMeetingCalendarHref(meetingDate, renderedAt)
  const secondHref = createMeetingCalendarHref(meetingDate, renderedAt)
  const calendar = decodeURIComponent(firstHref.split(",")[1])

  assert.equal(firstHref, secondHref)
  assert.match(calendar, /DTSTAMP:20260720T150000Z/)
  assert.match(calendar, /DTSTART;TZID=America\/New_York:20260721T183000/)
})

test("calculates meeting dates relative to the same explicit snapshot", () => {
  const monday = new Date("2026-07-20T15:00:00.000Z")
  const tuesday = getNextTuesday(monday)

  assert.equal(getMeetingDayDifference(tuesday, monday), 1)
  assert.equal(getMeetingDayDifference(tuesday, tuesday), 0)
})
