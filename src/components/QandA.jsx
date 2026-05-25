import { useEffect, useRef, useState } from "react"

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
      answer: "We have players anywhere from 1000 to 2200 USCF.",
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

function QuestionRow({ answer, isExtra, isOpen, onToggle, question }) {
  const id = question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const answerId = `qa-answer-${id}`

  return (
    <div className={`qa-item${isOpen ? " qa-item-open" : ""}${isExtra ? " qa-item-extra" : ""}`}>
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
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  const visibleQuestionColumns = questionColumns.map((column) => (
    showAllQuestions ? column : column.slice(0, 3)
  ))

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.24 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

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
          <h2 id="qa-heading">Q &amp; A</h2>
          <div className="qa-rule" aria-hidden="true"></div>
        </div>

        {visibleQuestionColumns.map((column, columnIndex) => (
          <div
            className="qa-column"
            key={columnIndex}
            style={{ "--qa-column-index": columnIndex }}
          >
            {column.map((item, questionIndex) => (
              <QuestionRow
                answer={item.answer}
                isExtra={questionIndex >= 3}
                isOpen={openQuestion === item.question}
                question={item.question}
                key={item.question}
                onToggle={() => toggleQuestion(item.question)}
              />
            ))}
          </div>
        ))}

        {!showAllQuestions && (
          <div className="qa-actions">
            <button
              className="qa-show-all"
              type="button"
              onClick={() => setShowAllQuestions(true)}
            >
              Show All Questions
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
