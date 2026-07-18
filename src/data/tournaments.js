const PAAmateurLogo = "/assets/PAAmateurLogo.webp"
import {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  paymentMethods,
  paymentOptions,
  tournamentCatalog,
  tournamentRounds,
} from "./tournamentCatalog.js"

const tournamentImages = {
  "pa-amateur-championship": PAAmateurLogo,
}

export const withTournamentImage = (tournament) => ({
  ...tournament,
  image: tournament.imageUrl || tournamentImages[tournament.id],
})

export const tournamentListings = tournamentCatalog.map(withTournamentImage)

export {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  paymentMethods,
  paymentOptions,
  tournamentRounds,
}
