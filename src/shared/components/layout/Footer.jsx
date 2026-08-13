const ChessComIcon = "/assets/icons/chess.com.svg"
const LichessIcon = "/assets/icons/Lichess.svg"
const MarywoodIcon = "/assets/icons/marywood.svg"

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
      </div>
    </footer>
  )
}
