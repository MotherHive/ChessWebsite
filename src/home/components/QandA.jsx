import { useState } from "react"
import useScrollVisibility from "@/shared/hooks/useScrollVisibility"

const questionColumns = [
  [
    {
      question: "Do I need to be a good player to join?",
      answer: "No. Beginners, casual players, tournament players, and anyone curious about chess are welcome.",
    },
    {
      question: "Should I bring anything?",
      answer: "You do not need to bring anything. Boards and clocks are available, but extra sets are always appreciated.",
    },
    {
      question: "When does the club meet and where?",
      answer: "We meet Tuesdays from 6:30 to 9:00 pm on the 2nd floor of Nazareth Center at Marywood University.",
    },
    {
      question: "Do I need to sign up first?",
      answer: "No sign up is needed. You can drop in during the listed meeting time.",
    },
    {
      question: "Where should I park?",
      answer: "Use parking anywhere near Nazareth Center. Accessible parking is available close to the building.",
    },
    {
      question: "What is the rating range of your players?",
      answer: "We have players anywhere from 400 to 2200 USCF.",
    },
  ],
  [
    {
      question: "Is there a membership fee?",
      answer: "No membership fee is required for regular club meetings.",
    },
    {
      question: "Is this a university club?",
      answer: (
        <>
          We are not exclusively a university club. Anyone can drop by. If you are a student, you can join the student club at Marywood through{" "}
          <a href="https://www.marywood.edu/life-at-mu/involvement/clubs" target="_blank" rel="noreferrer">
            Marywood Student Clubs
          </a>
          .
        </>
      ),
      searchText: "Marywood student clubs university drop by",
    },
    {
      question: "Do you have tournaments?",
      answer: "Yes. We run local events during the year and share details when tournaments are scheduled.",
    },
    {
      question: "What happens at a club meeting?",
      answer: "Most meetings are casual games, analysis, and conversation.",
    },
    {
      question: "Can kids attend?",
      answer: "Yes. Students and families are welcome. Younger players should attend with a parent or guardian.",
    },
    {
      question: "How do I get meeting updates?",
      answer: "Use the email form here for meeting reminders and club announcements.",
    },
  ],
]

const getQuestionSearchText = (item) => [
  item.question,
  typeof item.answer === "string" ? item.answer : "",
  item.searchText ?? "",
].join(" ").toLowerCase()

function QuestionRow({ answer, isOpen, onToggle, question }) {
  const id = question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const answerId = `qa-answer-${id}`

  return (
    <div className={`qa-item${isOpen ? " qa-item-open" : ""}`}>
      <button
        className="qa-row"
        type="button"
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={onToggle}
      >
        <span>{question}</span>
        <span className="qa-chevron" aria-hidden="true"></span>
      </button>

      <div className="qa-answer-shell" id={answerId} aria-hidden={!isOpen}>
        <div className="qa-answer">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function QandA() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.24 })
  const [openQuestion, setOpenQuestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const allQuestions = questionColumns.flat()
  const matchingQuestions = allQuestions.filter((item) => (
    getQuestionSearchText(item).includes(normalizedSearchQuery)
  ))
  const splitIndex = Math.ceil(matchingQuestions.length / 2)
  const visibleQuestionColumns = normalizedSearchQuery
    ? [
        matchingQuestions.slice(0, splitIndex),
        matchingQuestions.slice(splitIndex),
      ]
    : questionColumns
  const hasMatchingQuestions = visibleQuestionColumns.some((column) => column.length > 0)
  const desktopRowCount = Math.max(
    0,
    ...visibleQuestionColumns.map((column) => column.length),
  )
  const mobileRowCount = visibleQuestionColumns.reduce(
    (total, column) => total + column.length,
    0,
  )

  const toggleQuestion = (question) => {
    setOpenQuestion((currentQuestion) => (
      currentQuestion === question ? null : question
    ))
  }

  return (
    <section
      id="qa"
      ref={sectionRef}
      className={`qa-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="qa-heading"
    >
      <div className="qa-content">
        <div className="qa-title">
          <h2 id="qa-heading">QUESTIONS &amp; ANSWERS</h2>
          <div className="qa-rule" aria-hidden="true"></div>
        </div>

        <div className="qa-panel">
          <div className="qa-search">
            <label htmlFor="qa-search">Search questions</label>
            <input
              id="qa-search"
              type="search"
              value={searchQuery}
              placeholder="Search questions..."
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div
            className="qa-grid"
            style={{
              "--qa-desktop-row-height": `${desktopRowCount * 66}px`,
              "--qa-mobile-row-height": `${mobileRowCount * 62}px`,
            }}
          >
            {hasMatchingQuestions ? (
              visibleQuestionColumns.map((column, columnIndex) => (
                <div
                  className="qa-column"
                  key={columnIndex}
                  style={{ "--qa-column-index": columnIndex }}
                >
                  {column.map((item) => (
                    <QuestionRow
                      answer={item.answer}
                      isOpen={openQuestion === item.question}
                      question={item.question}
                      key={item.question}
                      onToggle={() => toggleQuestion(item.question)}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p className="qa-empty">No questions match that search.</p>
            )}
          </div>

          <div className="qa-footer">
            <div className="qa-help">
              <p>Still confused?</p>
              <a href="mailto:scrantonchess@gmail.com">Email us</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
