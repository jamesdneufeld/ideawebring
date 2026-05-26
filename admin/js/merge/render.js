// js/merge/render.js
// UI rendering — builds the editable student table (headers, rows, inputs, dropdowns, checkboxes)
// Updates preview JSON, shows/hides warning messages and editor section
// Supports clicking on table headers to sort columns

import { getConfig } from "./config.js";

// Grad year options
const YEAR_OPTIONS = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

// Learning goal options (from signup form)
const LEARNING_GOAL_OPTIONS = [
  { value: "", label: "—" },
  { value: "practice", label: "Here for More Practice" },
  { value: "portfolio", label: "Portfolio Building" },
  { value: "indie_web", label: "Indie Web Explorer" },
  { value: "career_prep", label: "Career Prep" },
  { value: "learning_html_css", label: "Learning HTML & CSS" },
];

// Purpose options (primary reason for joining)
const PURPOSE_OPTIONS = [
  { value: "", label: "—" },
  { value: "learning_basics", label: "Learning HTML & CSS" },
  { value: "learning_foundations", label: "Building Core Concepts" },
  { value: "learning_responsive", label: "Exploring Responsive Design" },
  { value: "practice_build", label: "Building Projects" },
  { value: "practice_refine", label: "Refining Skills" },
  { value: "explorer", label: "Confident with DevTools" },
  { value: "indie_web", label: "Indie Web Explorer" },
  { value: "portfolio", label: "Portfolio Building" },
  { value: "career_prep", label: "Career Prep" },
  { value: "coursework", label: "Required Coursework" },
];

// Cohort options
const COHORT_OPTIONS = ["Summer 2024", "Summer 2025", "Summer 2026", "Summer 2027", "Summer 2028"];

// Entry type options
const ENTRY_TYPE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "returning", label: "Returning" },
  { value: "past", label: "Past Participant" },
  { value: "coursework", label: "Coursework Participant" },
];

// Learning stage options
const LEARNING_STAGE_OPTIONS = [
  { value: "early", label: "Early Stage" },
  { value: "developing", label: "Developing" },
  { value: "advanced", label: "Advanced" },
];

// Column configuration for sorting
const COLUMNS = [
  { key: "select", label: "✓", sortable: false, width: "30px" },
  { key: "id", label: "Folder ID", sortable: true },
  { key: "displayName", label: "Display Name", sortable: true },
  { key: "githubUsername", label: "GitHub", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "entryType", label: "Entry Type", sortable: true },
  { key: "program", label: "Program", sortable: true },
  { key: "year", label: "Grad Year", sortable: true },
  { key: "cohort", label: "Cohort", sortable: true },
  { key: "purpose", label: "Purpose", sortable: true },
  { key: "learningStage", label: "Learning Stage", sortable: true },
  { key: "joinedWebRing", label: "Joined Web Ring", sortable: true },
  { key: "joinedMentorship", label: "Joined Mentorship", sortable: true },
  { key: "firstCommitDate", label: "First Commit", sortable: true },
  { key: "lastCommitDate", label: "Last Commit", sortable: true },
  { key: "totalPushes", label: "Total Pushes", sortable: true },
  { key: "learningGoal", label: "Learning Goal", sortable: true },
  { key: "focusAreas", label: "Focus Areas", sortable: false },
  { key: "tools", label: "Tools", sortable: false },
  { key: "formerIds", label: "Former IDs", sortable: false },
  { key: "tags", label: "Tags", sortable: false },
  { key: "resumeMet", label: "Resume Met", sortable: true },
];

// Sort state
let currentSortColumn = null;
let currentSortDirection = "asc";

export function setSortState(column, direction) {
  currentSortColumn = column;
  currentSortDirection = direction;
}

export function getSortState() {
  return { column: currentSortColumn, direction: currentSortDirection };
}

