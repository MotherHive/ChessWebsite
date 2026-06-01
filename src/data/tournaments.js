import PAAmateurLogo from "../../assets/PAAmateurLogo.png"
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

export const tournamentListings = tournamentCatalog.map((tournament) => ({
  ...tournament,
  image: tournamentImages[tournament.id],
}))

export {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  paymentMethods,
  paymentOptions,
  tournamentRounds,
}
