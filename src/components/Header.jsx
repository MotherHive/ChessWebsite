import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import JoinMenu from "./JoinMenu"

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isJoinOpen, setIsJoinOpen] = useState(false)
    const headerRef = useRef(null)

    useEffect(() => {
        if (!isMenuOpen && !isJoinOpen) return

        function handleDocumentClick(event) {
            if (!headerRef.current?.contains(event.target)) {
                setIsMenuOpen(false)
                setIsJoinOpen(false)
            }
        }

        function handleEscapeKey(event) {
            if (event.key === "Escape") {
                setIsMenuOpen(false)
                setIsJoinOpen(false)
            }
        }

        document.addEventListener("mousedown", handleDocumentClick)
        document.addEventListener("keydown", handleEscapeKey)

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    }, [isMenuOpen, isJoinOpen])

    const closeHeaderMenus = () => {
        setIsMenuOpen(false)
        setIsJoinOpen(false)
    }

    return (
        <header ref={headerRef}>
            <div className="header-container">
                <div className="logo-section">
                    <Link className="logo" to="/" aria-label="Scranton Chess Club home">
                        <h5>SCRANTON</h5>
                        <span>
                            <div className="tapered-left"></div>
                            <h6>CHESS CLUB</h6>
                            <div className="tapered-right"></div>
                        </span>
                    </Link>
                    <div className="vertical-divider"></div>
                </div>

                <button
                    className="header-menu-button"
                    type="button"
                    aria-controls="primary-navigation"
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
                    onClick={() => {
                        setIsMenuOpen((open) => !open)
                        setIsJoinOpen(false)
                    }}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-section${isMenuOpen ? " nav-section-open" : ""}`}>
                    <nav id="primary-navigation">
                        <ul>
                            <li><NavLink to="/tournaments" onClick={closeHeaderMenus}>Tournaments</NavLink></li>
                            <li><NavLink to="/blog" onClick={closeHeaderMenus}>Blog</NavLink></li>
                            <li><Link to="/#qa" onClick={closeHeaderMenus}>FAQ</Link></li>
                            <li><NavLink to="/contact" onClick={closeHeaderMenus}>Contact</NavLink></li>
                        </ul>
                    </nav>

                    <div className="vertical-divider"></div>

                    <JoinMenu
                        isOpen={isJoinOpen}
                        onToggle={() => setIsJoinOpen((open) => !open)}
                    />
                </div>
            </div>
        </header>
    )
}
