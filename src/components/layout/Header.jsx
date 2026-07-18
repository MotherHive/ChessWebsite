"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import JoinMenu from "./JoinMenu"

export default function Header({ isJoinOpen, onJoinClose, onJoinToggle }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const headerRef = useRef(null)
    const isNavigationOpen = isMenuOpen || isJoinOpen

    useEffect(() => {
        if (!isNavigationOpen) return

        function handleDocumentClick(event) {
            if (!headerRef.current?.contains(event.target)) {
                setIsMenuOpen(false)
                onJoinClose()
            }
        }

        function handleEscapeKey(event) {
            if (event.key === "Escape") {
                setIsMenuOpen(false)
                onJoinClose()
            }
        }

        document.addEventListener("mousedown", handleDocumentClick)
        document.addEventListener("keydown", handleEscapeKey)

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    }, [isNavigationOpen, onJoinClose])

    const closeHeaderMenus = () => {
        setIsMenuOpen(false)
        onJoinClose()
    }

    return (
        <header ref={headerRef}>
            <div className="header-container">
                <div className="logo-section">
                    <Link className="logo" href="/" aria-label="Scranton Chess Club home">
                        <h5>SCRANTON</h5>
                        <div className="logo-line">
                            <div className="tapered-left"></div>
                            <h6>CHESS CLUB</h6>
                            <div className="tapered-right"></div>
                        </div>
                    </Link>
                    <div className="vertical-divider"></div>
                </div>

                <button
                    className="header-menu-button"
                    type="button"
                    aria-controls="primary-navigation"
                    aria-expanded={isNavigationOpen}
                    aria-label={isNavigationOpen ? "Close navigation" : "Open navigation"}
                    onClick={() => {
                        if (isNavigationOpen) {
                            closeHeaderMenus()
                            return
                        }

                        setIsMenuOpen(true)
                    }}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-section${isNavigationOpen ? " nav-section-open" : ""}`}>
                    <nav id="primary-navigation">
                        <ul>
                            <li><Link href="/tournaments" onClick={closeHeaderMenus}>Tournaments</Link></li>
                            <li><Link href="/#qa" onClick={closeHeaderMenus}>FAQ</Link></li>
                            <li><Link href="/contact" onClick={closeHeaderMenus}>Contact</Link></li>
                        </ul>
                    </nav>

                    <div className="vertical-divider"></div>

                    <JoinMenu
                        isOpen={isJoinOpen}
                        onToggle={onJoinToggle}
                    />
                </div>
            </div>
        </header>
    )
}
