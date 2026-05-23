import { useEffect, useRef, useState } from 'react'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const headerRef = useRef(null)

    useEffect(() => {
        if (!isMenuOpen) return

        function handleDocumentClick(event) {
            if (!headerRef.current?.contains(event.target)) {
                setIsMenuOpen(false)
            }
        }

        function handleEscapeKey(event) {
            if (event.key === "Escape") {
                setIsMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleDocumentClick)
        document.addEventListener("keydown", handleEscapeKey)

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    }, [isMenuOpen])

    return (
        <header ref={headerRef}>
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

                <button
                    className="header-menu-button"
                    type="button"
                    aria-controls="primary-navigation"
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-section${isMenuOpen ? " nav-section-open" : ""}`}>
                    <nav id="primary-navigation">
                        <ul>
                            <li><a href="#tournaments" onClick={() => setIsMenuOpen(false)}>Tournaments</a></li>
                            <li><a href="#club-updates" onClick={() => setIsMenuOpen(false)}>Blog</a></li>
                            <li><a href="#about" onClick={() => setIsMenuOpen(false)}>About</a></li>
                            <li><a href="#join" onClick={() => setIsMenuOpen(false)}>Contact</a></li>
                        </ul>
                    </nav>

                    <div className="vertical-divider"></div>

                    <a className="button button-medium" href="#join" onClick={() => setIsMenuOpen(false)}>Join the Club</a>
                </div>
            </div>
        </header>
    )
}
