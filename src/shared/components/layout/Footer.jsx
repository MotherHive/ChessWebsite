const ChessComIcon = "/assets/icons/chess.com.svg"
const LichessIcon = "/assets/icons/Lichess.svg"
const MarywoodIcon = "/assets/icons/marywood.svg"

function DiscordIcon() {
  return (
    <svg className="site-footer-discord" viewBox="0 0 20 19" aria-hidden="true">
      <path d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="Copyright and community links">
      <p className="site-footer-copy">
        &copy; 2026 Scranton Chess Club
        <a className="site-footer-privacy" href="/privacy">Privacy</a>
      </p>

      <div className="site-footer-join" aria-label="Join Scranton Chess Club online">
        <span>Join Us @</span>
        <a className="site-footer-icon-link" href="https://lichess.org/" target="_blank" rel="noreferrer" aria-label="Join us on Lichess">
          <img className="site-footer-lichess" src={LichessIcon} alt="" />
        </a>
        <a className="site-footer-icon-link" href="https://www.chess.com/club/marywood-university-chess-club" target="_blank" rel="noreferrer" aria-label="Join us on Chess.com">
          <img className="site-footer-pawn" src={ChessComIcon} alt="" />
        </a>
        <a className="site-footer-marywood" href="https://www.marywood.edu/" target="_blank" rel="noreferrer" aria-label="Marywood University">
          <img src={MarywoodIcon} alt="" />
        </a>
        <a className="site-footer-icon-link" href="https://discord.com/" target="_blank" rel="noreferrer" aria-label="Join us on Discord">
          <DiscordIcon />
        </a>
        <span className="site-footer-placeholder" aria-label="Social link coming soon" role="img">
          <span></span>
        </span>
        <span className="site-footer-placeholder" aria-label="Social link coming soon" role="img">
          <span></span>
        </span>
      </div>
    </footer>
  )
}
