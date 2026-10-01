# CareerConnect — Modern Job Portal

A responsive and modern Job Portal web application built with HTML5, Vanilla CSS, and Vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Features

- **Sticky Navigation Bar:** Glassmorphism backdrop blur effect with responsive mobile drawer navigation.
- **Hero Section:** High-impact gradient typography, platform metrics counter, and multi-field job search.
- **Interactive Search & Filter Toolbar:**
  - Real-time job type filtering (*All Jobs, Full-time, Remote, Internship, Part-time*) with live badge counters.
  - Live in-section keyword search with instant debounced results.
  - Category selector dropdown and salary/featured sorting.
  - Instant reset button and friendly empty states.
- **Rich Job Cards:**
  - Detailed metadata including company logo, location, salary range, and job type badges.
  - Interactive "Save/Bookmark" button with local storage persistence.
  - "Quick View / Details" modal with role responsibilities, requirements, and benefits.
  - "Apply Now" interactive modal with resume attachment simulation and toast feedback.
- **Multi-Page Architecture:**
  - `index.html` — Homepage with Hero, Category grid, and Featured Jobs.
  - `jobs.html` — Full job catalog with extensive sidebar filter controls.
  - `companies.html` — World-class hiring companies directory.
  - `about.html` — About us, mission, and company milestones.
  - `contact.html` — Contact support form and FAQ.
  - `login.html` — Authentication simulation with Seeker and Recruiter roles.
  - `dashboard-seeker.html` & `dashboard-recruiter.html` — Role-specific management dashboards.

## 📁 Project Structure

```text
website 1/
├── index.html               # Main landing page (GitHub Pages root)
├── jobs.html                # Search catalog page
├── companies.html           # Companies directory
├── about.html               # About page
├── contact.html             # Contact page
├── login.html               # Login / Signup page
├── dashboard-seeker.html    # Job seeker dashboard
├── dashboard-recruiter.html # Recruiter dashboard
├── server.js                # Optional local development server
├── css/
│   └── styles.css           # Core design system and keyframe animations
└── js/
    ├── app.js               # Shared modals, toast alerts, and card renderers
    ├── data.js              # Client-side sample dataset and store
    ├── jobs.js              # Dedicated catalog filter controller
    ├── recruiter-dashboard.js
    └── seeker-dashboard.js
```

## 🌐 Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `career-connect`).
2. Upload all files from this directory to the repository root.
3. Go to **Settings** > **Pages**.
4. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
5. Click **Save**. Your website will be live at `https://<your-username>.github.io/<repository-name>/`.
