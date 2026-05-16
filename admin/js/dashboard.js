/// js/dashboard.js
/// SAFE DATA PIPELINE ORCHESTRATOR

import { loadStudentsJson } from "./data.js";
import { normalizeStudent, enrichWithUrls, enrichWithActivity } from "../lib/student.js";

import { fetchActivityForAllStudents, setRepoConfig } from "./github.js";

import { filterStudents, sortStudents } from "./filters.js";

import { computeStats } from "./stats.js";
import { exportToCSV } from "./export.js";
import { renderStats, renderStudentGrid } from "./render.js";

// =========================
// SAFE STATE
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
// SAFETY: required fields check
// =========================
function validateStudent(student, stage) {
  const required = ["id", "displayName", "program", "year"];

  for (const key of required) {
    if (student[key] === undefined) {
      console.warn(`[PIPELINE WARNING] Missing field "${key}" at stage: ${stage}`, student);
    }
  }
}

// =========================
// CONFIG
// =========================
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

// =========================
// RENDER
// =========================
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

// =========================
// SAFE PIPELINE CORE
// =========================
async function init() {
  await loadDashboardConfig();

  const rawStudents = await loadStudentsJson();

  // STEP 1: normalize (must preserve ALL fields)
  let processed = rawStudents.map((s) => {
    const student = normalizeStudent(s);
    validateStudent(student, "normalize");
    return student;
  });

  // STEP 2: enrich URLs (must NOT replace object)
  processed = processed.map((s) => {
    const student = enrichWithUrls(s);
    validateStudent(student, "enrichWithUrls");
    return student;
  });

  // STEP 3: fetch activity
  const activities = await fetchActivityForAllStudents(processed);

  // STEP 4: merge activity safely
  processed = processed.map((student, idx) => {
    const enriched = enrichWithActivity(student, activities[idx]);
    validateStudent(enriched, "enrichWithActivity");
    return enriched;
  });

  allStudents = processed;

  setupEventListeners();
  render();
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
    btn.textContent = "⟳ Loading...";

    const activities = await fetchActivityForAllStudents(allStudents);

    allStudents = allStudents.map((s, idx) => enrichWithActivity(s, activities[idx]));

    render();
    btn.textContent = "🔄 Refresh Activity";
  });
}

// START
init();
