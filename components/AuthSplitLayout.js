"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Cryptographic Helper Functions (PBKDF2-SHA256 with Unique Salt)
async function hashPasswordWithSalt(password, saltHex = null) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      let salt;
      if (saltHex) {
        const matches = saltHex.match(/.{1,2}/g) || [];
        salt = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
      } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
      }

      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        256
      );

      const hashHex = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const outSaltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return { hash: hashHex, salt: outSaltHex };
    } catch (e) {
      console.warn("Crypto subtle error, fallback hashing:", e);
    }
  }

  // Resilient fallback hashing
  let h = 0;
  const combined = (saltHex || "sukoon_salt_default") + password;
  for (let i = 0; i < combined.length; i++) {
    h = (h << 5) - h + combined.charCodeAt(i);
    h |= 0;
  }
  return { hash: "f_" + Math.abs(h).toString(16), salt: saltHex || "sukoon_salt_default" };
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email);
}

export default function AuthSplitLayout({ initialMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRememberMe, setLoginRememberMe] = useState(true);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRememberMe, setSignupRememberMe] = useState(true);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Alert & toast
  const [alert, setAlert] = useState(null); // { message, type: 'error' | 'success' }
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotAlert, setForgotAlert] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  };

  // Prefill remembered user & check session on mount
  useEffect(() => {
    try {
      const remembered = localStorage.getItem("cafe_sukoon_remembered_email");
      if (remembered) {
        setLoginEmail(remembered);
        setLoginRememberMe(true);
      }

      const persistentUser = localStorage.getItem("cafe_sukoon_user");
      const sessionUser = sessionStorage.getItem("cafe_sukoon_user");
      if (persistentUser || sessionUser) {
        router.push("/");
      }
    } catch (e) {}
  }, [router]);

  const saveUserSession = (userProfile, rememberMe) => {
    try {
      const serialized = JSON.stringify(userProfile);
      if (rememberMe) {
        localStorage.setItem("cafe_sukoon_user", serialized);
        sessionStorage.removeItem("cafe_sukoon_user");
        localStorage.setItem("cafe_sukoon_remembered_email", userProfile.email);
      } else {
        sessionStorage.setItem("cafe_sukoon_user", serialized);
        localStorage.removeItem("cafe_sukoon_user");
        localStorage.removeItem("cafe_sukoon_remembered_email");
      }
      localStorage.removeItem("cafe_sukoon_guest");
    } catch (e) {}
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!email || !password) {
      setAlert({ message: "Please enter both your email address and password.", type: "error" });
      return;
    }

    if (!isValidEmail(email)) {
      setAlert({ message: "Please enter a valid email address (e.g. name@domain.com).", type: "error" });
      return;
    }

    setLoginLoading(true);

    try {
      const accounts = JSON.parse(localStorage.getItem("cafe_sukoon_accounts") || "{}");
      const account = accounts[email];

      if (!account) {
        throw new Error("No account found with this email. Please check your spelling or sign up.");
      }

      let isPasswordValid = false;

      if (account.passwordHash && account.salt) {
        const hashAttempt = await hashPasswordWithSalt(password, account.salt);
        isPasswordValid = hashAttempt.hash === account.passwordHash;
      } else if (account.password) {
        if (account.password === password) {
          isPasswordValid = true;
          const newHash = await hashPasswordWithSalt(password);
          account.passwordHash = newHash.hash;
          account.salt = newHash.salt;
          delete account.password;
          accounts[email] = account;
          localStorage.setItem("cafe_sukoon_accounts", JSON.stringify(accounts));
        }
      }

      if (!isPasswordValid) {
        throw new Error('Incorrect password. Please verify your password or use "Forgot password?".');
      }

      const userProfile = {
        id: account.id || `usr_${Date.now()}`,
        email: account.email || email,
        name: account.name || email.split("@")[0],
        provider: "local",
      };

      if (account.preferences) {
        localStorage.setItem("cafe_sukoon_ai_profile", JSON.stringify(account.preferences));
      }
      if (account.savedPlaylists) {
        localStorage.setItem("cafe_sukoon_saved_playlists", JSON.stringify(account.savedPlaylists));
      }

      saveUserSession(userProfile, loginRememberMe);
      setAlert({
        message: "Welcome back to Café Sukoon! Redirecting to your sanctuary...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (err) {
      setAlert({ message: err.message || "Login failed. Please check your credentials.", type: "error" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword;

    if (!name || !email || !password) {
      setAlert({
        message: "Please fill in all fields (Full Name, Email Address, and Password).",
        type: "error",
      });
      return;
    }

    if (name.length < 2) {
      setAlert({ message: "Please enter your full name (at least 2 characters).", type: "error" });
      return;
    }

    if (!isValidEmail(email)) {
      setAlert({ message: "Please enter a valid email address (e.g. name@domain.com).", type: "error" });
      return;
    }

    if (password.length < 6) {
      setAlert({ message: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    setSignupLoading(true);

    try {
      const accounts = JSON.parse(localStorage.getItem("cafe_sukoon_accounts") || "{}");

      if (accounts[email]) {
        throw new Error("An account with this email address already exists. Please sign in instead.");
      }

      const hashResult = await hashPasswordWithSalt(password);
      const userProfile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        email,
        name,
        provider: "local",
      };

      accounts[email] = {
        id: userProfile.id,
        name,
        email,
        passwordHash: hashResult.hash,
        salt: hashResult.salt,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("cafe_sukoon_accounts", JSON.stringify(accounts));

      saveUserSession(userProfile, signupRememberMe);
      setAlert({
        message: "Account created! Welcome to Café Sukoon ✨ Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err) {
      setAlert({ message: err.message || "Failed to create account. Please try again.", type: "error" });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setAlert(null);
    const googleUser = {
      id: `g_${Date.now()}`,
      name: "Sukoon Music Lover",
      email: "user.sukoon@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      provider: "google",
    };

    saveUserSession(googleUser, true);
    setAlert({ message: "Connected with Google! Redirecting to Café Sukoon...", type: "success" });
    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  const handleContinueGuest = () => {
    localStorage.setItem("cafe_sukoon_guest", "true");
    localStorage.removeItem("cafe_sukoon_user");
    sessionStorage.removeItem("cafe_sukoon_user");
    showToast("Continuing as Guest ☕ Full music experience unlocked.");
    setTimeout(() => {
      router.push("/");
    }, 400);
  };

  const handleSendResetLink = () => {
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setForgotAlert({ message: "Please enter your email address.", type: "error" });
      return;
    }
    if (!isValidEmail(email)) {
      setForgotAlert({ message: "Please enter a valid email address.", type: "error" });
      return;
    }

    const accounts = JSON.parse(localStorage.getItem("cafe_sukoon_accounts") || "{}");
    if (accounts[email]) {
      setForgotAlert({
        message: `Password reset link sent to ${email} (Demo Simulation: Password verified).`,
        type: "success",
      });
    } else {
      setForgotAlert({
        message: "If an account exists with this email, a reset link will be sent.",
        type: "success",
      });
    }

    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotAlert(null);
    }, 2000);
  };

  return (
    <div className="auth-split-wrapper">
      {/* LEFT PANEL: COZY CAFÉ SCENE & BRANDING */}
      <div className="auth-visual-panel">
        <div className="auth-visual-overlay"></div>

        {/* Ambient Glowing Elements */}
        <div className="ambient-coffee-glow"></div>
        <div className="ambient-gold-glow"></div>

        {/* Left Panel Header */}
        <div className="visual-brand-header">
          <Link href="/" className="brand-logo" title="Return to Café Sukoon">
            <div className="brand-cup-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 19h16v2H4zm14-9h-1V5H3v8c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-1h1c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-3 3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V7h10v6zm3-2c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1z" />
              </svg>
            </div>
            <span>
              Café <span className="brand-accent">Sukoon</span>
            </span>
          </Link>
        </div>

        {/* Illustrated Café Art Stage */}
        <div className="cafe-illustration-card">
          <div className="illustration-art-frame">
            {/* Warm Hanging Pendant Lamps */}
            <div className="cafe-pendant-lamps" aria-hidden="true">
              <div className="pendant-lamp lamp-left">
                <div className="lamp-cord"></div>
                <div className="lamp-shade"></div>
                <div className="lamp-bulb"></div>
              </div>
              <div className="pendant-lamp lamp-center">
                <div className="lamp-cord"></div>
                <div className="lamp-shade"></div>
                <div className="lamp-bulb"></div>
              </div>
              <div className="pendant-lamp lamp-right">
                <div className="lamp-cord"></div>
                <div className="lamp-shade"></div>
                <div className="lamp-bulb"></div>
              </div>
            </div>

            {/* Steaming Coffee & Vinyl Record Motif */}
            <div className="cafe-steaming-cup">
              <div className="steam-wave steam-1"></div>
              <div className="steam-wave steam-2"></div>
              <div className="steam-wave steam-3"></div>
              <div className="cup-saucer">
                <div className="cup-body">
                  <div className="latte-art-heart"></div>
                </div>
                <div className="cup-handle"></div>
              </div>
            </div>

            <div className="spinning-vinyl-record" aria-hidden="true">
              <div className="vinyl-groove groove-1"></div>
              <div className="vinyl-groove groove-2"></div>
              <div className="vinyl-center-label">
                <span className="vinyl-dot"></span>
              </div>
            </div>
          </div>

          <div className="visual-quote-area">
            <h2 className="visual-quote-heading">Where Every Sip Has A Soundtrack.</h2>

            <div className="visual-features-row">
              <div className="visual-feature-pill">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Liked Tracks</span>
              </div>
              <div className="visual-feature-pill">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                <span>Saved Playlists</span>
              </div>
              <div className="visual-feature-pill">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span>AI Music Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN / SIGNUP FORM */}
      <div className="auth-form-panel">
        <Link href="/" className="auth-back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>Back to Café Sukoon</span>
        </Link>

        <div className="auth-card-container">
          {/* Auth Tabs (Login / Sign Up) */}
          <div className="auth-nav-tabs" role="tablist">
            <button
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              id="tabLogin"
              role="tab"
              aria-selected={mode === "login"}
              aria-controls="formLogin"
              onClick={() => {
                setMode("login");
                setAlert(null);
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
              id="tabSignup"
              role="tab"
              aria-selected={mode === "signup"}
              aria-controls="formSignup"
              onClick={() => {
                setMode("signup");
                setAlert(null);
              }}
            >
              Create Account
            </button>
          </div>

          {/* Header Texts */}
          <div className="auth-heading-wrap">
            <h1 className="auth-heading" id="authTitle">
              {mode === "login" ? "Welcome Back to Café Sukoon" : "Join Café Sukoon Sanctuary"}
            </h1>
            <p className="auth-subheading" id="authSubtitle">
              {mode === "login"
                ? "Your coffee, your music, your little escape."
                : "Create your account to sync your playlists and AI taste profile."}
            </p>
          </div>

          {/* Social / Google Sign-In */}
          <button
            className="btn-google-auth"
            id="btnGoogleAuth"
            type="button"
            aria-label="Continue with Google"
            onClick={handleGoogleAuth}
          >
            <svg className="google-svg" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {/* Notification Alert Box */}
          {alert && (
            <div
              className={`auth-alert ${alert.type}`}
              id="authAlert"
              role="alert"
              style={{ display: "block" }}
            >
              {alert.message}
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === "login" ? (
            <form className="auth-form" id="formLogin" noValidate onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="loginEmail">
                  Email Address
                </label>
                <div className="input-field-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <input
                    type="email"
                    id="loginEmail"
                    className="form-input"
                    placeholder="you@domain.com"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginPassword">
                  Password
                </label>
                <div className="input-field-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <input
                    type={showLoginPass ? "text" : "password"}
                    id="loginPassword"
                    className="form-input"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    id="toggleLoginPass"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowLoginPass((prev) => !prev)}
                  >
                    {!showLoginPass ? (
                      <svg className="eye-icon eye-open" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg className="eye-icon eye-closed" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="custom-checkbox-wrap" htmlFor="loginRememberMe">
                  <input
                    type="checkbox"
                    id="loginRememberMe"
                    className="custom-checkbox-input"
                    checked={loginRememberMe}
                    onChange={(e) => setLoginRememberMe(e.target.checked)}
                  />
                  <span className="custom-checkbox-box">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                  <span className="checkbox-label-text">Remember me</span>
                </label>
                <button
                  type="button"
                  className="btn-link-action"
                  id="btnForgotPass"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotAlert(null);
                    setForgotModalOpen(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                id="btnLoginSubmit"
                disabled={loginLoading}
              >
                <span className="btn-text">
                  {loginLoading ? "Verifying..." : "Sign In to Sanctuary"}
                </span>
                {loginLoading && <div className="btn-spinner" style={{ display: "block" }}></div>}
              </button>
            </form>
          ) : (
            /* 2. SIGN UP FORM */
            <form className="auth-form" id="formSignup" noValidate onSubmit={handleSignupSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="signupName">
                  Full Name
                </label>
                <div className="input-field-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <input
                    type="text"
                    id="signupName"
                    className="form-input"
                    placeholder="e.g. Maya Sharma"
                    required
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signupEmail">
                  Email Address
                </label>
                <div className="input-field-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <input
                    type="email"
                    id="signupEmail"
                    className="form-input"
                    placeholder="you@domain.com"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signupPassword">
                  Create Password
                </label>
                <div className="input-field-wrap">
                  <svg className="input-icon" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <input
                    type={showSignupPass ? "text" : "password"}
                    id="signupPassword"
                    className="form-input"
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    id="toggleSignupPass"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowSignupPass((prev) => !prev)}
                  >
                    {!showSignupPass ? (
                      <svg className="eye-icon eye-open" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg className="eye-icon eye-closed" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="custom-checkbox-wrap" htmlFor="signupRememberMe">
                  <input
                    type="checkbox"
                    id="signupRememberMe"
                    className="custom-checkbox-input"
                    checked={signupRememberMe}
                    onChange={(e) => setSignupRememberMe(e.target.checked)}
                  />
                  <span className="custom-checkbox-box">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                  <span className="checkbox-label-text">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                id="btnSignupSubmit"
                disabled={signupLoading}
              >
                <span className="btn-text">
                  {signupLoading ? "Creating account..." : "Create Free Account"}
                </span>
                {signupLoading && <div className="btn-spinner" style={{ display: "block" }}></div>}
              </button>
            </form>
          )}

          {/* Continue As Guest */}
          <div className="guest-action-box">
            <button
              type="button"
              className="btn-guest-action"
              id="btnContinueGuest"
              onClick={handleContinueGuest}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              <span>Continue as Guest</span>
            </button>
          </div>

          {/* Footer switch text */}
          <div className="auth-footer-prompt">
            <span id="authPromptText">
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}
            </span>
            <button
              type="button"
              className="btn-link-action"
              id="btnToggleAuthMode"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setAlert(null);
              }}
            >
              {mode === "login" ? "Sign Up Free" : "Sign In"}
            </button>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div
          className="auth-modal-backdrop"
          id="modalForgotPass"
          role="dialog"
          aria-modal="true"
          style={{ display: "flex" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setForgotModalOpen(false);
          }}
        >
          <div className="auth-modal-card">
            <button
              className="modal-close-btn"
              id="btnCloseForgotModal"
              aria-label="Close modal"
              onClick={() => setForgotModalOpen(false)}
            >
              &times;
            </button>
            <h3 className="modal-title">Reset Password</h3>
            <p className="modal-desc">Enter your email to receive a password reset link.</p>

            <div className="form-group" style={{ marginTop: "18px" }}>
              <label className="form-label" htmlFor="forgotEmail">
                Email Address
              </label>
              <div className="input-field-wrap">
                <svg className="input-icon" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <input
                  type="email"
                  id="forgotEmail"
                  className="form-input"
                  placeholder="you@domain.com"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            </div>

            {forgotAlert && (
              <div
                className={`auth-alert ${forgotAlert.type}`}
                id="forgotAlert"
                style={{ display: "block" }}
              >
                {forgotAlert.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                className="btn-glass-action"
                id="btnCancelForgot"
                onClick={() => setForgotModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-auth-primary"
                id="btnSendResetLink"
                style={{ padding: "10px 22px", width: "auto" }}
                onClick={handleSendResetLink}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Feedback */}
      <div
        className={`toast-badge ${toastVisible ? "show" : ""}`}
        id="toastBadge"
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </div>
  );
}
