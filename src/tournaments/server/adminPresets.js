import { allRows, runStatement } from "@/shared/server/database"
import { jsonResponse } from "@/shared/server/http"

const presetTypes = ["location", "director"]

// Venue names are matched case-insensitively, and a director's key is already
// the lowercased "name|email" pair the editor builds.
export const toPresetKey = (value) => String(value ?? "").trim().toLowerCase()

const emptyHiddenPresets = () => Object.fromEntries(presetTypes.map((type) => [type, []]))

export const readHiddenPresets = async (db) => {
  const rows = await allRows(db.prepare(`
    SELECT preset_type, preset_key
    FROM hidden_presets
  `))

  return rows.reduce((hidden, row) => {
    if (hidden[row.preset_type]) {
      hidden[row.preset_type].push(row.preset_key)
    }

    return hidden
  }, emptyHiddenPresets())
}

export const listHiddenPresets = async (db) => {
  try {
    return jsonResponse(200, { hiddenPresets: await readHiddenPresets(db) })
  } catch {
    return jsonResponse(500, { error: "Could not load the hidden presets." })
  }
}

const parsePresetBody = (body) => {
  const type = String(body?.type ?? "")
  const key = toPresetKey(body?.key)

  return presetTypes.includes(type) && key ? { type, key } : null
}

export const hidePreset = async (db, body) => {
  const preset = parsePresetBody(body)

  if (!preset) {
    return jsonResponse(400, { error: "Provide a valid preset type and key." })
  }

  try {
    await runStatement(db.prepare(`
      INSERT INTO hidden_presets (preset_type, preset_key, hidden_at)
      VALUES (?, ?, ?)
      ON CONFLICT(preset_type, preset_key) DO NOTHING
    `).bind(preset.type, preset.key, new Date().toISOString()))

    return jsonResponse(200, { hiddenPresets: await readHiddenPresets(db) })
  } catch {
    return jsonResponse(500, { error: "Could not delete the preset." })
  }
}

export const restorePreset = async (db, body) => {
  const preset = parsePresetBody(body)

  if (!preset) {
    return jsonResponse(400, { error: "Provide a valid preset type and key." })
  }

  try {
    await clearHiddenPresets(db, [preset])

    return jsonResponse(200, { hiddenPresets: await readHiddenPresets(db) })
  } catch {
    return jsonResponse(500, { error: "Could not restore the preset." })
  }
}

// Reusing a venue or director on a saved tournament means it is wanted again,
// so its deletion is undone rather than silently swallowing the new entry.
export const clearHiddenPresets = async (db, presets) => {
  const wanted = (presets || []).filter((preset) => preset?.type && preset?.key)

  if (!wanted.length) {
    return
  }

  await db.batch(wanted.map((preset) => db.prepare(`
    DELETE FROM hidden_presets
    WHERE preset_type = ? AND preset_key = ?
  `).bind(preset.type, preset.key)))
}
