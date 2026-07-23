const PAAmateurLogo = "/assets/PAAmateurLogo.webp"
import {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  paymentMethods,
  paymentOptions,
  tournamentRounds,
} from "./tournamentRegistration.js"

const tournamentImages = {
  "pa-amateur-championship": PAAmateurLogo,
}

export const withTournamentImage = (tournament) => ({
  ...tournament,
  image: tournament.imageUrl || tournamentImages[tournament.id] || "/assets/TournamentBannerTransparent.webp",
})

export {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  paymentMethods,
  paymentOptions,
  tournamentRounds,
}
