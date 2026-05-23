export default function Header() {
    return (
        <header>
            <div className="header-container">
                <div className="logo-section">
                    <div className="logo">
                        <h5>SCRANTON</h5>
                        <span>
                            <div className="tapered-left"></div>
                            <h6>CHESS CLUB</h6>
                            <div className="tapered-right"></div>
                        </span>
                    </div>
                    <div className="vertical-divider"></div>
                </div>

                <div className="nav-section">
                    <nav>
                        <ul>
                            <li><a href="">Tournaments</a></li>
                            <li><a href="">Blog</a></li>
                            <li><a href="">About</a></li>
                            <li><a href="">Contact</a></li>
                        </ul>
                    </nav>

                    <div className="vertical-divider"></div>

                    <button className="button button-medium">Join the Club</button>
                </div>
            </div>
        </header>
    )
}
