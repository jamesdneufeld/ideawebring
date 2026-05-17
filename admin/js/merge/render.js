// js/merge/render.js
// UI rendering — builds the editable student table (headers, rows, inputs, dropdowns, checkboxes)
// Updates preview JSON, shows/hides warning messages and editor section

import { getConfig } from "./config.js";

// Learning goal options (from signup form)
const LEARNING_GOAL_OPTIONS = [
  { value: "", label: "—" },
  { value: "practice", label: "Here for More Practice" },
  { value: "portfolio", label: "Portfolio Building" },
  { value: "indie_web", label: "Indie Web Explorer" },
  { value: "career_prep", label: "Career Prep" },
  { value: "returning_practice", label: "Returning for Practice" },
  { value: "learning_html_css", label: "Learning HTML & CSS" },
];

// Purpose options (primary reason for joining)
const PURPOSE_OPTIONS = [
  { value: "", label: "—" },
  { value: "practice", label: "Here for More Practice" },
  { value: "portfolio", label: "Portfolio Building" },
  { value: "indie_web", label: "Indie Web Explorer" },
  { value: "career_prep", label: "Career Prep" },
  { value: "returning_practice", label: "Returning for Practice" },
  { value: "learning_html_css", label: "Learning HTML & CSS" },
];

// Cohort options
const COHORT_OPTIONS = ["Summer 2024", "Summer 2025", "Summer 2026", "Summer 2027"];

// Entry type options
const ENTRY_TYPE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "returning", label: "Returning" },
];

export function renderTableHeader() {
  const thead = document.getElementById("tableHeader");

  if (!thead) return;

  thead.innerHTML = `
    <table>
      <th style="width: 30px;">✓</th>
      <th>Folder ID</th>
      <th>Display Name</th>
      <th>GitHub</th>
      <th>Status</th>
      <th>Entry Type</th>
      <th>Program</th>
      <th>Grad Year</th>
      <th>Cohort</th>
      <th>Purpose</th>
      <th>Joined Web Ring</th>
      <th>Joined Mentorship</th>
      <th>First Commit</th>
      <th>Last Commit</th>
      <th>Total Pushes</th>
      <th>Learning Goal</th>
      <th>Focus Areas</th>
      <th>Tools</th>
      <th>Former IDs</th>
      <th>Tags</th>
      <th>Resume Met</th>
    </tr>
  `;
}

