/**
 * CareerConnect - Find Jobs Page Logic & Interactive Filtering Engine
 */

let activeFilters = {
  keyword: "",
  location: "",
  types: [],
  categories: [],
  experience: [],
  minSalary: 0,
  sortBy: "latest"
};

function initJobsPage() {
  // Parse query params from URL (e.g., from home hero search)
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  const loc = params.get("loc");
  const cat = params.get("cat");
  const type = params.get("type");

  if (q) {
    activeFilters.keyword = q;
    const input = document.getElementById("filter-keyword");
    if (input) input.value = q;
  }
  if (loc) {
    activeFilters.location = loc;
    const input = document.getElementById("filter-location");
    if (input) input.value = loc;
  }
  if (cat) {
    activeFilters.categories.push(cat);
    const checkbox = document.querySelector(`input[name="cat-filter"][value="${cat}"]`);
    if (checkbox) checkbox.checked = true;
  }
  if (type) {
    activeFilters.types.push(type);
    const checkbox = document.querySelector(`input[name="type-filter"][value="${type}"]`);
    if (checkbox) checkbox.checked = true;
  }

  // Setup event listeners
  setupFilterListeners();

  // Initial render
  applyJobFilters();
}

function setupFilterListeners() {
  // Keyword search
  const keywordInput = document.getElementById("filter-keyword");
  if (keywordInput) {
    keywordInput.addEventListener("input", (e) => {
      activeFilters.keyword = e.target.value.trim().toLowerCase();
      applyJobFilters();
    });
  }

  // Location search
  const locInput = document.getElementById("filter-location");
  if (locInput) {
    locInput.addEventListener("input", (e) => {
      activeFilters.location = e.target.value.trim().toLowerCase();
      applyJobFilters();
    });
  }

  // Job Types checkboxes
  const typeCheckboxes = document.querySelectorAll('input[name="type-filter"]');
  typeCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      activeFilters.types = Array.from(typeCheckboxes).filter(c => c.checked).map(c => c.value);
      applyJobFilters();
    });
  });

  // Categories checkboxes
  const catCheckboxes = document.querySelectorAll('input[name="cat-filter"]');
  catCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      activeFilters.categories = Array.from(catCheckboxes).filter(c => c.checked).map(c => c.value);
      applyJobFilters();
    });
  });

  // Experience checkboxes
  const expCheckboxes = document.querySelectorAll('input[name="exp-filter"]');
  expCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      activeFilters.experience = Array.from(expCheckboxes).filter(c => c.checked).map(c => c.value);
      applyJobFilters();
    });
  });

  // Salary range slider
  const salaryRange = document.getElementById("salary-range");
  const salaryVal = document.getElementById("salary-range-val");
  if (salaryRange && salaryVal) {
    salaryRange.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      activeFilters.minSalary = val;
      salaryVal.textContent = `$${(val / 1000).toFixed(0)}k+`;
      applyJobFilters();
    });
  }

  // Sort By
  const sortSelect = document.getElementById("jobs-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeFilters.sortBy = e.target.value;
      applyJobFilters();
    });
  }
}

function clearAllFilters() {
  activeFilters = {
    keyword: "",
    location: "",
    types: [],
    categories: [],
    experience: [],
    minSalary: 0,
    sortBy: "latest"
  };

  // Reset inputs in DOM
  const kw = document.getElementById("filter-keyword");
  if (kw) kw.value = "";
  const loc = document.getElementById("filter-location");
  if (loc) loc.value = "";

  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

  const salaryRange = document.getElementById("salary-range");
  const salaryVal = document.getElementById("salary-range-val");
  if (salaryRange) salaryRange.value = 0;
  if (salaryVal) salaryVal.textContent = "$0k+";

  const sortSelect = document.getElementById("jobs-sort-select");
  if (sortSelect) sortSelect.value = "latest";

  applyJobFilters();
  showToast("All filters cleared", "info");
}

