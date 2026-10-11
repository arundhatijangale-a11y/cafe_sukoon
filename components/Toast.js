"use client";

export default function Toast({ message, isVisible }) {
  return (
    <div
      className={`toast-badge ${isVisible ? "show" : ""}`}
      id="toastBadge"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
