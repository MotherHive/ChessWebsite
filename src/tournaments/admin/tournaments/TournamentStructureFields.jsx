import {
  formatScheduleDate,
  formatTimeLabel,
  getNextRoundDetail,
  scheduleDateInputValue,
  syncScheduleSections,
  timeLabelToInputValue,
} from "./tournamentEditorModel"

const toNumber = (value) => (value === "" ? undefined : Number(value))

const updateAt = (list, index, patch) => (
  list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
)

const removeAt = (list, index) => list.filter((_, itemIndex) => itemIndex !== index)

function EntryFeesField({ entryFees, savedSectionNames, setEntryFees, setEntryFeeSection }) {
  return (
    <fieldset className="admin-fieldset">
      <legend>Sections & entry fees</legend>
      {entryFees.map((fee, feeIndex) => (
        <div className="admin-repeater-row" key={feeIndex}>
          <label>
            Section
            <select
              onChange={(event) => setEntryFeeSection(
                feeIndex,
                event.target.value === "__new__" ? "" : event.target.value,
              )}
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
              onChange={(event) => setEntryFees((current) => updateAt(current, feeIndex, {
                price: toNumber(event.target.value) ?? 0,
              }))}
              type="number"
              value={fee.price ?? ""}
            />
          </label>
          <label>
            Early price ($)
            <input
              min="0"
              onChange={(event) => setEntryFees((current) => updateAt(current, feeIndex, {
                earlyPrice: toNumber(event.target.value),
              }))}
              placeholder="Optional"
              type="number"
              value={fee.earlyPrice ?? ""}
            />
          </label>
          <button
            className="button admin-remove-button"
            onClick={() => setEntryFees((current) => removeAt(current, feeIndex))}
            type="button"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="admin-add-button"
        onClick={() => setEntryFees((current) => [...current, { section: "", price: 0 }])}
        type="button"
      >
        + Add section
      </button>
    </fieldset>
  )
}

function ScheduleField({ entryFees, setDays, startsAt, days }) {
  return (
    <fieldset className="admin-fieldset">
      <legend>Schedule (days & rounds)</legend>
      <p className="admin-field-help">
        Section tables come from the entry-fee sections above. Add the dates, time controls, and round times here.
      </p>
      {days.map((day, dayIndex) => (
        <div className="admin-nested-card" key={dayIndex}>
          <div className="admin-repeater-row">
            <label>
              Schedule date
              <input
                onChange={(event) => setDays((current) => updateAt(current, dayIndex, {
                  date: formatScheduleDate(event.target.value),
                  dateValue: event.target.value,
                }))}
                type="date"
                value={day.dateValue || scheduleDateInputValue(day.date, startsAt)}
              />
            </label>
            <button
              className="button admin-remove-button"
              onClick={() => setDays((current) => removeAt(current, dayIndex))}
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
                    onChange={(event) => setDays((current) => updateAt(current, dayIndex, {
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
                      onChange={(event) => setDays((current) => updateAt(current, dayIndex, {
                        sections: updateAt(day.sections, sectionIndex, {
                          times: updateAt(section.times, timeIndex, {
                            label: formatTimeLabel(event.target.value),
                          }),
                        }),
                      }))}
                      type="time"
                      value={timeLabelToInputValue(time.label)}
                    />
                  </label>
                  <label>
                    Detail
                    <input
                      onChange={(event) => setDays((current) => updateAt(current, dayIndex, {
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
                    onClick={() => setDays((current) => updateAt(current, dayIndex, {
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
                onClick={() => setDays((current) => {
                  const currentDay = current[dayIndex]
                  const currentSection = currentDay.sections[sectionIndex]
                  const sectionTimes = current.flatMap((scheduleDay) => (
                    (scheduleDay.sections || [])
                      .filter((scheduleSection) => scheduleSection.name === currentSection.name)
                      .flatMap((scheduleSection) => scheduleSection.times || [])
                  ))

                  return updateAt(current, dayIndex, {
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
        onClick={() => setDays((current) => syncScheduleSections([...current, {
          date: "",
          dateValue: "",
          sections: [],
        }], entryFees))}
        type="button"
      >
        + Add day
      </button>
    </fieldset>
  )
}

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

function PrizesField({ prizeGroupPresets, prizes, setPrizes }) {
  return (
    <fieldset className="admin-fieldset">
      <legend>Prizes</legend>
      <p className="admin-field-help">
        Prize tables come from the entry-fee sections above. Add or remove prize rows within each section.
      </p>
      {prizes.map((prizeSection, prizeSectionIndex) => (
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
                onChange={(brackets) => setPrizes((current) => updateAt(
                  current,
                  prizeSectionIndex,
                  { rows: updateAt(prizeSection.rows, rowIndex, { brackets }) },
                ))}
                selectedGroups={row.brackets || []}
              />
              <label>
                Prize
                <input
                  onChange={(event) => setPrizes((current) => updateAt(
                    current,
                    prizeSectionIndex,
                    { rows: updateAt(prizeSection.rows, rowIndex, { prize: event.target.value }) },
                  ))}
                  placeholder="Trophy"
                  value={row.prize}
                />
              </label>
              <label>
                Place
                <input
                  onChange={(event) => setPrizes((current) => updateAt(
                    current,
                    prizeSectionIndex,
                    { rows: updateAt(prizeSection.rows, rowIndex, { place: event.target.value }) },
                  ))}
                  placeholder="1st-3rd"
                  value={row.place}
                />
              </label>
              <button
                className="button admin-remove-button"
                onClick={() => setPrizes((current) => updateAt(current, prizeSectionIndex, {
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
            onClick={() => setPrizes((current) => updateAt(current, prizeSectionIndex, {
              rows: [
                ...(prizeSection.rows || []),
                { brackets: ["All players"], prize: "", place: "" },
              ],
            }))}
            type="button"
          >
            + Add prize row
          </button>
        </div>
      ))}
    </fieldset>
  )
}

export default function TournamentStructureFields({
  form,
  prizeGroupPresets,
  savedSectionNames,
  setDays,
  setEntryFees,
  setEntryFeeSection,
  setPrizes,
}) {
  return (
    <>
      <EntryFeesField
        entryFees={form.entryFees || []}
        savedSectionNames={savedSectionNames}
        setEntryFees={setEntryFees}
        setEntryFeeSection={setEntryFeeSection}
      />
      <ScheduleField
        days={form.days || []}
        entryFees={form.entryFees || []}
        setDays={setDays}
        startsAt={form.startsAt}
      />
      <PrizesField
        prizeGroupPresets={prizeGroupPresets}
        prizes={form.prizes || []}
        setPrizes={setPrizes}
      />
    </>
  )
}
