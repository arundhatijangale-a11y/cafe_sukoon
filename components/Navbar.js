"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Navbar({
  onFocusModeToggle,
  onOpenTuneTaste,
  onTabSelect,
  user,
  onSignOut,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.classList.add("mobile-nav-active");
    } else {
      document.body.classList.remove("mobile-nav-active");
    }
  }, [mobileDrawerOpen]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Coffee Lover";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleMobileNavClick = (hash) => {
    setMobileDrawerOpen(false);
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <header className="main-header" id="mainHeader">
        <div className="container nav-container">
          <a href="#home" className="brand-logo" id="brandLogo">
            <div className="brand-cup-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 19h16v2H4zm14-9h-1V5H3v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h1c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-3 3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V7h10v6zm3-2c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1z" />
              </svg>
            </div>
            <span>
              Café <span className="brand-accent">Sukoon</span>
            </span>
          </a>

          <nav aria-label="Main Navigation">
            <ul className="nav-links">
              <li>
                <a href="#home" className="nav-link active">
                  Home
                </a>
              </li>
              <li>
                <a href="#showcaseSection" className="nav-link">
                  AI Recommendations
                </a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button
              className="btn-nav-focus"
              id="btnFocusMode"
              aria-label="Enter Focus Mode"
              title="Enter Focus Mode"
              onClick={onFocusModeToggle}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <span>Focus Mode</span>
            </button>

            <button
              className="btn-nav-tune"
              id="btnNavTuneAI"
              aria-label="Tune AI Preferences"
              onClick={onOpenTuneTaste}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
              <span>Tune AI Taste</span>
            </button>

            {/* Auth Navigation Buttons (When logged out) */}
            {!user ? (
              <div className="nav-auth-group" id="navAuthGroup">
                <Link href="/login" className="btn-nav-auth" id="btnNavLogin">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-nav-auth-primary" id="btnNavSignup">
                  Sign Up
                </Link>
              </div>
            ) : (
              /* User Profile Dropdown Menu (When logged in) */
              <div
                className="user-profile-menu-wrap"
                id="userProfileMenuWrap"
                ref={dropdownRef}
              >
                <button
                  className="btn-user-avatar"
                  id="btnUserAvatar"
                  aria-haspopup="true"
                  aria-expanded={profileDropdownOpen}
                  title="Account Menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen((prev) => !prev);
                  }}
                >
                  <span className="user-avatar-initial" id="userAvatarInitial">
                    {userInitial}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="profile-dropdown-card"
                    id="profileDropdownCard"
                    style={{ display: "block" }}
                  >
                    <div className="profile-dropdown-header">
                      <span className="profile-dropdown-name" id="dropdownUserName">
                        {displayName}
                      </span>
                      <span className="profile-dropdown-email" id="dropdownUserEmail">
                        {user.email || "user@cafesukoon.com"}
                      </span>
                    </div>
                    <div className="profile-dropdown-divider"></div>
                    <a
                      href="#showcaseSection"
                      className="profile-dropdown-item"
                      id="menuLikedSongs"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfileDropdownOpen(false);
                        onTabSelect?.("liked");
                        document.getElementById("showcaseSection")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>❤️ Liked Songs</span>
                    </a>
                    <a
                      href="#showcaseSection"
                      className="profile-dropdown-item"
                      id="menuSavedPlaylists"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfileDropdownOpen(false);
                        onTabSelect?.("saved");
                        document.getElementById("showcaseSection")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                      </svg>
                      <span>💾 Saved Playlists</span>
                    </a>
                    <button
                      className="profile-dropdown-item"
                      id="menuTuneTaste"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenTuneTaste?.();
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                      </svg>
                      <span>✨ Tune AI Taste</span>
                    </button>
                    <div className="profile-dropdown-divider"></div>
                    <button
                      className="profile-dropdown-item btn-signout-item"
                      id="btnSignOut"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut?.();
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            className={`mobile-nav-toggle ${mobileDrawerOpen ? "active" : ""}`}
            id="btnMobileNavToggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileDrawerOpen}
            aria-controls="mobileNavDrawer"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
          >
            <span className="hamburger-line line-1"></span>
            <span className="hamburger-line line-2"></span>
            <span className="hamburger-line line-3"></span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Navigation Drawer */}
      <div
        className={`mobile-nav-drawer ${mobileDrawerOpen ? "open" : ""}`}
        id="mobileNavDrawer"
        aria-hidden={!mobileDrawerOpen}
      >
        <div
          className="mobile-nav-backdrop"
          id="mobileNavBackdrop"
          onClick={() => setMobileDrawerOpen(false)}
        ></div>
        <div className="mobile-nav-panel">
          <div className="mobile-nav-header">
            <div className="brand-logo mobile-brand">
              <div className="brand-cup-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M4 19h16v2H4zm14-9h-1V5H3v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h1c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-3 3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V7h10v6zm3-2c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1z" />
                </svg>
              </div>
              <span>
                Café <span className="brand-accent">Sukoon</span>
              </span>
            </div>
            <button
              className="mobile-nav-close"
              id="btnMobileNavClose"
              aria-label="Close navigation menu"
              onClick={() => setMobileDrawerOpen(false)}
            >
              &times;
            </button>
          </div>

          {/* Navigation Links */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-title">Navigation</span>
            <ul className="mobile-nav-links">
              <li>
                <a
                  href="#home"
                  className="mobile-nav-link"
                  id="mobNavLinkHome"
                  onClick={() => handleMobileNavClick("#home")}
                >
                  <span>🏠</span> Home
                </a>
              </li>
              <li>
                <a
                  href="#showcaseSection"
                  className="mobile-nav-link"
                  id="mobNavLinkShowcase"
                  onClick={() => handleMobileNavClick("#showcaseSection")}
                >
                  <span>✨</span> AI Recommendations
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Feature Actions */}
          <div className="mobile-nav-section">
            <span className="mobile-nav-section-title">Experience</span>
            <div className="mobile-nav-actions-grid">
              <button
                className="mobile-action-card"
                id="mobBtnTuneTaste"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenTuneTaste?.();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                </svg>
                <div className="mobile-card-text">
                  <strong>Tune AI Taste</strong>
                  <span>Personalize recommendations</span>
                </div>
              </button>

              <button
                className="mobile-action-card"
                id="mobBtnFocusMode"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onFocusModeToggle?.();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
                <div className="mobile-card-text">
                  <strong>Focus Mode</strong>
                  <span>Audio sanctuary</span>
                </div>
              </button>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="mobile-nav-section mobile-auth-section">
            {!user ? (
              <div className="mobile-auth-loggedout" id="mobNavAuthLoggedOut">
                <Link
                  href="/login"
                  className="btn-mobile-auth-secondary"
                  id="mobBtnNavLogin"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-mobile-auth-primary"
                  id="mobBtnNavSignup"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Sign Up Free
                </Link>
              </div>
            ) : (
              <div className="mobile-auth-loggedin" id="mobNavAuthLoggedIn">
                <div className="mobile-user-card">
                  <div className="mobile-user-avatar" id="mobUserAvatar">
                    {userInitial}
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name" id="mobUserName">
                      {displayName}
                    </span>
                    <span className="mobile-user-email" id="mobUserEmail">
                      {user.email || "user@cafesukoon.com"}
                    </span>
                  </div>
                </div>
                <div className="mobile-user-links">
                  <a
                    href="#showcaseSection"
                    className="mobile-user-link-item"
                    id="mobMenuLiked"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileDrawerOpen(false);
                      onTabSelect?.("liked");
                      document.getElementById("showcaseSection")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>❤️ Liked Songs</span>
                  </a>
                  <a
                    href="#showcaseSection"
                    className="mobile-user-link-item"
                    id="mobMenuSaved"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileDrawerOpen(false);
                      onTabSelect?.("saved");
                      document.getElementById("showcaseSection")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                    </svg>
                    <span>💾 Saved Playlists</span>
                  </a>
                  <button
                    className="mobile-user-link-item mob-signout-btn"
                    id="mobBtnSignOut"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onSignOut?.();
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
