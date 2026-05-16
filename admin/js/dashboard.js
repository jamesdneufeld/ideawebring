// js/dashboard.js
// Main entry point — orchestrates all modules

import { loadStudentsJson } from "./data.js";
import { normalizeStudent, enrichWithUrls, enrichWithActivity } from "../lib/student.js";

import { fetchActivityForAllStudents, setRepoConfig } from "./github.js";

import { filterStudents, sortStudents } from "./filters.js";

import { computeStats } from "./stats.js";
import { exportToCSV } from "./export.js";
import { renderStats, renderStudentGrid } from "./render.js";

// Application state
let state = {
  search: "",
  statusFilter: "all",
  selectedCohorts: new Set(),
  selectedTags: new Set(),
  sortBy: "name",
  sortDirection: "asc",
};

let allStudents = [];
let filteredStudents = [];

// Load config for repo owner/name
async function loadDashboardConfig() {
  try {
    const res = await fetch("../config.json");
    if (res.ok) {
      const config = await res.json();
      setRepoConfig(config.repo.owner, config.repo.name);
    }
  } catch (err) {
    console.log("Using default repo config");
  }
}

// Render everything
function render() {
  const filtered = filterStudents(allStudents, state);
  const sorted = sortStudents(filtered, state.sortBy, state.sortDirection);

  filteredStudents = sorted;

  const stats = computeStats(allStudents);

  renderStats(stats, (filter) => {
    state.statusFilter = filter;
    render();
  });

  renderStudentGrid(sorted, "studentGrid");
}

// Load data and initialize
async function init() {
  await loadDashboardConfig();

  // Load raw data
  const rawStudents = await loadStudentsJson();

  // Normalize
  let processed = rawStudents.map(normalizeStudent);

  // Add URLs
  processed = processed.map(enrichWithUrls);

  // Fetch GitHub activity (NO local filtering)
  const activities = await fetchActivityForAllStudents(processed);

  // Merge activity safely by index
  processed = processed.map((student, idx) => enrichWithActivity(student, activities[idx]));

  allStudents = processed;

  setupEventListeners();
  render();
}

function setupEventListeners() {
  // Search
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });

  // Status filters
  document.querySelectorAll("#statusFilterGroup .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.statusFilter = btn.dataset.filter;

      document.querySelectorAll("#statusFilterGroup .filter-btn").forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      render();
    });
  });

  // Sort buttons
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sort = btn.dataset.sort;

      if (state.sortBy === sort) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = sort;
        state.sortDirection = "asc";
      }

      render();
    });
  });

  // Export CSV
  document.getElementById("exportCSVBtn")?.addEventListener("click", () => {
    exportToCSV(filteredStudents);
  });

  // Refresh activity
  document.getElementById("refreshBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("refreshBtn");
    btn.textContent = "⟳ Loading...";

    const activities = await fetchActivityForAllStudents(allStudents);

    allStudents = allStudents.map((student, idx) => enrichWithActivity(student, activities[idx]));

    render();
    btn.textContent = "🔄 Refresh Activity";
  });
}

// Start
init();
