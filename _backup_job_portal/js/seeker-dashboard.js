/**
 * CareerConnect - Job Seeker Dashboard Controller
 * Manages Seeker Profile, Applied Jobs, Saved Jobs, and Interactive Resume Manager.
 */

function initSeekerDashboard() {
  renderProfileSection();
  renderDashboardStats();
  renderAppliedJobsTable();
  renderSavedJobsList();
  renderResumeSection();
  setupResumeDropzone();
}

// 1. Profile Section
function renderProfileSection() {
  const user = window.CareerStore.getCurrentUser();

  const nameEl = document.getElementById("seeker-name");
  const titleEl = document.getElementById("seeker-title");
  const locationEl = document.getElementById("seeker-location");
  const emailEl = document.getElementById("seeker-email");
  const phoneEl = document.getElementById("seeker-phone");
  const bioEl = document.getElementById("seeker-bio");
  const skillsListEl = document.getElementById("seeker-skills-list");
  const avatarEl = document.getElementById("seeker-avatar");

  if (nameEl) nameEl.textContent = user.name || "Alex Morgan";
  if (titleEl) titleEl.textContent = user.title || "Senior Frontend Engineer";
  if (locationEl) locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${user.location || "San Francisco, CA"}`;
  if (emailEl) emailEl.innerHTML = `<i class="fa-solid fa-envelope"></i> ${user.email || "alex.morgan@example.com"}`;
  if (phoneEl) phoneEl.innerHTML = `<i class="fa-solid fa-phone"></i> ${user.phone || "+1 (555) 234-5678"}`;
  if (bioEl) bioEl.textContent = user.bio || "Passionate engineer...";
  
  if (avatarEl) {
    const initials = (user.name || "Alex Morgan").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }

  if (skillsListEl && user.skills) {
    skillsListEl.innerHTML = user.skills.map(s => `
      <span class="badge badge-blue" style="font-size:0.85rem; padding:0.35rem 0.8rem;">
        ${s}
      </span>
    `).join('');
  }
}

// 2. Summary Metrics
function renderDashboardStats() {
  const applications = window.CareerStore.getApplications();
  const savedJobs = window.CareerStore.getSavedJobs();
  const user = window.CareerStore.getCurrentUser();

  const interviewsCount = applications.filter(a => a.status.toLowerCase().includes("interview")).length;
  const appliedCount = applications.length;
  const savedCount = savedJobs.length;
  const atsScore = user.resume?.atsScore || 94;

  const appliedEl = document.getElementById("metric-applied-count");
  const savedEl = document.getElementById("metric-saved-count");
  const interviewsEl = document.getElementById("metric-interviews-count");
  const atsEl = document.getElementById("metric-ats-score");

  if (appliedEl) appliedEl.textContent = appliedCount;
  if (savedEl) savedEl.textContent = savedCount;
  if (interviewsEl) interviewsEl.textContent = interviewsCount;
  if (atsEl) atsEl.textContent = `${atsScore}%`;
}

// 3. Applied Jobs Table with Dynamic Badges
function renderAppliedJobsTable() {
  const container = document.getElementById("applied-jobs-table-body");
  const emptyEl = document.getElementById("applied-jobs-empty");
  const tableEl = document.getElementById("applied-jobs-table-wrapper");

  const applications = window.CareerStore.getApplications();

  if (!container) return;

  if (applications.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (tableEl) tableEl.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (tableEl) tableEl.style.display = "block";

  container.innerHTML = applications.map(app => {
    let badgeClass = "badge-blue";
    let icon = "fa-clock";
    if (app.status === "Interview Scheduled") {
      badgeClass = "badge-purple";
      icon = "fa-calendar-check";
    } else if (app.status === "Shortlisted") {
      badgeClass = "badge-green";
      icon = "fa-circle-check";
    } else if (app.status === "Offer Extended") {
      badgeClass = "badge-green";
      icon = "fa-trophy";
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--slate-900); font-size: 1rem;">${app.jobTitle}</div>
          <div style="color: var(--slate-500); font-size: 0.85rem;"><i class="fa-solid fa-building"></i> ${app.company}</div>
        </td>
        <td>
          <span style="color: var(--slate-600);"><i class="fa-regular fa-calendar"></i> ${app.appliedDate}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}" style="padding: 0.35rem 0.8rem;">
            <i class="fa-solid ${icon}"></i> ${app.status}
          </span>
        </td>
        <td style="max-width: 250px;">
          <span style="font-size: 0.85rem; color: var(--slate-500);">${app.notes || 'Application under hiring manager review.'}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openJobDetailsModal('${app.jobId}')" title="View Job Details">
            <i class="fa-solid fa-eye"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 4. Saved Jobs Grid
function renderSavedJobsList() {
  const container = document.getElementById("saved-jobs-grid");
  const emptyEl = document.getElementById("saved-jobs-empty");
  const savedJobs = window.CareerStore.getSavedJobs();

  if (!container) return;

  if (savedJobs.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    container.innerHTML = "";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  container.innerHTML = savedJobs.map(job => createJobCardHTML(job)).join('');
}

// 5. Resume Management
function renderResumeSection() {
  const user = window.CareerStore.getCurrentUser();
  const resume = user.resume || {
    name: "Alex_Morgan_Resume_2026.pdf",
    size: "248 KB",
    uploadDate: "Sep 25, 2026",
    atsScore: 94
  };

  const nameEl = document.getElementById("resume-filename");
  const metaEl = document.getElementById("resume-meta");
  const scoreEl = document.getElementById("resume-ats-badge");

  if (nameEl) nameEl.textContent = resume.name;
  if (metaEl) metaEl.textContent = `Uploaded on ${resume.uploadDate} • Size: ${resume.size}`;
  if (scoreEl) scoreEl.textContent = `ATS Score: ${resume.atsScore}/100`;
}

function setupResumeDropzone() {
  const dropzone = document.getElementById("resume-dropzone");
  const fileInput = document.getElementById("resume-file-input");

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleResumeUploadFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleResumeUploadFile(e.target.files[0]);
    }
  });
}

function handleResumeUploadFile(file) {
  const allowed = [".pdf", ".doc", ".docx"];
  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  
  if (!allowed.includes(extension)) {
    showToast("Please upload a PDF, DOC, or DOCX document", "error");
    return;
  }

  const formattedSize = file.size > 1024 * 1024 
    ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
    : (file.size / 1024).toFixed(0) + " KB";

  // Simulate smart ATS analysis score between 92 and 98
  const simulatedScore = Math.floor(Math.random() * 7) + 92;

  const updatedResume = {
    name: file.name,
    size: formattedSize,
    uploadDate: "Just now",
    atsScore: simulatedScore
  };

  window.CareerStore.updateUserProfile({ resume: updatedResume });
  renderResumeSection();
  renderDashboardStats();

  showToast(`Successfully uploaded ${file.name}! ATS Score: ${simulatedScore}%`, "success", 4000);
}

function simulateResumeDownload() {
  const user = window.CareerStore.getCurrentUser();
  const resume = user.resume || { name: "Alex_Morgan_Resume_2026.pdf" };

  // Create mock download link
  const dummyContent = `CareerConnect Resume Document\nCandidate: ${user.name}\nTitle: ${user.title}\nContact: ${user.email}`;
  const blob = new Blob([dummyContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = resume.name.replace(".pdf", ".txt");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded ${resume.name}`, "info");
}