export function renderTable(students, onUpdate) {
  const tbody = document.getElementById("studentTableBody");
  const config = getConfig();

  if (!tbody) return;

  tbody.innerHTML = "";

  students.forEach((student, idx) => {
    const row = tbody.insertRow();

    // Checkbox for selecting which students to update
    const selectCell = row.insertCell(0);
    selectCell.className = "checkbox-cell";
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.checked = student.selectedForFetch || false;
    selectCheckbox.addEventListener("change", (e) => onUpdate(idx, "selectedForFetch", e.target.checked));
    selectCell.appendChild(selectCheckbox);

    // Folder ID (read-only)
    const idCell = row.insertCell(1);
    idCell.textContent = student.id;
    idCell.style.color = "#8b949e";

    // Display Name (editable)
    const nameCell = row.insertCell(2);
    const nameInput = document.createElement("input");
    nameInput.value = student.displayName || "";
    nameInput.addEventListener("change", (e) => onUpdate(idx, "displayName", e.target.value));
    nameCell.appendChild(nameInput);

    // GitHub (editable)
    const githubCell = row.insertCell(3);
    const githubInput = document.createElement("input");
    githubInput.placeholder = "github username";
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim() || null));
    githubCell.appendChild(githubInput);

    // Status dropdown
    const statusCell = row.insertCell(4);
    const statusSelect = document.createElement("select");
    const statusOptions = ["student", "alumni", "withdrawn"];
    statusOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      if (student.status === opt) option.selected = true;
      statusSelect.appendChild(option);
    });
    statusSelect.addEventListener("change", (e) => onUpdate(idx, "status", e.target.value));
    statusCell.appendChild(statusSelect);

    // Entry Type dropdown
    const entryTypeCell = row.insertCell(5);
    const entryTypeSelect = document.createElement("select");
    ENTRY_TYPE_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.entryType === opt.value) option.selected = true;
      entryTypeSelect.appendChild(option);
    });
    entryTypeSelect.addEventListener("change", (e) => onUpdate(idx, "entryType", e.target.value));
    entryTypeCell.appendChild(entryTypeSelect);

    // Program dropdown
    const programCell = row.insertCell(6);
    const programSelect = document.createElement("select");
    (config.options?.programs || ["BDes", "IxD"]).forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.program === opt) option.selected = true;
      programSelect.appendChild(option);
    });
    programSelect.addEventListener("change", (e) => onUpdate(idx, "program", e.target.value));
    programCell.appendChild(programSelect);

    // Year dropdown
    const yearCell = row.insertCell(7);
    const yearSelect = document.createElement("select");
    yearSelect.className = "year-input";
    (config.options?.years || ["2024", "2025", "2026", "2027", "2028", "2029"]).forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.year === opt) option.selected = true;
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener("change", (e) => onUpdate(idx, "year", e.target.value));
    yearCell.appendChild(yearSelect);

    // Cohort dropdown
    const cohortCell = row.insertCell(8);
    const cohortSelect = document.createElement("select");
    COHORT_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.cohort === opt) option.selected = true;
      cohortSelect.appendChild(option);
    });
    cohortSelect.addEventListener("change", (e) => onUpdate(idx, "cohort", e.target.value));
    cohortCell.appendChild(cohortSelect);

    // Purpose dropdown
    const purposeCell = row.insertCell(9);
    const purposeSelect = document.createElement("select");
    PURPOSE_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.purpose === opt.value) option.selected = true;
      purposeSelect.appendChild(option);
    });
    purposeSelect.addEventListener("change", (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      onUpdate(idx, "purpose", value);
    });
    purposeCell.appendChild(purposeSelect);

    // Joined Web Ring (date picker)
    const joinedWebRingCell = row.insertCell(10);
    const joinedWebRingInput = document.createElement("input");
    joinedWebRingInput.type = "date";
    joinedWebRingInput.style.width = "110px";
    if (student.joinedWebRing) {
      const dateStr = student.joinedWebRing.split("T")[0];
      joinedWebRingInput.value = dateStr;
    }
    joinedWebRingInput.addEventListener("change", (e) => {
      onUpdate(idx, "joinedWebRing", e.target.value || null);
    });
    joinedWebRingCell.appendChild(joinedWebRingInput);

    // Joined Mentorship (date picker)
    const joinedMentorshipCell = row.insertCell(11);
    const joinedMentorshipInput = document.createElement("input");
    joinedMentorshipInput.type = "date";
    joinedMentorshipInput.style.width = "110px";
    if (student.joinedMentorship) {
      const dateStr = student.joinedMentorship.split("T")[0];
      joinedMentorshipInput.value = dateStr;
    }
    joinedMentorshipInput.addEventListener("change", (e) => {
      onUpdate(idx, "joinedMentorship", e.target.value || null);
    });
    joinedMentorshipCell.appendChild(joinedMentorshipInput);

    // First Commit Date (date picker)
    const firstCommitCell = row.insertCell(12);
    const firstCommitInput = document.createElement("input");
    firstCommitInput.type = "date";
    firstCommitInput.style.width = "110px";
    if (student.firstCommitDate) {
      const dateStr = student.firstCommitDate.split("T")[0];
      firstCommitInput.value = dateStr;
    }
    firstCommitInput.addEventListener("change", (e) => {
      onUpdate(idx, "firstCommitDate", e.target.value || null);
    });
    firstCommitCell.appendChild(firstCommitInput);

    // Last Commit Date (date picker)
    const lastCommitCell = row.insertCell(13);
    const lastCommitInput = document.createElement("input");
    lastCommitInput.type = "date";
    lastCommitInput.style.width = "110px";
    if (student.lastCommitDate) {
      const dateStr = student.lastCommitDate.split("T")[0];
      lastCommitInput.value = dateStr;
    }
    lastCommitInput.addEventListener("change", (e) => {
      onUpdate(idx, "lastCommitDate", e.target.value || null);
    });
    lastCommitCell.appendChild(lastCommitInput);

    // Total Pushes (editable number)
    const pushesCell = row.insertCell(14);
    const pushesInput = document.createElement("input");
    pushesInput.type = "number";
    pushesInput.value = student.totalPushes !== undefined ? student.totalPushes : 0;
    pushesInput.style.width = "70px";
    pushesInput.addEventListener("change", (e) => {
      const val = parseInt(e.target.value) || 0;
      onUpdate(idx, "totalPushes", val);
    });
    pushesCell.appendChild(pushesInput);

    // Learning Goal dropdown
    const learningGoalCell = row.insertCell(15);
    const learningGoalSelect = document.createElement("select");
    LEARNING_GOAL_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.learningGoal === opt.value) option.selected = true;
      learningGoalSelect.appendChild(option);
    });
    learningGoalSelect.addEventListener("change", (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      onUpdate(idx, "learningGoal", value);
    });
    learningGoalCell.appendChild(learningGoalSelect);

    // Focus Areas (comma-separated text input)
    const focusAreasCell = row.insertCell(16);
    const focusAreasInput = document.createElement("input");
    focusAreasInput.type = "text";
    focusAreasInput.placeholder = "comma separated focus areas";
    focusAreasInput.value = (student.focusAreas || []).join(", ");
    focusAreasInput.style.width = "150px";
    focusAreasInput.addEventListener("change", (e) => {
      const areasArray = e.target.value
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      onUpdate(idx, "focusAreas", areasArray);
    });
    focusAreasCell.appendChild(focusAreasInput);

    // Tools (comma-separated text input)
    const toolsCell = row.insertCell(17);
    const toolsInput = document.createElement("input");
    toolsInput.type = "text";
    toolsInput.placeholder = "comma separated tools";
    toolsInput.value = (student.tools || []).join(", ");
    toolsInput.style.width = "150px";
    toolsInput.addEventListener("change", (e) => {
      const toolsArray = e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      onUpdate(idx, "tools", toolsArray);
    });
    toolsCell.appendChild(toolsInput);

    // Former IDs (comma-separated text input)
    const formerIdsCell = row.insertCell(18);
    const formerIdsInput = document.createElement("input");
    formerIdsInput.type = "text";
    formerIdsInput.placeholder = "comma separated former folder names";
    formerIdsInput.value = (student.formerIds || []).join(", ");
    formerIdsInput.style.width = "150px";
    formerIdsInput.addEventListener("change", (e) => {
      const idsArray = e.target.value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      onUpdate(idx, "formerIds", idsArray);
    });
    formerIdsCell.appendChild(formerIdsInput);

    // Tags (comma-separated text input)
    const tagsCell = row.insertCell(19);
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "comma separated tags";
    tagsInput.value = (student.tags || []).join(", ");
    tagsInput.addEventListener("change", (e) => {
      const tagsArray = e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      onUpdate(idx, "tags", tagsArray);
    });
    tagsCell.appendChild(tagsInput);

    // Resume checkbox
    const resumeCell = row.insertCell(20);
    resumeCell.className = "checkbox-cell";
    const resumeCheckbox = document.createElement("input");
    resumeCheckbox.type = "checkbox";
    resumeCheckbox.checked = student.resumeRequirementMet || false;
    resumeCheckbox.addEventListener("change", (e) => onUpdate(idx, "resumeRequirementMet", e.target.checked));
    resumeCell.appendChild(resumeCheckbox);
  });
}

