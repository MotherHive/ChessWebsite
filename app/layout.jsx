import { Analytics } from '@vercel/analytics/next'
import AppShell from '@/shared/components/layout/AppShell'
import '../src/shared/shared.css'
import '../src/home/home.css'
import '../src/tournaments/tournaments.css'
import '../src/tournaments/purchase.css'
import '../src/contact/contact.css'
import '../src/tournaments/admin/admin.css'

export const metadata = {
  title: "Scranton Chess Club",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/site-icon.png", type: "image/png" },
    ],
    apple: "/site-icon.png",
  },
  verification: {
    google: "eN4ZL0aTHPLyvXmDv2_F3mcdj0mhKClMkg_lCebHJpA",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Libre+Baskerville:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  )
}
