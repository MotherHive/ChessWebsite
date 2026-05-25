const samplePgn = `[Event "Scranton Chess Club Study"]
[Site "Scranton, PA"]
[Date "2026.05.25"]
[Round "-"]
[White "White"]
[Black "Black"]
[Result "1-0"]

1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0`

export const blogPosts = [
  {
    slug: "pennsylvania-state-amateur-championship-weekend",
    title: "Pennsylvania State Amateur Championship weekend in Scranton",
    category: "Tournament",
    date: "May 25, 2026",
    dateTime: "2026-05-25",
    readTime: "4 min read",
    excerpt:
      "Round times, sections, prizes, and player notes for the 2026 Pennsylvania State Amateur Championship at Marywood University.",
    content: [
      {
        heading: "Event notes",
        paragraphs: [
          "Scranton Chess Club is preparing for the 2026 Pennsylvania State Amateur Championship at Marywood University. Players should review sections, round times, bye rules, and registration details before arriving.",
          "Bring a clock if you have one, arrive early enough to check in, and leave enough time to find parking near the Nazareth Student Center.",
        ],
      },
      {
        heading: "Board example",
        paragraphs: [
          "Use the board below to step through a short tactical PGN. Future recap posts can include full games, annotated fragments, or key positions from club and tournament play.",
        ],
      },
    ],
    pgn: samplePgn,
  },
  {
    slug: "first-scranton-chess-club-night",
    title: "What to expect at your first Scranton Chess Club night",
    category: "Club Guide",
    date: "May 18, 2026",
    dateTime: "2026-05-18",
    readTime: "3 min read",
    excerpt:
      "Casual games, rated play questions, clocks, boards, and how new players can settle in quickly.",
    content: [
      {
        heading: "First visit",
        paragraphs: [
          "New players can join casual games, ask about tournament play, or watch a few boards before sitting down. Bring a set if convenient, but do not worry if you do not have one.",
          "The easiest start is to introduce yourself, mention your experience level, and ask for a casual game.",
        ],
      },
    ],
  },
  {
    slug: "prepare-for-weekend-tournament",
    title: "How to prepare for a weekend tournament",
    category: "Study",
    date: "May 11, 2026",
    dateTime: "2026-05-11",
    readTime: "5 min read",
    excerpt:
      "A practical checklist for openings, sleep, notation, snacks, and keeping focus through the final round.",
    content: [
      {
        heading: "Practical prep",
        paragraphs: [
          "Keep preparation simple. Review familiar openings, practice notation, pack water and snacks, and sleep enough before round one.",
          "Between rounds, avoid overloading yourself with new theory. Review one or two key moments, reset, and get ready for the next game.",
        ],
      },
    ],
  },
  {
    slug: "local-chess-stories-wanted",
    title: "Local chess stories and game highlights wanted",
    category: "Community",
    date: "May 4, 2026",
    dateTime: "2026-05-04",
    readTime: "2 min read",
    excerpt:
      "Send notable games, photos, event notes, and member news for future Scranton Chess Club posts.",
    content: [
      {
        heading: "Submit a story",
        paragraphs: [
          "Club members can send games, photos, event notes, and local chess news for future posts. PGN files are welcome when a position or game should be replayable.",
        ],
      },
    ],
  },
]

export const getBlogPostBySlug = (slug) => blogPosts.find((post) => post.slug === slug)