export function renderTableHeader(onSort) {
  const thead = document.getElementById("tableHeader");

  if (!thead) return;

  thead.innerHTML = `
    <table>
      ${COLUMNS.map(
        (col) => `
        <th style="${col.width ? `width: ${col.width};` : ""}" 
            data-column="${col.key}"
            class="${col.sortable ? "sortable" : ""}">
          ${col.label}
          ${col.sortable && currentSortColumn === col.key ? (currentSortDirection === "asc" ? " ▲" : " ▼") : ""}
        </th>
      `,
      ).join("")}
    </table>
  `;

  // Add click event listeners to sortable headers
  if (onSort) {
    document.querySelectorAll("#tableHeader th.sortable").forEach((th) => {
      th.removeEventListener("click", th._sortHandler);
      th._sortHandler = () => {
        const column = th.dataset.column;
        if (currentSortColumn === column) {
          currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
        } else {
          currentSortColumn = column;
          currentSortDirection = "asc";
        }
        onSort(currentSortColumn, currentSortDirection);
      };
      th.addEventListener("click", th._sortHandler);
    });
  }
}

export function renderTable(students, onUpdate) {
  const tbody = document.getElementById("studentTableBody");
  const config = getConfig();

  if (!tbody) return;

  tbody.innerHTML = "";

  students.forEach((student, idx) => {
    const row = tbody.insertRow();

    // Column 0: Checkbox
    const selectCell = row.insertCell(0);
    selectCell.className = "checkbox-cell";
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.checked = student.selectedForFetch || false;
    selectCheckbox.addEventListener("change", (e) => onUpdate(idx, "selectedForFetch", e.target.checked));
    selectCell.appendChild(selectCheckbox);

    // Column 1: Folder ID with folder icon (read-only)
    const idCell = row.insertCell(1);
    idCell.innerHTML = `📁 ${student.id}`;
    idCell.style.color = "#8b949e";

    // Column 2: Display Name (editable)
    const nameCell = row.insertCell(2);
    const nameInput = document.createElement("input");
    nameInput.value = student.displayName || "";
    nameInput.addEventListener("change", (e) => onUpdate(idx, "displayName", e.target.value));
    nameCell.appendChild(nameInput);

    // Column 3: GitHub (editable)
    const githubCell = row.insertCell(3);
    const githubInput = document.createElement("input");
    githubInput.placeholder = "github username";
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim() || null));
    githubCell.appendChild(githubInput);

    // Column 4: Status dropdown
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

    // Column 5: Entry Type dropdown
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

    // Column 6: Program dropdown
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

    // Column 7: Year dropdown
    const yearCell = row.insertCell(7);
    const yearSelect = document.createElement("select");
    yearSelect.className = "year-input";
    YEAR_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (String(student.year) === String(opt)) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener("change", (e) => {
      console.log(`📅 Year change event for ${student.id}: ${student.year} → ${e.target.value}`);
      onUpdate(idx, "year", e.target.value);
    });
    yearCell.appendChild(yearSelect);

    // Column 8: Cohort dropdown
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

    // Column 9: Purpose dropdown
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

    // Column 10: Learning Stage dropdown
    const learningStageCell = row.insertCell(10);
    const learningStageSelect = document.createElement("select");
    LEARNING_STAGE_OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.learning_stage === opt.value) option.selected = true;
      learningStageSelect.appendChild(option);
    });
    learningStageSelect.addEventListener("change", (e) => onUpdate(idx, "learning_stage", e.target.value));
    learningStageCell.appendChild(learningStageSelect);

    // Column 11: Joined Web Ring (date picker)
    const joinedWebRingCell = row.insertCell(11);
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

    // Column 12: Joined Mentorship (date picker)
    const joinedMentorshipCell = row.insertCell(12);
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

    // Column 13: First Commit Date (date picker)
    const firstCommitCell = row.insertCell(13);
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

    // Column 14: Last Commit Date (date picker)
    const lastCommitCell = row.insertCell(14);
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

    // Column 15: Total Pushes (editable number)
    const pushesCell = row.insertCell(15);
    const pushesInput = document.createElement("input");
    pushesInput.type = "number";
    pushesInput.value = student.totalPushes !== undefined ? student.totalPushes : 0;
    pushesInput.style.width = "70px";
    pushesInput.addEventListener("change", (e) => {
      const val = parseInt(e.target.value) || 0;
      onUpdate(idx, "totalPushes", val);
    });
    pushesCell.appendChild(pushesInput);

    // Column 16: Learning Goal dropdown
    const learningGoalCell = row.insertCell(16);
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

    // Column 17: Focus Areas (comma-separated text input)
    const focusAreasCell = row.insertCell(17);
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

    // Column 18: Tools (comma-separated text input)
    const toolsCell = row.insertCell(18);
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

    // Column 19: Former IDs (comma-separated text input)
    const formerIdsCell = row.insertCell(19);
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

    // Column 20: Tags (comma-separated text input)
    const tagsCell = row.insertCell(20);
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

    // Column 21: Resume checkbox
    const resumeCell = row.insertCell(21);
    resumeCell.className = "checkbox-cell";
    const resumeCheckbox = document.createElement("input");
    resumeCheckbox.type = "checkbox";
    resumeCheckbox.checked = student.resumeRequirementMet || false;
    resumeCheckbox.addEventListener("change", (e) => onUpdate(idx, "resumeRequirementMet", e.target.checked));
    resumeCell.appendChild(resumeCheckbox);
  });
}