export function updateUIFromConfig() {
  const config = getConfig();
  const ui = config.ui || {};

  const titleEl = document.getElementById("pageTitle");
  const subheadEl = document.getElementById("pageSubhead");
  const excludeEl = document.getElementById("excludeHint");

  if (titleEl) {
    titleEl.textContent = ui.title || "Web Ring Admin";
  }

  if (subheadEl) {
    subheadEl.textContent = ui.subhead || "Ranked rule-based identity reconciliation";
  }

  if (excludeEl) {
    excludeEl.textContent = config.excludeFolders?.length ? `🚫 Auto-excluded: ${config.excludeFolders.join(", ")}` : "🚫 No folders excluded";
  }
}

export function showWarning(message) {
  const el = document.getElementById("warningBox");
  if (!el) return;
  el.classList.remove("hidden");
  el.innerHTML = message;
}

export function hideWarning() {
  const el = document.getElementById("warningBox");
  if (!el) return;
  el.classList.add("hidden");
}

export function showEditor() {
  const el = document.getElementById("editorSection");
  if (el) el.classList.remove("hidden");
}

export function renderPreview(students) {
  const output = {
    lastUpdated: new Date().toISOString().split("T")[0],
    students,
  };

  const el = document.getElementById("output");
  if (el) {
    el.textContent = JSON.stringify(output, null, 2);
  }
}
