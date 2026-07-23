"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { adminRequest } from "../../../lib/adminApi"
import TournamentImageDropzone from "./TournamentImageDropzone"
import {
  createMapUrl,
  createBlankTournament,
  deriveTournamentTiming,
  formatScheduleDate,
  formatTimeLabel,
  fromDateTimeInputValue,
  getSavedDirectors,
  getSavedLocations,
  getSavedSectionNames,
  getPrizeGroupPresets,
  getNextRoundDetail,
  hydrateScheduleDates,
  scheduleDateInputValue,
  syncPrizeSections,
  syncScheduleSections,
  timeLabelToInputValue,
  toDateTimeInputValue,
} from "./tournamentEditorModel"

const toNumber = (value) => (value === "" ? undefined : Number(value))

const updateAt = (list, index, patch) => (
  list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
)

const removeAt = (list, index) => list.filter((_, itemIndex) => itemIndex !== index)

function PrizeEligibilityPicker({ groups, label, onChange, selectedGroups }) {
  const availableGroups = groups.filter((group) => !selectedGroups.includes(group))

  return (
    <div className="admin-prize-eligibility">
      <span>Eligible players</span>
      <div className="admin-eligibility-list" aria-label={`Eligible player groups for ${label}`}>
        {selectedGroups.map((group) => (
          <span className="admin-eligibility-item" key={group}>
            {group}
            <button
              aria-label={`Remove ${group}`}
              onClick={() => onChange(selectedGroups.filter((selected) => selected !== group))}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
        <select
          className="admin-eligibility-add"
          aria-label={`Add an eligible player group for ${label}`}
          disabled={!availableGroups.length}
          onChange={(event) => {
            if (event.target.value) {
              onChange([...selectedGroups, event.target.value])
            }
          }}
          value=""
        >
          <option value="">+</option>
          {availableGroups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function AdminTournamentEditorPage() {
  const { tournamentId } = useParams()

  return <TournamentEditor key={tournamentId || "new"} tournamentId={tournamentId} />
}

function TournamentEditor({ tournamentId }) {
  const router = useRouter()
  const isNew = !tournamentId
  const [form, setForm] = useState(createBlankTournament)
  const [status, setStatus] = useState("loading")
  const [saveState, setSaveState] = useState("idle")
  const [message, setMessage] = useState("")
  const [savedLocations, setSavedLocations] = useState([])
  const [savedDirectors, setSavedDirectors] = useState([])
  const [savedSectionNames, setSavedSectionNames] = useState([])
  const [prizeGroupPresets, setPrizeGroupPresets] = useState([])
  const [venueChoice, setVenueChoice] = useState("")
  const [directorChoice, setDirectorChoice] = useState("")

  useEffect(() => {
    let isActive = true

    adminRequest("tournaments")
      .then((result) => {
        if (!isActive) {
          return
        }

        const tournaments = result.tournaments || []
        const tournament = tournaments.find((row) => row.id === tournamentId)
        const locations = getSavedLocations(tournaments)
        const directors = getSavedDirectors(tournaments)
        const sectionNames = getSavedSectionNames(tournaments)
        const prizeGroups = getPrizeGroupPresets(tournaments)

        setSavedLocations(locations)
        setSavedDirectors(directors)
        setSavedSectionNames(sectionNames)
        setPrizeGroupPresets(prizeGroups)

        if (isNew) {
          const nextForm = createBlankTournament(tournaments[0]?.data)
          setForm(nextForm)
          setVenueChoice(locations.some((location) => location.location === nextForm.location)
            ? nextForm.location
            : "__new__")
          setDirectorChoice(directors.find((director) => (
            director.name === nextForm.director.name && director.email === nextForm.director.email
          ))?.key || "__new__")
          setStatus("ready")
          return
        }

        if (!tournament) {
          setStatus("missing")
          return
        }

        const nextForm = { ...createBlankTournament(), ...tournament.data }
        const days = syncScheduleSections(
          hydrateScheduleDates(nextForm.days, nextForm.startsAt),
          nextForm.entryFees,
        )
        const hydratedForm = {
          ...nextForm,
          ...deriveTournamentTiming(days),
          days,
          prizes: syncPrizeSections(nextForm.prizes, nextForm.entryFees),
        }

        setForm(hydratedForm)
        setVenueChoice(locations.some((location) => location.location === hydratedForm.location)
          ? hydratedForm.location
          : "__new__")
        setDirectorChoice(directors.find((director) => (
          director.name === hydratedForm.director?.name
            && director.email === hydratedForm.director?.email
        ))?.key || "__new__")
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

  const setEntryFees = (updater) => {
    setForm((current) => {
      const entryFees = updater(current.entryFees || [])

      return {
        ...current,
        entryFees,
        days: syncScheduleSections(current.days, entryFees),
        prizes: syncPrizeSections(current.prizes, entryFees),
      }
    })
  }

  const setEntryFeeSection = (feeIndex, section) => {
    setForm((current) => {
      const oldSection = current.entryFees[feeIndex]?.section
      const entryFees = updateAt(current.entryFees, feeIndex, { section })
      const renamedDays = (current.days || []).map((day) => ({
        ...day,
        sections: (day.sections || []).map((scheduleSection) => (
          scheduleSection.name === oldSection
            ? { ...scheduleSection, name: section }
            : scheduleSection
        )),
      }))
      const renamedPrizes = (current.prizes || []).map((prizeSection) => (
        prizeSection.section === oldSection
          ? { ...prizeSection, section }
          : prizeSection
      ))

      return {
        ...current,
        entryFees,
        days: syncScheduleSections(renamedDays, entryFees),
        prizes: syncPrizeSections(renamedPrizes, entryFees),
      }
    })
  }

  const setDiscountDeadline = (value) => {
    const discountEndsAt = fromDateTimeInputValue(value)

    setForm((current) => ({
      ...current,
      discountEndsAt,
    }))
  }

  const chooseLocation = (choice) => {
    setVenueChoice(choice)
    const savedLocation = savedLocations.find((option) => option.location === choice)

    setForm((current) => savedLocation ? {
      ...current,
      ...savedLocation,
    } : {
      ...current,
      location: "",
      address: "",
      mapUrl: "",
    })
  }

  const setAddress = (address) => {
    setForm((current) => ({
      ...current,
      address,
      mapUrl: createMapUrl(address),
    }))
  }

  const chooseDirector = (choice) => {
    setDirectorChoice(choice)
    const director = savedDirectors.find((option) => option.key === choice)

    setForm((current) => ({
      ...current,
      director: director ? {
        name: director.name,
        email: director.email,
        phone: director.phone,
        website: director.website,
      } : { name: "", email: "", phone: "", website: "" },
    }))
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
      const timing = deriveTournamentTiming(form.days)
      const tournamentData = {
        ...form,
        ...timing,
      }
      const result = await adminRequest("tournaments", {
        method: "POST",
        body: {
          id: isNew ? undefined : tournamentId,
          status: nextStatus,
          data: tournamentData,
        },
      })

      setForm(tournamentData)
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
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Entry settings</legend>
          <p className="admin-field-help">
            Set the optional early-entry cutoff and how many byes each player may request.
          </p>
          <div className="admin-grid">
            <label>
              Early discount ends
              <input
                onChange={(event) => setDiscountDeadline(event.target.value)}
                type="datetime-local"
                value={toDateTimeInputValue(form.discountEndsAt)}
              />
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
          <legend>Location</legend>
          <p className="admin-field-help">
            Choose a saved venue or add a new preset. New venue details are saved when you save the tournament.
          </p>
          <div className="admin-grid">
            <label>
              Venue
              <select onChange={(event) => chooseLocation(event.target.value)} value={venueChoice}>
                <option value="" disabled>Choose a venue</option>
                {savedLocations.map((option) => (
                  <option key={option.location} value={option.location}>{option.location}</option>
                ))}
                <option value="__new__">+ Add new venue preset</option>
              </select>
            </label>
          </div>
          {venueChoice === "__new__" ? (
            <div className="admin-grid admin-preset-fields">
              <label>
                Venue name
                <input
                  onChange={(event) => setField("location", event.target.value)}
                  placeholder="Community center, school, or room name"
                  value={form.location}
                />
              </label>
              <label>
                Address
                <input onChange={(event) => setAddress(event.target.value)} value={form.address} />
                <span className="admin-label-help">The public map link is created automatically.</span>
              </label>
            </div>
          ) : venueChoice ? (
            <div className="admin-preset-summary">
              <strong>{form.location}</strong>
              <span>{form.address || "No address saved"}</span>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Banner image</legend>
          <TournamentImageDropzone
            onChange={(imageUrl) => setField("imageUrl", imageUrl)}
            value={form.imageUrl}
          />
        </fieldset>

        <details className="admin-fieldset admin-optional-fields">
          <summary>Optional event links</summary>
          <p className="admin-field-help">
            You can leave these blank. Only add a link when the event organizer gives you one.
          </p>
          <div className="admin-grid">
            <label>
              Event information or rules
              <input
                onChange={(event) => setField("rulesUrl", event.target.value)}
                placeholder="Link to a page with full event details"
                type="url"
                value={form.rulesUrl}
              />
            </label>
            <label>
              Event flyer
              <input
                onChange={(event) => setField("flyerUrl", event.target.value)}
                placeholder="Link to a flyer, if there is one"
                type="url"
                value={form.flyerUrl}
              />
            </label>
            <label>
              US Chess event listing
              <input
                onChange={(event) => setField("uscfUrl", event.target.value)}
                placeholder="Optional US Chess event page"
                type="url"
                value={form.uscfUrl}
              />
              <span className="admin-label-help">Skip this unless the tournament already has an official US Chess listing.</span>
            </label>
          </div>
        </details>

        <fieldset className="admin-fieldset">
          <legend>Tournament director</legend>
          <p className="admin-field-help">
            Choose a saved director or add a new preset. New contact details are saved with the tournament.
          </p>
          <div className="admin-grid">
            <label>
              Director
              <select onChange={(event) => chooseDirector(event.target.value)} value={directorChoice}>
                <option value="" disabled>Choose a tournament director</option>
                {savedDirectors.map((director) => (
                  <option key={director.key} value={director.key}>
                    {director.name || director.email}
                  </option>
                ))}
                <option value="__new__">+ Add new director preset</option>
              </select>
            </label>
          </div>
          {directorChoice === "__new__" ? (
            <div className="admin-grid admin-preset-fields">
              <label>
                Name
                <input onChange={(event) => setDirectorField("name", event.target.value)} value={form.director?.name || ""} />
              </label>
              <label>
                Email
                <input onChange={(event) => setDirectorField("email", event.target.value)} type="email" value={form.director?.email || ""} />
              </label>
              <label>
                Phone
                <input onChange={(event) => setDirectorField("phone", event.target.value)} type="tel" value={form.director?.phone || ""} />
              </label>
            </div>
          ) : directorChoice ? (
            <div className="admin-preset-summary">
              <strong>{form.director?.name || form.director?.email}</strong>
              <span>{[form.director?.email, form.director?.phone].filter(Boolean).join(" · ") || "No contact details saved"}</span>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Sections & entry fees</legend>
          {(form.entryFees || []).map((fee, feeIndex) => (
            <div className="admin-repeater-row" key={feeIndex}>
              <label>
                Section
                <select
                  onChange={(event) => setEntryFeeSection(feeIndex, event.target.value === "__new__" ? "" : event.target.value)}
                  value={savedSectionNames.includes(fee.section) ? fee.section : "__new__"}
                >
                  {savedSectionNames.map((sectionName) => (
                    <option key={sectionName} value={sectionName}>{sectionName}</option>
                  ))}
                  <option value="__new__">+ Add new section preset</option>
                </select>
                {!savedSectionNames.includes(fee.section) && (
                  <input
                    aria-label="New section name"
                    onChange={(event) => setEntryFeeSection(feeIndex, event.target.value)}
                    placeholder="New section name"
                    value={fee.section}
                  />
                )}
              </label>
              <label>
                Price ($)
                <input
                  min="0"
                  onChange={(event) => setEntryFees((entryFees) => updateAt(entryFees, feeIndex, { price: toNumber(event.target.value) ?? 0 }))}
                  type="number"
                  value={fee.price ?? ""}
                />
              </label>
              <label>
                Early price ($)
                <input
                  min="0"
                  onChange={(event) => setEntryFees((entryFees) => updateAt(entryFees, feeIndex, { earlyPrice: toNumber(event.target.value) }))}
                  placeholder="Optional"
                  type="number"
                  value={fee.earlyPrice ?? ""}
                />
              </label>
              <button
                className="button admin-remove-button"
                onClick={() => setEntryFees((entryFees) => removeAt(entryFees, feeIndex))}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="admin-add-button"
            onClick={() => setEntryFees((entryFees) => [...entryFees, { section: "", price: 0 }])}
            type="button"
          >
            + Add section
          </button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Schedule (days & rounds)</legend>
          <p className="admin-field-help">
            Section tables come from the entry-fee sections above. Add the dates, time controls, and round times here.
          </p>
          {(form.days || []).map((day, dayIndex) => (
            <div className="admin-nested-card" key={dayIndex}>
              <div className="admin-repeater-row">
                <label>
                  Schedule date
                  <input
                    onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                      date: formatScheduleDate(event.target.value),
                      dateValue: event.target.value,
                    }))}
                    type="date"
                    value={day.dateValue || scheduleDateInputValue(day.date, form.startsAt)}
                  />
                </label>
                <button
                  className="button admin-remove-button"
                  onClick={() => setDays((days) => removeAt(days, dayIndex))}
                  type="button"
                >
                  Remove day
                </button>
              </div>
              {(day.sections || []).map((section, sectionIndex) => (
                <div className="admin-nested-card" key={sectionIndex}>
                  <div className="admin-repeater-row">
                    <div className="admin-section-name">
                      <span>Section</span>
                      <strong>{section.name || "New section"}</strong>
                    </div>
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
                  </div>
                  {(section.times || []).map((time, timeIndex) => (
                      <div className="admin-repeater-row" key={timeIndex}>
                        <label>
                          Time
                          <input
                            onChange={(event) => setDays((days) => updateAt(days, dayIndex, {
                              sections: updateAt(day.sections, sectionIndex, {
                                times: updateAt(section.times, timeIndex, { label: formatTimeLabel(event.target.value) }),
                              }),
                            }))}
                            type="time"
                            value={timeLabelToInputValue(time.label)}
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
                          className="button admin-remove-button"
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
                    onClick={() => setDays((days) => {
                      const currentDay = days[dayIndex]
                      const currentSection = currentDay.sections[sectionIndex]
                      const sectionTimes = days.flatMap((scheduleDay) => (
                        (scheduleDay.sections || [])
                          .filter((scheduleSection) => scheduleSection.name === currentSection.name)
                          .flatMap((scheduleSection) => scheduleSection.times || [])
                      ))

                      return updateAt(days, dayIndex, {
                        sections: updateAt(currentDay.sections, sectionIndex, {
                          times: [
                            ...(currentSection.times || []),
                            { label: "", detail: getNextRoundDetail(sectionTimes) },
                          ],
                        }),
                      })
                    })}
                    type="button"
                  >
                    + Add time
                  </button>
                </div>
              ))}
            </div>
          ))}
          <button
            className="admin-add-button"
            onClick={() => setDays((days) => syncScheduleSections([...days, {
              date: "",
              dateValue: "",
              sections: [],
            }], form.entryFees))}
            type="button"
          >
            + Add day
          </button>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Prizes</legend>
          <p className="admin-field-help">
            Prize tables come from the entry-fee sections above. Add or remove prize rows within each section.
          </p>
          {(form.prizes || []).map((prizeSection, prizeSectionIndex) => (
            <div className="admin-nested-card" key={prizeSectionIndex}>
              <div className="admin-section-name">
                <span>Section</span>
                <strong>{prizeSection.section || "New section"}</strong>
              </div>
              {(prizeSection.rows || []).map((row, rowIndex) => (
                <div className="admin-repeater-row admin-prize-row" key={rowIndex}>
                  <PrizeEligibilityPicker
                    groups={[...new Set([...prizeGroupPresets, ...(row.brackets || [])])]}
                    label={`${prizeSection.section || "section"} prize ${rowIndex + 1}`}
                    onChange={(brackets) => setPrizes((prizes) => updateAt(prizes, prizeSectionIndex, {
                      rows: updateAt(prizeSection.rows, rowIndex, { brackets }),
                    }))}
                    selectedGroups={row.brackets || []}
                  />
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
                    className="button admin-remove-button"
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
                  rows: [...(prizeSection.rows || []), { brackets: ["All players"], prize: "", place: "" }],
                }))}
                type="button"
              >
                + Add prize row
              </button>
            </div>
          ))}
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
