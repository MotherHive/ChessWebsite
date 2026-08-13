export default function PrivacyPage() {
  return (
    <section className="legal-page" aria-labelledby="privacy-heading">
      <h1 id="privacy-heading">Privacy Policy</h1>
      <p className="legal-updated">Last updated August 12, 2026</p>

      <p>
        The Scranton Chess Club runs this site. We collect only what we need to
        run the club mailing list and tournament registration. We do not sell
        your information or share it for advertising.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Club mailing list.</strong> Your first name, last name, and email
        address, so we can send club news.
      </p>
      <p>
        <strong>Tournament registration.</strong> Your name, email address, and
        the entry details you choose. Depending on the tournament, this can also
        include your phone number, mailing address, date of birth, USCF ID,
        school, and the sections and byes you select. We keep a record of what
        you were charged and whether it was paid.
      </p>
      <p>
        <strong>Payments.</strong> Card payments go through Stripe. Your card
        number never reaches our servers. We store only Stripe&apos;s reference
        IDs and the payment status.
      </p>

      <h2>Services we use</h2>
      <p>
        <strong>Cloudflare</strong> hosts the site and stores our data.
      </p>
      <p>
        <strong>Cloudflare Turnstile</strong> protects our forms from bots. It
        runs invisibly in the background and checks the browser rather than the
        person. See{" "}
        <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noreferrer">
          Cloudflare&apos;s Turnstile Privacy Addendum
        </a>{" "}
        for what it processes.
      </p>
      <p>
        <strong>Stripe</strong> processes payments.{" "}
        <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
          Stripe&apos;s privacy policy
        </a>.
      </p>
      <p>
        <strong>Resend</strong> sends our confirmation and welcome emails.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Mailing list entries stay until you ask to be removed. Registration and
        payment records stay as long as we need them for club and tax records.
      </p>

      <h2>Your choices</h2>
      <p>
        Email{" "}
        <a href="mailto:scrantonchess@gmail.com">scrantonchess@gmail.com</a> to
        see what we hold about you, correct it, or have it deleted. To leave the
        mailing list, ask at the same address.
      </p>

      <h2>Children</h2>
      <p>
        Players under 18 register through a parent or guardian. If a child gave
        us information without a guardian, contact us and we will delete it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top changes with it.
      </p>
    </section>
  )
}
