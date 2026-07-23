"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { adminRequest } from "../client"
import TournamentImageDropzone from "./TournamentImageDropzone"
import TournamentStructureFields from "./TournamentStructureFields"
import {
  createMapUrl,
  createBlankTournament,
  deriveTournamentTiming,
  fromDateTimeInputValue,
  getSavedDirectors,
  getSavedLocations,
  getSavedSectionNames,
  getPrizeGroupPresets,
  hydrateScheduleDates,
  syncPrizeSections,
  syncScheduleSections,
  toDateTimeInputValue,
} from "./tournamentEditorModel"

const toNumber = (value) => (value === "" ? undefined : Number(value))

const updateAt = (list, index, patch) => (
  list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
)

const derivePresetChoices = (form, locations, directors) => ({
  venue: locations.some((location) => location.location === form.location)
    ? form.location
    : "__new__",
  director: directors.find((director) => (
    director.name === (form.director?.name || "")
      && director.email === (form.director?.email || "")
  ))?.key || "__new__",
})

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
          const choices = derivePresetChoices(nextForm, locations, directors)

          setForm(nextForm)
          setVenueChoice(choices.venue)
          setDirectorChoice(choices.director)
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

        const choices = derivePresetChoices(hydratedForm, locations, directors)

        setForm(hydratedForm)
        setVenueChoice(choices.venue)
        setDirectorChoice(choices.director)
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

        <TournamentStructureFields
          form={form}
          prizeGroupPresets={prizeGroupPresets}
          savedSectionNames={savedSectionNames}
          setDays={setDays}
          setEntryFees={setEntryFees}
          setEntryFeeSection={setEntryFeeSection}
          setPrizes={setPrizes}
        />

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
