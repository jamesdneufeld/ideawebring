// js/dashboard.js
// Main entry point — SAFE PIPELINE VERSION

import { loadStudentsJson } from "./data.js";
import { normalizeStudent, enrichWithUrls, enrichWithActivity } from "../lib/student.js";

import { fetchActivityForAllStudents, setRepoConfig } from "./github.js";

import { filterStudents, sortStudents } from "./filters.js";

import { computeStats } from "./stats.js";
import { exportToCSV } from "./export.js";
import { renderStats, renderStudentGrid } from "./render.js";

// =========================
// STATE
// =========================
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

// =========================
// CONFIG
// =========================
async function loadDashboardConfig() {
  try {
    const res = await fetch("../config.json");
    if (!res.ok) return;

    const config = await res.json();
    setRepoConfig(config.repo.owner, config.repo.name);
  } catch (err) {
    console.log("Using default repo config");
  }
}

// =========================
// RENDER PIPELINE
// =========================
function render() {
  if (!Array.isArray(allStudents)) return;

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

// =========================
// INIT (SAFE)
// =========================
async function init() {
  try {
    await loadDashboardConfig();

    const rawStudents = await loadStudentsJson();

    if (!Array.isArray(rawStudents)) {
      throw new Error("students.json must return an array");
    }

    // PIPELINE
    let processed = rawStudents.map(normalizeStudent);
    processed = processed.map(enrichWithUrls);

    const activities = await fetchActivityForAllStudents(processed);

    processed = processed.map((student, idx) => enrichWithActivity(student, activities[idx]));

    allStudents = processed;

    setupEventListeners();
    render();
  } catch (err) {
    console.error("Dashboard failed:", err);

    const grid = document.getElementById("studentGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="no-results">
          ⚠️ Failed to load dashboard data
        </div>
      `;
    }
  }
}

// =========================
// EVENTS
// =========================
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

  document.getElementById("exportCSVBtn")?.addEventListener("click", () => {
    exportToCSV(filteredStudents);
  });

  document.getElementById("refreshBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("refreshBtn");
    if (!btn) return;

    btn.textContent = "⟳ Loading...";

    const activities = await fetchActivityForAllStudents(allStudents);

    allStudents = allStudents.map((s, idx) => enrichWithActivity(s, activities[idx]));

    render();
    btn.textContent = "🔄 Refresh Activity";
  });
}

// START
init();