function simulateResumeDelete() {
  if (confirm("Are you sure you want to remove your active resume?")) {
    window.CareerStore.updateUserProfile({
      resume: {
        name: "No_Resume_Uploaded.pdf",
        size: "0 KB",
        uploadDate: "N/A",
        atsScore: 0
      }
    });
    renderResumeSection();
    renderDashboardStats();
    showToast("Resume removed. Please upload an updated CV.", "info");
  }
}

// 6. Edit Profile Modal
function openEditProfileModal() {
  const user = window.CareerStore.getCurrentUser();

  let modal = document.getElementById("edit-profile-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "edit-profile-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Candidate Profile</h3>
        <button class="modal-close" onclick="closeModal('edit-profile-modal')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="edit-profile-form" onsubmit="handleSaveProfile(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="edit-name" class="form-control" value="${user.name || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Headline / Title *</label>
              <input type="text" id="edit-title" class="form-control" value="${user.title || ''}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="edit-email" class="form-control" value="${user.email || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="edit-phone" class="form-control" value="${user.phone || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" id="edit-location" class="form-control" value="${user.location || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Professional Bio</label>
            <textarea id="edit-bio" class="form-control" rows="3">${user.bio || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Skills (Comma-separated)</label>
            <input type="text" id="edit-skills" class="form-control" value="${(user.skills || []).join(', ')}" />
            <small style="color:var(--slate-400); font-size:0.8rem; margin-top:0.3rem; display:block;">Example: React, TypeScript, GraphQL, Python, Figma</small>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal('edit-profile-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add("open");
}

function handleSaveProfile(e) {
  e.preventDefault();
  const name = document.getElementById("edit-name").value;
  const title = document.getElementById("edit-title").value;
  const email = document.getElementById("edit-email").value;
  const phone = document.getElementById("edit-phone").value;
  const location = document.getElementById("edit-location").value;
  const bio = document.getElementById("edit-bio").value;
  const skillsRaw = document.getElementById("edit-skills").value;

  const skills = skillsRaw.split(",").map(s => s.trim()).filter(Boolean);

  window.CareerStore.updateUserProfile({
    name, title, email, phone, location, bio, skills
  });

  closeModal("edit-profile-modal");
  renderProfileSection();
  setupNavbarUser();
  showToast("Profile updated successfully!", "success");
}

// Tab Switching inside Dashboard (Applied, Saved, Resume)
function switchDashboardTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  const targetBtn = document.getElementById(`tab-btn-${tabId}`);
  const targetContent = document.getElementById(`tab-content-${tabId}`);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetContent) targetContent.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  initSeekerDashboard();

  // Handle URL hash tab if provided
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (tab && ["applied", "saved", "resume"].includes(tab)) {
    switchDashboardTab(tab);
  }
});
