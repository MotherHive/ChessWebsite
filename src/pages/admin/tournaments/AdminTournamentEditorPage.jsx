"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { adminRequest } from "../../../lib/adminApi"

const blankTournament = () => ({
  title: "",
  type: "",
  rating: "USCF",
  entryFees: [{ section: "Championship", price: 0 }],
  earlyEntryDeadlineLabel: "",
  discountEndsAt: "",
  startsAt: "",
  endsAt: "",
  dateRange: "",
  location: "",
  address: "",
  mapUrl: "",
  imageUrl: "",
  maxByes: 0,
  director: { name: "", email: "", phone: "", website: "" },
  rulesUrl: "",
  flyerUrl: "",
  uscfUrl: "",
  days: [],
  prizes: [],
})

const toNumber = (value) => (value === "" ? undefined : Number(value))

const updateAt = (list, index, patch) => (
  list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
)

const removeAt = (list, index) => list.filter((_, itemIndex) => itemIndex !== index)

export default function AdminTournamentEditorPage() {
  const { tournamentId } = useParams()

  return <TournamentEditor key={tournamentId || "new"} tournamentId={tournamentId} />
}

function TournamentEditor({ tournamentId }) {
  const router = useRouter()
  const isNew = !tournamentId
  const [form, setForm] = useState(blankTournament)
  const [status, setStatus] = useState(isNew ? "ready" : "loading")
  const [saveState, setSaveState] = useState("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isNew) {
      return undefined
    }

    let isActive = true

    adminRequest("tournaments")
      .then((result) => {
        if (!isActive) {
          return
        }

        const tournament = (result.tournaments || []).find((row) => row.id === tournamentId)

        if (!tournament) {
          setStatus("missing")
          return
        }

        setForm({ ...blankTournament(), ...tournament.data })
        setStatus("ready")
      })
      .catch((error) => {
        if (isActive) {
          setStatus("error")
          setMessage(error.message)
        }
      })

    return () => {
      isActive = false
    }
  }, [isNew, tournamentId])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setDirectorField = (field, value) => {
    setForm((current) => ({
      ...current,
      director: { ...current.director, [field]: value },
    }))
  }

  const setDays = (updater) => {
    setForm((current) => ({ ...current, days: updater(current.days || []) }))
  }

  const setPrizes = (updater) => {
    setForm((current) => ({ ...current, prizes: updater(current.prizes || []) }))
  }

  const handleSave = async (nextStatus) => {
    if (!form.title.trim()) {
      setSaveState("error")
      setMessage("Enter a tournament title before saving.")
      return
    }

    setSaveState("saving")
    setMessage("")

    try {
      const result = await adminRequest("tournaments", {
        method: "POST",
        body: {
          id: isNew ? undefined : tournamentId,
          status: nextStatus,
          data: form,
        },
      })

      setSaveState("saved")
      setMessage(nextStatus === "published" ? "Saved and published." : "Saved.")

      if (isNew) {
        router.replace(`/admin/tournaments/${result.tournament.id}`)
      }
    } catch (error) {
      setSaveState("error")
      setMessage(error.message)
    }
  }

  if (status === "loading") {
    return <section className="admin-section"><p className="admin-muted">Loading tournament...</p></section>
  }

  if (status === "missing") {
    return (
      <section className="admin-section">
        <p className="admin-error">Tournament not found.</p>
        <Link href="/admin/tournaments">Back to tournaments</Link>
      </section>
    )
  }

  return (
    <section className="admin-section" aria-label="Tournament editor">
      <div className="admin-section-header">
        <h2>{isNew ? "New tournament" : form.title || tournamentId}</h2>
        <div className="admin-row-actions">
          {!isNew && <Link href={`/admin/tournaments/${tournamentId}/preview`}>Preview</Link>}
          <Link href="/admin/tournaments">Back to list</Link>
        </div>
      </div>

      <form
        className="admin-editor"
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <fieldset className="admin-fieldset">
          <legend>Basics</legend>
          <div className="admin-grid">
            <label>
              Title
              <input onChange={(event) => setField("title", event.target.value)} required value={form.title} />
            </label>
            <label>
              Event type
              <input
                onChange={(event) => setField("type", event.target.value)}
                placeholder="State Championship Event"
                value={form.type}
              />
            </label>
            <label>
              Rating
              <select onChange={(event) => setField("rating", event.target.value)} value={form.rating}>
                <option value="USCF">USCF</option>
                <option value="Unrated">Unrated</option>
              </select>
            </label>
            <label>
              Max byes per player
              <input
                min="0"
                onChange={(event) => setField("maxByes", toNumber(event.target.value) ?? 0)}
                type="number"
                value={form.maxByes ?? ""}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Dates & deadlines</legend>
          <div className="admin-grid">
            <label>
              Date range label
              <input
                onChange={(event) => setField("dateRange", event.target.value)}
                placeholder="May 30-31, 2026"
                value={form.dateRange}
              />
            </label>
            <label>
              Starts at (ISO)
              <input
                onChange={(event) => setField("startsAt", event.target.value)}
                placeholder="2026-05-30T08:30:00-04:00"
                value={form.startsAt}
              />
            </label>
            <label>
              Ends at (ISO)
              <input
                onChange={(event) => setField("endsAt", event.target.value)}
                placeholder="2026-05-31T17:00:00-04:00"
                value={form.endsAt}
              />
            </label>
            <label>
              Early entry deadline label
              <input
                onChange={(event) => setField("earlyEntryDeadlineLabel", event.target.value)}
                placeholder="May 25"
                value={form.earlyEntryDeadlineLabel}
              />
            </label>
            <label>
              Early discount ends at (ISO)
              <input
                onChange={(event) => setField("discountEndsAt", event.target.value)}
                placeholder="2026-05-25T23:59:59-04:00"
                value={form.discountEndsAt}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Location</legend>
          <div className="admin-grid">
            <label>
              Venue
              <input onChange={(event) => setField("location", event.target.value)} value={form.location} />
            </label>
            <label>
              Address
              <input onChange={(event) => setField("address", event.target.value)} value={form.address} />
            </label>
            <label>
              Map URL
              <input onChange={(event) => setField("mapUrl", event.target.value)} value={form.mapUrl} />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Links & image</legend>
          <div className="admin-grid">
            <label>
              Rules URL
              <input onChange={(event) => setField("rulesUrl", event.target.value)} value={form.rulesUrl} />
            </label>
            <label>
              Flyer URL
              <input onChange={(event) => setField("flyerUrl", event.target.value)} value={form.flyerUrl} />
            </label>
            <label>
              USCF listing URL
              <input onChange={(event) => setField("uscfUrl", event.target.value)} value={form.uscfUrl} />
            </label>
            <label>
              Image URL
              <input
                onChange={(event) => setField("imageUrl", event.target.value)}
                placeholder="https://... (leave blank for default artwork)"
                value={form.imageUrl}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Tournament director</legend>
          <div className="admin-grid">
            <label>
              Name
              <input onChange={(event) => setDirectorField("name", event.target.value)} value={form.director?.name || ""} />
            </label>
            <label>
              Email
              <input onChange={(event) => setDirectorField("email", event.target.value)} value={form.director?.email || ""} />
            </label>
            <label>
              Phone
              <input onChange={(event) => setDirectorField("phone", event.target.value)} value={form.director?.phone || ""} />
            </label>
            <label>
              Website
              <input onChange={(event) => setDirectorField("website", event.target.value)} value={form.director?.website || ""} />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Sections & entry fees</legend>
          {(form.entryFees || []).map((fee, feeIndex) => (
            <div className="admin-repeater-row" key={feeIndex}>
              <label>
                Section
                <input
                  onChange={(event) => setField("entryFees", updateAt(form.entryFees, feeIndex, { section: event.target.value }))}
                  value={fee.section}
                />
              </label>
              <label>
                Price ($)
                <input
                  min="0"
                  onChange={(event) => setField("entryFees", updateAt(form.entryFees, feeIndex, { price: toNumber(event.target.value) ?? 0 }))}
                  type="number"
                  value={fee.price ?? ""}
                />
              </label>
              <label>
                Early price ($)
                <input
                  min="0"
                  onChange={(event) => setField("entryFees", updateAt(form.entryFees, feeIndex, { earlyPrice: toNumber(event.target.value) }))}
                  placeholder="Optional"
                  type="number"
                  value={fee.earlyPrice ?? ""}
                />
              </label>
              <button
                className="admin-danger"
                onClick={() => setField("entryFees", removeAt(form.entryFees, feeIndex))}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="admin-add-button"
            onClick={() => setField("entryFees", [...(form.entryFees || []), { section: "", price: 0 }])}
            type="button"
          >
            + Add section
          </button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Schedule (days, sections, rounds)</legend>
          {(form.days || []).map((day, dayIndex) => (
            <div className="admin-nested-card" key={dayIndex}>
              <div className="admin-repeater-row">
                <label>
                  Day label
                  <input
                    onChange={(event) => setDays((days) => updateAt(days, dayIndex, { date: event.target.value }))}
                    placeholder="Sat, May 30"
                    value={day.date}
                  />
                </label>
                <button
                  className="admin-danger"
                  onClick={() => setDays((days) => removeAt(days, dayIndex))}
                  type="button"
                >
                  Remove day
                </button>
              </div>
              {(day.sections || []).map((section, sectionIndex) => (
                <div className="admin-nested-card" key={sectionIndex}>
                  <div className="admin-repeater-row">
                    <label>
                      Section
                      <input
                        onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                          sections: updateAt(day.sections, sectionIndex, { name: event.target.value }),
                        }))}
                        value={section.name}
                      />
                    </label>
                    <label>
                      Time control
                      <input
                        onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                          sections: updateAt(day.sections, sectionIndex, { control: event.target.value }),
                        }))}
                        placeholder="G/75 d5"
                        value={section.control}
                      />
                    </label>
                    <button
                      className="admin-danger"
                      onClick={() => setDays((days) => updateAt(days, dayIndex, {
                        sections: removeAt(day.sections, sectionIndex),
                      }))}
                      type="button"
                    >
                      Remove section
                    </button>
                  </div>
                  {(section.times || []).map((time, timeIndex) => (
                    <div className="admin-repeater-row" key={timeIndex}>
                      <label>
                        Time
                        <input
                          onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                            sections: updateAt(day.sections, sectionIndex, {
                              times: updateAt(section.times, timeIndex, { label: event.target.value }),
                            }),
                          }))}
                          placeholder="10:00"
                          value={time.label}
                        />
                      </label>
                      <label>
                        Detail
                        <input
                          onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                            sections: updateAt(day.sections, sectionIndex, {
                              times: updateAt(section.times, timeIndex, { detail: event.target.value }),
                            }),
                          }))}
                          placeholder="Round 1"
                          value={time.detail}
                        />
                      </label>
                      <button
                        className="admin-danger"
                        onClick={() => setDays((days) => updateAt(days, dayIndex, {
                          sections: updateAt(day.sections, sectionIndex, {
                            times: removeAt(section.times, timeIndex),
                          }),
                        }))}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="admin-add-button"
                    onClick={() => setDays((days) => updateAt(days, dayIndex, {
                      sections: updateAt(day.sections, sectionIndex, {
                        times: [...(section.times || []), { label: "", detail: "" }],
                      }),
                    }))}
                    type="button"
                  >
                    + Add time
                  </button>
                </div>
              ))}
              <button
                className="admin-add-button"
                onClick={() => setDays((days) => updateAt(days, dayIndex, {
                  sections: [...(day.sections || []), { name: "", control: "", times: [] }],
                }))}
                type="button"
              >
                + Add section to day
              </button>
            </div>
          ))}
          <button
            className="admin-add-button"
            onClick={() => setDays((days) => [...days, { date: "", sections: [] }])}
            type="button"
          >
            + Add day
          </button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Prizes</legend>
          {(form.prizes || []).map((prizeSection, prizeSectionIndex) => (
            <div className="admin-nested-card" key={prizeSectionIndex}>
              <div className="admin-repeater-row">
                <label>
                  Section
                  <input
                    onChange={(event) => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, { section: event.target.value }))}
                    value={prizeSection.section}
                  />
                </label>
                <button
                  className="admin-danger"
                  onClick={() => setPrizes((prizes) => removeAt(prizes, prizeSectionIndex))}
                  type="button"
                >
                  Remove prize section
                </button>
              </div>
              {(prizeSection.rows || []).map((row, rowIndex) => (
                <div className="admin-repeater-row" key={rowIndex}>
                  <label>
                    Brackets (comma-separated)
                    <input
                      onChange={(event) => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                        rows: updateAt(prizeSection.rows, rowIndex, {
                          brackets: event.target.value.split(",").map((bracket) => bracket.trim()),
                        }),
                      }))}
                      placeholder="U1800, U1600"
                      value={(row.brackets || []).join(", ")}
                    />
                  </label>
                  <label>
                    Prize
                    <input
                      onChange={(event) => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                        rows: updateAt(prizeSection.rows, rowIndex, { prize: event.target.value }),
                      }))}
                      placeholder="Trophy"
                      value={row.prize}
                    />
                  </label>
                  <label>
                    Place
                    <input
                      onChange={(event) => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                        rows: updateAt(prizeSection.rows, rowIndex, { place: event.target.value }),
                      }))}
                      placeholder="1st-3rd"
                      value={row.place}
                    />
                  </label>
                  <button
                    className="admin-danger"
                    onClick={() => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                      rows: removeAt(prizeSection.rows, rowIndex),
                    }))}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="admin-add-button"
                onClick={() => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                  rows: [...(prizeSection.rows || []), { brackets: ["Overall"], prize: "", place: "" }],
                }))}
                type="button"
              >
                + Add prize row
              </button>
            </div>
          ))}
          <button
            className="admin-add-button"
            onClick={() => setPrizes((prizes) => [...prizes, { section: "", rows: [] }])}
            type="button"
          >
            + Add prize section
          </button>
        </fieldset>

        {message && (
          <p className={saveState === "error" ? "admin-error" : "admin-success"} role="status">
            {message}
          </p>
        )}

        <div className="admin-editor-actions">
          <button className="button" disabled={saveState === "saving"} type="submit">
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
          <button
            className="button"
            disabled={saveState === "saving"}
            onClick={() => handleSave("published")}
            type="button"
          >
            Save & publish
          </button>
        </div>
      </form>
    </section>
  )
}
