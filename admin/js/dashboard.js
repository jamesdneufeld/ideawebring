// js/dashboard.js
// Main entry point — orchestrates all modules

import { loadStudentsJson } from "./data.js";
import { normalizeStudent, enrichWithUrls, enrichWithActivity } from "../lib/student.js";

import { fetchActivityForAllStudents, setRepoConfig } from "./github.js";

import { filterStudents, sortStudents } from "./filters.js";

import { computeStats } from "./stats.js";
import { exportToCSV } from "./export.js";
import { renderStats, renderStudentGrid } from "./render.js";

// -------------------------
// Application state
// -------------------------
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

// -------------------------
// Load config
// -------------------------
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

// -------------------------
// Render pipeline
// -------------------------
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

// -------------------------
// Init
// -------------------------
async function init() {
  await loadDashboardConfig();

  const rawStudents = await loadStudentsJson();

  // Normalize → enrich pipeline
  let processed = rawStudents.map(normalizeStudent);
  processed = processed.map(enrichWithUrls);

  // GitHub activity
  const activities = await fetchActivityForAllStudents(processed);

  processed = processed.map((student, idx) => enrichWithActivity(student, activities[idx]));

  // 🔥 SINGLE SOURCE OF TRUTH LAYER (IMPORTANT FIX)
  processed = processed.map((student) => ({
    ...student,
    state: buildStudentState(student),
  }));

  allStudents = processed;

  setupEventListeners();
  render();
}

// -------------------------
// 🔥 CENTRAL STATE BUILDER (fixes your "all active" bug)
// -------------------------
function buildStudentState(student) {
  const lifecycle = student.withdrawn ? "withdrawn" : student.isAlumni ? "alumni" : "student";

  const activity = student.activity?.status || "dormant";

  return {
    lifecycle,
    activity,

    // UI-safe derived flags
    isVisible: !student.withdrawn,
    isActiveParticipant: activity === "active",
    isEngaged: activity === "active" || activity === "recent",
  };
}

// -------------------------
// Event listeners
// -------------------------
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

  // Sort
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

// -------------------------
// Start
// -------------------------
init();