// Sort function for students
export function sortStudents(students, column, direction) {
  const sorted = [...students];

  sorted.sort((a, b) => {
    let valA, valB;

    switch (column) {
      case "displayName":
        valA = (a.displayName || "").toLowerCase();
        valB = (b.displayName || "").toLowerCase();
        break;
      case "id":
        valA = (a.id || "").toLowerCase();
        valB = (b.id || "").toLowerCase();
        break;
      case "githubUsername":
        valA = (a.githubUsername || "").toLowerCase();
        valB = (b.githubUsername || "").toLowerCase();
        break;
      case "status":
        valA = a.status || "";
        valB = b.status || "";
        break;
      case "entryType":
        valA = a.entryType || "";
        valB = b.entryType || "";
        break;
      case "program":
        valA = a.program || "";
        valB = b.program || "";
        break;
      case "year":
        valA = parseInt(a.year) || 0;
        valB = parseInt(b.year) || 0;
        break;
      case "cohort":
        valA = a.cohort || "";
        valB = b.cohort || "";
        break;
      case "purpose":
        valA = a.purpose || "";
        valB = b.purpose || "";
        break;
      case "learningStage":
        const stageOrder = { early: 0, developing: 1, advanced: 2 };
        valA = stageOrder[a.learning_stage] ?? 3;
        valB = stageOrder[b.learning_stage] ?? 3;
        break;
      case "joinedWebRing":
        valA = a.joinedWebRing ? new Date(a.joinedWebRing) : 0;
        valB = b.joinedWebRing ? new Date(b.joinedWebRing) : 0;
        break;
      case "joinedMentorship":
        valA = a.joinedMentorship ? new Date(a.joinedMentorship) : 0;
        valB = b.joinedMentorship ? new Date(b.joinedMentorship) : 0;
        break;
      case "firstCommitDate":
        valA = a.firstCommitDate ? new Date(a.firstCommitDate) : 0;
        valB = b.firstCommitDate ? new Date(b.firstCommitDate) : 0;
        break;
      case "lastCommitDate":
        valA = a.lastCommitDate ? new Date(a.lastCommitDate) : 0;
        valB = b.lastCommitDate ? new Date(b.lastCommitDate) : 0;
        break;
      case "totalPushes":
        valA = a.totalPushes || 0;
        valB = b.totalPushes || 0;
        break;
      case "learningGoal":
        valA = a.learningGoal || "";
        valB = b.learningGoal || "";
        break;
      case "resumeMet":
        valA = a.resumeRequirementMet ? 1 : 0;
        valB = b.resumeRequirementMet ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
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
