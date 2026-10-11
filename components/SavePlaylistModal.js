"use client";

import { useState, useEffect } from "react";

export default function SavePlaylistModal({ isOpen, onClose, onSave }) {
  const [playlistName, setPlaylistName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPlaylistName(`Café Sukoon AI Mix (${new Date().toLocaleDateString()})`);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const name = playlistName.trim() !== "" ? playlistName.trim() : "AI Café Mix";
    onSave(name);
    onClose();
  };

  return (
    <div
      className={`save-modal-backdrop ${isOpen ? "open" : ""}`}
      id="savePlaylistModal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="save-modal-card">
        <button
          className="modal-close-btn"
          id="btnCloseSaveModal"
          aria-label="Close modal"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 style={{ fontFamily: "var(--font-heading)", color: "#fff", fontSize: "1.3rem" }}>
          Save Playlist
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Save this blend to your café library.
        </p>

        <input
          type="text"
          className="save-input"
          id="savePlaylistInput"
          placeholder="e.g. Rainy Afternoon Blend"
          aria-label="Playlist Name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
        />

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            className="btn-glass-action"
            id="btnCancelSave"
            style={{ padding: "8px 16px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary-action"
            id="btnConfirmSave"
            style={{ padding: "8px 20px" }}
            onClick={handleConfirm}
          >
            Save Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
