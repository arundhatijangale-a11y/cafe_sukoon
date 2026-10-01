/**
 * CareerConnect - Recruiter Dashboard Controller
 * Manages Recruiter Profile, Post a Job form, Active Job Listings, and Candidate Applications.
 */

function initRecruiterDashboard() {
  renderRecruiterProfile();
  renderRecruiterStats();
  renderManageJobsTable();
  renderCandidatesTable();
  setupPostJobForm();
}

function renderRecruiterProfile() {
  const user = window.CareerStore.getCurrentUser();
  const nameEl = document.getElementById("recruiter-name");
  const titleEl = document.getElementById("recruiter-title");
  const companyEl = document.getElementById("recruiter-company");
  const emailEl = document.getElementById("recruiter-email");
  const locationEl = document.getElementById("recruiter-location");

  if (nameEl) nameEl.textContent = user.name || "Sarah Jenkins";
  if (titleEl) titleEl.textContent = user.title || "Head of Technical Talent";
  if (companyEl) companyEl.innerHTML = `<i class="fa-solid fa-building"></i> ${user.company || 'TechCorp Global & Partners'}`;
  if (emailEl) emailEl.innerHTML = `<i class="fa-solid fa-envelope"></i> ${user.email || 'sarah.jenkins@techcorp.io'}`;
  if (locationEl) locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${user.location || 'New York, NY'}`;
}

function renderRecruiterStats() {
  const jobs = window.CareerStore.getJobs();
  const candidates = window.CareerStore.getCandidates();

  const totalCandidates = candidates.length;
  const shortlisted = candidates.filter(c => c.status === "Shortlisted" || c.status === "Offer Extended").length;
  const interviews = candidates.filter(c => c.status === "Interview Scheduled").length;

  const totalJobsEl = document.getElementById("rec-stat-jobs");
  const totalCandEl = document.getElementById("rec-stat-candidates");
  const shortlistedEl = document.getElementById("rec-stat-shortlisted");
  const interviewsEl = document.getElementById("rec-stat-interviews");

  if (totalJobsEl) totalJobsEl.textContent = jobs.length;
  if (totalCandEl) totalCandEl.textContent = totalCandidates;
  if (shortlistedEl) shortlistedEl.textContent = shortlisted;
  if (interviewsEl) interviewsEl.textContent = interviews;
}

// 1. Manage Job Listings Table
function renderManageJobsTable() {
  const container = document.getElementById("rec-jobs-table-body");
  const jobs = window.CareerStore.getJobs();

  if (!container) return;

  container.innerHTML = jobs.map(job => `
    <tr>
      <td>
        <div style="font-weight:700; color:var(--slate-900); font-size:1rem;">${job.title}</div>
        <div style="color:var(--slate-500); font-size:0.85rem;"><i class="fa-solid fa-location-dot"></i> ${job.location} &bull; ${job.type}</div>
      </td>
      <td>
        <span class="badge badge-slate">${job.category}</span>
      </td>
      <td>
        <span style="font-weight:600; color:var(--slate-800);">${job.salary}</span>
      </td>
      <td>
        <span class="badge badge-blue">
          <i class="fa-solid fa-users"></i> ${job.applicantsCount || 0} Applicants
        </span>
      </td>
      <td>
        <span class="badge badge-green"><i class="fa-solid fa-circle-dot"></i> Active</span>
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm btn-outline" onclick="openJobDetailsModal('${job.id}')" title="Preview Listing">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:#fecaca;" onclick="handleDeleteJobListing('${job.id}')" title="Remove Listing">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handleDeleteJobListing(jobId) {
  if (confirm("Are you sure you want to delete this job listing?")) {
    window.CareerStore.deleteJob(jobId);
    renderManageJobsTable();
    renderRecruiterStats();
    showToast("Job listing removed successfully", "info");
  }
}

// 2. Candidates Management Table
function renderCandidatesTable() {
  const container = document.getElementById("rec-candidates-table-body");
  const candidates = window.CareerStore.getCandidates();

  if (!container) return;

  container.innerHTML = candidates.map(cand => {
    let badgeClass = "badge-blue";
    if (cand.status === "Shortlisted") badgeClass = "badge-purple";
    if (cand.status === "Interview Scheduled") badgeClass = "badge-green";
    if (cand.status === "Offer Extended") badgeClass = "badge-green";
    if (cand.status === "Rejected") badgeClass = "badge-slate";

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div class="user-avatar-mini" style="background:var(--accent-gradient); width:36px; height:36px;">
              ${cand.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
            </div>
            <div>
              <div style="font-weight:700; color:var(--slate-900); font-size:0.95rem;">${cand.name}</div>
              <div style="color:var(--slate-500); font-size:0.83rem;">${cand.email}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight:600; font-size:0.9rem;">${cand.role}</div>
          <div style="font-size:0.8rem; color:var(--slate-400);">Applied ${cand.appliedDate}</div>
        </td>
        <td>
          <span class="badge badge-purple" style="font-size:0.82rem;"><i class="fa-solid fa-bolt"></i> ${cand.matchScore || '92%'}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="simulateCandidateResumeView('${cand.resumeName || 'Candidate_Resume.pdf'}')" style="padding:0.25rem 0.6rem; font-size:0.8rem;">
            <i class="fa-solid fa-file-pdf" style="color:var(--danger);"></i> View CV
          </button>
        </td>
        <td>
          <select class="sort-select" style="padding:0.35rem 0.6rem; font-size:0.83rem;" onchange="handleCandidateStatusChange('${cand.id}', this.value)">
            <option value="Under Review" ${cand.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
            <option value="Shortlisted" ${cand.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="Interview Scheduled" ${cand.status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
            <option value="Offer Extended" ${cand.status === 'Offer Extended' ? 'selected' : ''}>Offer Extended</option>
            <option value="Rejected" ${cand.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

function handleCandidateStatusChange(candidateId, newStatus) {
  window.CareerStore.updateCandidateStatus(candidateId, newStatus);
  renderRecruiterStats();
  showToast(`Applicant status updated to: ${newStatus}`, "success");
}

function simulateCandidateResumeView(filename) {
  showToast(`Previewing resume: ${filename}`, "info");
}

// 3. Post a Job Form Submission
function setupPostJobForm() {
  const form = document.getElementById("post-job-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("post-job-title").value;
    const company = document.getElementById("post-job-company").value;
    const location = document.getElementById("post-job-location").value;
    const type = document.getElementById("post-job-type").value;
    const category = document.getElementById("post-job-category").value;
    const experience = document.getElementById("post-job-experience").value;
    const salary = document.getElementById("post-job-salary").value;
    const minSalary = document.getElementById("post-job-min-salary").value || 100000;
    const maxSalary = document.getElementById("post-job-max-salary").value || 150000;
    const description = document.getElementById("post-job-desc").value;
    const responsibilitiesRaw = document.getElementById("post-job-resp").value;
    const requirementsRaw = document.getElementById("post-job-reqs").value;
    const benefitsRaw = document.getElementById("post-job-benefits").value;
    const featured = document.getElementById("post-job-featured")?.checked || false;

    const responsibilities = responsibilitiesRaw.split("\n").map(r => r.trim()).filter(Boolean);
    const requirements = requirementsRaw.split("\n").map(r => r.trim()).filter(Boolean);
    const benefits = benefitsRaw.split("\n").map(b => b.trim()).filter(Boolean);

    const newJob = window.CareerStore.addJob({
      title,
      company,
      location,
      type,
      category,
      experience,
      salary,
      salaryMin: Number(minSalary),
      salaryMax: Number(maxSalary),
      description,
      responsibilities: responsibilities.length > 0 ? responsibilities : ["Collaborate on cutting-edge engineering initiatives.", "Maintain code quality and comprehensive test coverage."],
      requirements: requirements.length > 0 ? requirements : ["3+ years relevant tech experience", "Strong system design capabilities"],
      benefits: benefits.length > 0 ? benefits : ["Comprehensive medical", "Flexible work hours", "Home office stipend"],
      featured
    });

    form.reset();
    showToast(`🎉 "${newJob.title}" posted successfully! Live on Find Jobs page.`, "success", 4500);

    // Switch to manage jobs tab
    switchRecruiterTab("manage");
    renderManageJobsTable();
    renderRecruiterStats();
  });
}

function switchRecruiterTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  const targetBtn = document.getElementById(`rec-tab-btn-${tabId}`);
  const targetContent = document.getElementById(`rec-tab-content-${tabId}`);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetContent) targetContent.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  initRecruiterDashboard();
});
