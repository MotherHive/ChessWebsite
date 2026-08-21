import assert from "node:assert/strict"
import test from "node:test"
import {
  createMapUrl,
  createBlankTournament,
  deriveTournamentTiming,
  formatTimeLabel,
  getSavedDirectors,
  getSavedLocations,
  getSavedSectionNames,
  getPrizeGroupPresets,
  getNextRoundDetail,
  syncPrizeSections,
  syncScheduleSections,
  timeLabelToInputValue,
  toDateTimeInputValue,
} from "./tournamentEditorModel.js"

test("new tournaments reuse stable details and include registration schedule defaults", () => {
  const tournament = createBlankTournament({
    rating: "Unrated",
    location: "Club Hall",
    address: "123 Main St",
    mapUrl: "https://example.com/map",
    maxByes: 2,
    director: { name: "Alex", email: "alex@example.com", phone: "555-0100", website: "" },
  })

  assert.equal(tournament.location, "Club Hall")
  assert.equal(tournament.address, "123 Main St")
  assert.equal(tournament.director.name, "Alex")
  assert.deepEqual(tournament.days[0].sections[0].times, [
    { label: "8:30 AM", detail: "Registration start" },
    { label: "9:30 AM", detail: "Registration end" },
  ])
})

test("date-time and schedule time controls translate stored labels", () => {
  const date = new Date(2026, 6, 25, 14, 30).toISOString()

  assert.equal(toDateTimeInputValue(date), "2026-07-25T14:30")
  assert.equal(timeLabelToInputValue("2:30 PM"), "14:30")
  assert.equal(timeLabelToInputValue("10:00"), "10:00")
  assert.equal(formatTimeLabel("08:05"), "8:05 AM")
})

test("new schedule entries continue round numbering without a fixed limit", () => {
  assert.equal(getNextRoundDetail([]), "Round 1")
  assert.equal(getNextRoundDetail([
    { detail: "Registration end" },
    { detail: "Round 2" },
    { detail: "round 5" },
  ]), "Round 6")
  assert.equal(getNextRoundDetail([{ detail: "Round 12" }]), "Round 13")
})

test("saved locations are unique and retain their address details", () => {
  const locations = getSavedLocations([
    { data: { location: "Club Hall", address: "New address", mapUrl: "https://example.com/new" } },
    { data: { location: "club hall", address: "Old address" } },
    { data: { location: "Library", address: "10 State St" } },
  ])

  assert.deepEqual(locations, [
    { location: "Club Hall", address: "New address", mapUrl: "https://example.com/new" },
    { location: "Library", address: "10 State St", mapUrl: "" },
  ])
})

test("deleted presets are left out of the venue and director pickers", () => {
  const tournaments = [
    { data: { location: "Club Hall", address: "1 Main St" } },
    { data: { location: "Library", address: "10 State St" } },
    { data: { director: { name: "Alex Smith", email: "alex@example.com" } } },
    { data: { director: { name: "Robin Lee", email: "robin@example.com" } } },
  ]

  assert.deepEqual(
    getSavedLocations(tournaments, ["club hall"]).map((option) => option.location),
    ["Library"],
  )
  assert.deepEqual(
    getSavedDirectors(tournaments, ["alex smith|alex@example.com"]).map((option) => option.name),
    ["Robin Lee"],
  )
  assert.equal(getSavedLocations(tournaments).length, 2)
})

test("map links are generated from the venue address", () => {
  assert.equal(
    createMapUrl("1300 University Ave., Scranton, PA 18509"),
    "https://www.google.com/maps/search/?api=1&query=1300%20University%20Ave.%2C%20Scranton%2C%20PA%2018509",
  )
  assert.equal(createMapUrl("  "), "")
})

test("saved directors are unique and retain their contact details", () => {
  const directors = getSavedDirectors([
    { data: { director: { name: "Alex Smith", email: "alex@example.com", phone: "555-0100" } } },
    { data: { director: { name: "Alex Smith", email: "alex@example.com", phone: "old" } } },
    { data: { director: { name: "Robin Lee", email: "robin@example.com", phone: "" } } },
  ])

  assert.equal(directors.length, 2)
  assert.equal(directors[0].phone, "555-0100")
  assert.equal(directors[1].name, "Robin Lee")
})

test("section presets are unique and populate schedule and prize tables", () => {
  const sectionNames = getSavedSectionNames([
    { data: { entryFees: [{ section: "Open" }, { section: "Scholastic" }] } },
    { data: { entryFees: [{ section: "Open" }] } },
  ])
  const entryFees = sectionNames.map((section) => ({ section, price: 0 }))
  const days = syncScheduleSections([{
    date: "",
    dateValue: "",
    sections: [{ name: "Open", control: "G/60", times: [] }],
  }], entryFees)
  const prizes = syncPrizeSections([], entryFees)

  assert.deepEqual(sectionNames, ["Open", "Scholastic"])
  assert.deepEqual(days[0].sections.map((section) => section.name), sectionNames)
  assert.equal(days[0].sections[0].control, "G/60")
  assert.deepEqual(prizes.map((section) => section.section), sectionNames)
  assert.equal(prizes[0].rows[0].brackets[0], "All players")
})

test("prize group presets include common and previously saved groups", () => {
  const groups = getPrizeGroupPresets([{
    data: {
      prizes: [{ rows: [{ brackets: ["Overall", "Girls U12"] }] }],
    },
  }])

  assert.ok(groups.includes("All players"))
  assert.ok(groups.includes("U1800"))
  assert.ok(groups.includes("Girls U12"))
  assert.equal(groups.includes("Overall"), false)
})

test("stored tournament timing is derived from registration end and schedule days", () => {
  const timing = deriveTournamentTiming([
    {
      date: "Sat, Oct 10",
      dateValue: "2026-10-10",
      sections: [{
        name: "Open",
        control: "",
        times: [
          { label: "8:30 AM", detail: "Registration start" },
          { label: "9:30 AM", detail: "Registration end" },
        ],
      }],
    },
    {
      date: "Sun, Oct 11",
      dateValue: "2026-10-11",
      sections: [{ name: "Open", control: "", times: [] }],
    },
  ])

  assert.equal(timing.startsAt, new Date("2026-10-10T09:30").toISOString())
  assert.equal(timing.endsAt, new Date("2026-10-11T23:59:59.999").toISOString())
  assert.equal(timing.dateRange, "October 10–11, 2026")
})
