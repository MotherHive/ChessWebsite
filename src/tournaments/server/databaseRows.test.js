import assert from "node:assert/strict"
import test from "node:test"
import {
  fromRegistrationRow,
  fromTournamentRow,
  toRegistrationRow,
} from "./databaseRows.js"

test("D1 tournament rows deserialize JSON data", () => {
  assert.deepEqual(
    fromTournamentRow({ id: "open", data: '{"title":"Club Open"}' }),
    { id: "open", data: { title: "Club Open" } },
  )
})

test("D1 registration rows convert JSON and SQLite booleans", () => {
  assert.deepEqual(
    fromRegistrationRow({
      byes: '[{"round":"2"}]',
      entered_with_team: 1,
      line_items: "[]",
      needs_membership: 0,
    }),
    {
      byes: [{ round: "2" }],
      entered_with_team: true,
      line_items: [],
      needs_membership: false,
    },
  )
})

test("D1 registration writes serialize JSON and booleans", () => {
  assert.deepEqual(
    toRegistrationRow({
      byes: [],
      entered_with_team: true,
      is_expired_member: false,
      line_items: [{ key: "entry" }],
      needs_membership: true,
    }),
    {
      byes: "[]",
      entered_with_team: 1,
      is_expired_member: 0,
    is_student: 0,
      line_items: '[{"key":"entry"}]',
      needs_membership: 1,
    },
  )
})