function applyJobFilters() {
  const allJobs = window.CareerStore.getJobs();

  let filtered = allJobs.filter(job => {
    // Keyword match (title, company, description, requirements)
    if (activeFilters.keyword) {
      const kw = activeFilters.keyword;
      const titleMatch = job.title.toLowerCase().includes(kw);
      const companyMatch = job.company.toLowerCase().includes(kw);
      const descMatch = job.description.toLowerCase().includes(kw);
      const reqMatch = job.requirements?.some(r => r.toLowerCase().includes(kw));
      if (!titleMatch && !companyMatch && !descMatch && !reqMatch) return false;
    }

    // Location match
    if (activeFilters.location) {
      const loc = activeFilters.location;
      if (!job.location.toLowerCase().includes(loc)) return false;
    }

    // Types match (Full-time, Part-time, Remote, Internship)
    if (activeFilters.types.length > 0) {
      if (!activeFilters.types.includes(job.type)) return false;
    }

    // Categories match
    if (activeFilters.categories.length > 0) {
      if (!activeFilters.categories.includes(job.category)) return false;
    }

    // Experience match
    if (activeFilters.experience.length > 0) {
      if (!activeFilters.experience.includes(job.experience)) return false;
    }

    // Salary Min match
    if (activeFilters.minSalary > 0) {
      if ((job.salaryMax || 0) < activeFilters.minSalary) return false;
    }

    return true;
  });

  // Sorting
  if (activeFilters.sortBy === "salary-high") {
    filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
  } else if (activeFilters.sortBy === "salary-low") {
    filtered.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
  } else if (activeFilters.sortBy === "applicants") {
    filtered.sort((a, b) => (b.applicantsCount || 0) - (a.applicantsCount || 0));
  } else {
    // Default: Featured first, then array index
    filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  renderJobsList(filtered);
  renderActiveFilterChips();
  updateCategoryCounts();
}

function renderJobsList(jobs) {
  const container = document.getElementById("jobs-listings-grid");
  const countEl = document.getElementById("results-count-text");

  if (countEl) {
    countEl.textContent = `Showing ${jobs.length} Available Job${jobs.length === 1 ? '' : 's'}`;
  }

  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h3>No matching jobs found</h3>
        <p>Try tweaking your search keywords, lowering the salary filter, or resetting category selections.</p>
        <button class="btn btn-primary" onclick="clearAllFilters()">
          <i class="fa-solid fa-rotate-left"></i> Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = jobs.map(job => createJobCardHTML(job)).join('');
}

function renderActiveFilterChips() {
  const container = document.getElementById("active-filter-chips");
  if (!container) return;

  let chipsHTML = [];

  if (activeFilters.keyword) {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>Keyword: "${activeFilters.keyword}"</span>
        <button onclick="removeSpecificFilter('keyword')">&times;</button>
      </div>
    `);
  }

  if (activeFilters.location) {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>Loc: "${activeFilters.location}"</span>
        <button onclick="removeSpecificFilter('location')">&times;</button>
      </div>
    `);
  }

  activeFilters.types.forEach(t => {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>${t}</span>
        <button onclick="removeTypeFilter('${t}')">&times;</button>
      </div>
    `);
  });

  activeFilters.categories.forEach(c => {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>${c}</span>
        <button onclick="removeCategoryFilter('${c}')">&times;</button>
      </div>
    `);
  });

  activeFilters.experience.forEach(e => {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>${e}</span>
        <button onclick="removeExperienceFilter('${e}')">&times;</button>
      </div>
    `);
  });

  if (activeFilters.minSalary > 0) {
    chipsHTML.push(`
      <div class="filter-chip">
        <span>Salary: $${(activeFilters.minSalary / 1000).toFixed(0)}k+</span>
        <button onclick="removeSalaryFilter()">&times;</button>
      </div>
    `);
  }

  if (chipsHTML.length > 0) {
    chipsHTML.push(`
      <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.6rem; font-size:0.75rem;" onclick="clearAllFilters()">
        Clear All
      </button>
    `);
  }

  container.innerHTML = chipsHTML.join('');
}

function removeSpecificFilter(key) {
  if (key === "keyword") {
    activeFilters.keyword = "";
    const kw = document.getElementById("filter-keyword");
    if (kw) kw.value = "";
  } else if (key === "location") {
    activeFilters.location = "";
    const loc = document.getElementById("filter-location");
    if (loc) loc.value = "";
  }
  applyJobFilters();
}

function removeTypeFilter(type) {
  activeFilters.types = activeFilters.types.filter(t => t !== type);
  const cb = document.querySelector(`input[name="type-filter"][value="${type}"]`);
  if (cb) cb.checked = false;
  applyJobFilters();
}

function removeCategoryFilter(cat) {
  activeFilters.categories = activeFilters.categories.filter(c => c !== cat);
  const cb = document.querySelector(`input[name="cat-filter"][value="${cat}"]`);
  if (cb) cb.checked = false;
  applyJobFilters();
}

function removeExperienceFilter(exp) {
  activeFilters.experience = activeFilters.experience.filter(e => e !== exp);
  const cb = document.querySelector(`input[name="exp-filter"][value="${exp}"]`);
  if (cb) cb.checked = false;
  applyJobFilters();
}

function removeSalaryFilter() {
  activeFilters.minSalary = 0;
  const range = document.getElementById("salary-range");
  const val = document.getElementById("salary-range-val");
  if (range) range.value = 0;
  if (val) val.textContent = "$0k+";
  applyJobFilters();
}

function updateCategoryCounts() {
  const allJobs = window.CareerStore.getJobs();
  const counts = {};
  allJobs.forEach(j => {
    counts[j.category] = (counts[j.category] || 0) + 1;
    counts[j.type] = (counts[j.type] || 0) + 1;
  });

  document.querySelectorAll('[data-count-cat]').forEach(el => {
    const cat = el.getAttribute('data-count-cat');
    el.textContent = counts[cat] || 0;
  });

  document.querySelectorAll('[data-count-type]').forEach(el => {
    const type = el.getAttribute('data-count-type');
    el.textContent = counts[type] || 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initJobsPage();
});
