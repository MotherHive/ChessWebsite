import PAAmateurLogo from "../../assets/PAAmateurLogo.png"

export const tournamentListings = [
  {
    id: "pa-amateur-championship",
    title: "2026 Pennsylvania State Amateur Championship",
    type: "State Championship Event",
    rating: "USCF",
    entryFees: [
      { section: "Championship", price: 22, earlyPrice: 17 },
      { section: "Scholastic", price: 17, earlyPrice: 12 },
    ],
    earlyEntryDeadlineLabel: "May 25",
    discountEndsAt: "2026-05-25T23:59:59-04:00",
    dateRange: "May 30-31, 2026",
    location: "Latour Room, Nazareth Student Center, Marywood University",
    address: "1300 University Ave., Scranton, PA 18509",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=1300%20University%20Ave%2C%20Scranton%2C%20PA%2018509",
    image: PAAmateurLogo,
    maxByes: 1,
    director: {
      name: "Bernie Sporko",
      email: "basp0529@gmail.com",
      phone: "570-604-2461",
      website: "https://www.pscfchess.org/clearinghouse/",
    },
    rulesUrl: "https://www.pscfchess.org/clearinghouse/",
    days: [
      {
        date: "Sat, May 30",
        sections: [
          {
            name: "Championship",
            control: "G/75 d5",
            times: [
              { label: "8:30 AM", detail: "Registration start" },
              { label: "9:30 AM", detail: "Registration end" },
              { label: "10:00", detail: "Round 1" },
              { label: "1:00", detail: "Round 2" },
              { label: "3:30", detail: "Round 3" },
            ],
          },
          {
            name: "Scholastic",
            control: "G/40 d5",
            times: [
              { label: "8:30 AM", detail: "Registration start" },
              { label: "9:30 AM", detail: "Registration end" },
              { label: "10:00", detail: "Round 1" },
              { label: "11:30", detail: "Round 2" },
              { label: "1:00", detail: "Round 3" },
              { label: "2:30", detail: "Round 4" },
            ],
          },
        ],
      },
      {
        date: "Sun, May 31",
        sections: [
          {
            name: "Championship",
            control: "G/90 d5",
            times: [
              { label: "9:30", detail: "Round 4" },
              { label: "1:00", detail: "Round 5" },
            ],
          },
        ],
      },
    ],
    prizes: [
      {
        section: "Championship",
        rows: [
          { brackets: ["Overall"], prize: "Trophies", place: "1st-3rd" },
          { brackets: ["U1800", "U1600", "U1400", "U1200/Unrated", "School Team"], prize: "Trophy", place: "Top" },
          { brackets: ["Overall"], prize: "2027 PA entry", place: "1st & 2nd" },
          { brackets: ["PA Resident"], prize: "Title", place: "Top" },
        ],
      },
      {
        section: "Scholastic",
        rows: [
          { brackets: ["Overall"], prize: "Trophies", place: "1st-2nd" },
          { brackets: ["U1000", "U800/Unrated", "School Team"], prize: "Trophy", place: "Top" },
        ],
      },
    ],
  },
]

export const byePrice = 5
export const expiredMembershipDiscount = 3

export const tournamentRounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

export const membershipAgeTiers = [
  { label: "Youth membership", ageRange: "18 and under", maxAge: 18, price: 20 },
  { label: "Adult membership", ageRange: "19-64", maxAge: 64, price: 45 },
  { label: "Senior membership", ageRange: "65+", maxAge: 150, price: 40 },
]

const membershipPrices = membershipAgeTiers.map((tier) => tier.price)

export const membershipPriceRange = {
  min: Math.min(...membershipPrices),
  max: Math.max(...membershipPrices),
}

export const paymentOptions = [
  "Payment method to be confirmed",
  "Pay at event",
  "Email invoice",
  "Online payment pending",
]
