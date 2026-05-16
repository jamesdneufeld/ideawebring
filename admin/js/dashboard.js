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
// STATE
// -------------------------
let state = {
  search: "",
  statusFilter: "all",
  selectedCohorts: new Set(),
  selectedTags: new Set(),
  sortBy: "name",
  sortDirection: "asc",

  lastCommitRange: "all", // NEW
};

let allStudents = [];
let filteredStudents = [];

// -------------------------
// CONFIG
// -------------------------
async function loadDashboardConfig() {
  try {
    const res = await fetch("../config.json");
    if (res.ok) {
      const config = await res.json();
      setRepoConfig(config.repo.owner, config.repo.name);
    }
  } catch {
    console.log("Using default repo config");
  }
}

// -------------------------
// RENDER
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
// INIT
// -------------------------
async function init() {
  await loadDashboardConfig();

  const rawStudents = await loadStudentsJson();

  let processed = rawStudents.map(normalizeStudent);
  processed = processed.map(enrichWithUrls);

  const activities = await fetchActivityForAllStudents(processed);

  processed = processed.map((student, idx) => enrichWithActivity(student, activities[idx]));

  // IMPORTANT: ensure lastCommitDate is always available
  processed = processed.map((s, idx) => ({
    ...s,
    lastCommitDate: activities[idx]?.date || s.lastCommitDate || null,
  }));

  allStudents = processed;

  setupEventListeners();
  render();
}

// -------------------------
// EVENTS
// -------------------------
function setupEventListeners() {
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });

  document.querySelectorAll("#statusFilterGroup .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.statusFilter = btn.dataset.filter;

      document.querySelectorAll("#statusFilterGroup .filter-btn").forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      render();
    });
  });

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

  // 🔥 NEW: commit range filter
  document.getElementById("commitFilter")?.addEventListener("change", (e) => {
    state.lastCommitRange = e.target.value;
    render();
  });

  document.getElementById("exportCSVBtn")?.addEventListener("click", () => {
    exportToCSV(filteredStudents);
  });

  document.getElementById("refreshBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("refreshBtn");
    btn.textContent = "⟳ Loading...";

    const activities = await fetchActivityForAllStudents(allStudents);

    allStudents = allStudents.map((student, idx) => enrichWithActivity(student, activities[idx]));

    render();
    btn.textContent = "🔄 Refresh Activity";
  });
}

init();
