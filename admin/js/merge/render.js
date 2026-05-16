import { getConfig } from "./config.js";
import { COHORT_OPTIONS } from "./cohorts.js";

export function renderTableHeader() {
  const thead = document.getElementById("tableHeader");

  if (!thead) return;

  thead.innerHTML = `
    <tr>
      <th>Folder ID</th>
      <th>Display Name</th>
      <th>GitHub</th>
      <th>Program</th>
      <th>Year</th>
      <th>Cohort</th>
      <th>Alumni</th>
      <th>Withdrawn</th>
      <th>Tags</th>
      <th>Resume Met</th>
      <th>Notes</th>
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

    // Folder ID
    const idCell = row.insertCell(0);
    idCell.textContent = student.id;
    idCell.style.color = "#8b949e";

    // Display Name
    const nameCell = row.insertCell(1);
    const nameInput = document.createElement("input");
    nameInput.value = student.displayName;
    nameInput.addEventListener("change", (e) => onUpdate(idx, "displayName", e.target.value));
    nameCell.appendChild(nameInput);

    // GitHub
    const githubCell = row.insertCell(2);
    const githubInput = document.createElement("input");
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim()));
    githubCell.appendChild(githubInput);

    // Program
    const programCell = row.insertCell(3);
    const programSelect = document.createElement("select");

    config.options.programs.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.program === opt) option.selected = true;
      programSelect.appendChild(option);
    });

    programSelect.addEventListener("change", (e) => onUpdate(idx, "program", e.target.value));

    programCell.appendChild(programSelect);

    // Year
    const yearCell = row.insertCell(4);
    const yearSelect = document.createElement("select");

    config.options.years.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.year === opt) option.selected = true;
      yearSelect.appendChild(option);
    });

    yearSelect.addEventListener("change", (e) => onUpdate(idx, "year", e.target.value));

    yearCell.appendChild(yearSelect);

    // Cohort (from external file)
    const cohortCell = row.insertCell(5);
    const cohortSelect = document.createElement("select");

    COHORT_OPTIONS.forEach((c) => {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      if (student.cohort === c) option.selected = true;
      cohortSelect.appendChild(option);
    });

    cohortSelect.addEventListener("change", (e) => onUpdate(idx, "cohort", e.target.value));

    cohortCell.appendChild(cohortSelect);

    // Alumni
    const alumniCell = row.insertCell(6);
    const alumniCheckbox = document.createElement("input");
    alumniCheckbox.type = "checkbox";
    alumniCheckbox.checked = student.isAlumni;
    alumniCheckbox.addEventListener("change", (e) => onUpdate(idx, "isAlumni", e.target.checked));
    alumniCell.appendChild(alumniCheckbox);

    // Withdrawn
    const withdrawnCell = row.insertCell(7);
    const withdrawnCheckbox = document.createElement("input");
    withdrawnCheckbox.type = "checkbox";
    withdrawnCheckbox.checked = student.withdrawn;
    withdrawnCheckbox.addEventListener("change", (e) => onUpdate(idx, "withdrawn", e.target.checked));
    withdrawnCell.appendChild(withdrawnCheckbox);

    // Tags
    const tagsCell = row.insertCell(8);
    const tagsInput = document.createElement("input");
    tagsInput.value = (student.tags || []).join(", ");

    tagsInput.addEventListener("change", (e) => {
      const tagsArray = e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      onUpdate(idx, "tags", tagsArray);
    });

    tagsCell.appendChild(tagsInput);

    // Resume
    const resumeCell = row.insertCell(9);
    const resumeCheckbox = document.createElement("input");
    resumeCheckbox.type = "checkbox";
    resumeCheckbox.checked = student.resumeRequirementMet;
    resumeCheckbox.addEventListener("change", (e) => onUpdate(idx, "resumeRequirementMet", e.target.checked));
    resumeCell.appendChild(resumeCheckbox);

    // Notes
    const notesCell = row.insertCell(10);
    const notesInput = document.createElement("input");
    notesInput.value = student.notes || "";
    notesInput.addEventListener("change", (e) => onUpdate(idx, "notes", e.target.value));
    notesCell.appendChild(notesInput);
  });
}

function generateExcludeHint(excludeFolders = []) {
  if (!excludeFolders.length) return "";
  return `🚫 Auto-excluded: ${excludeFolders.join(", ")}`;
}

export function updateUIFromConfig() {
  const config = getConfig();
  const ui = config.ui || {};
  const excludeFolders = config.excludeFolders || [];

  const titleEl = document.getElementById("pageTitle");
  const subheadEl = document.getElementById("pageSubhead");
  const excludeEl = document.getElementById("excludeHint");

  if (titleEl) {
    titleEl.textContent = ui.title || "🕸️ Web Ring · Merge Engine";
  }

  if (subheadEl) {
    subheadEl.textContent = ui.subhead || "Ranked rule-based identity reconciliation";
  }

  if (excludeEl) {
    excludeEl.innerHTML = generateExcludeHint(excludeFolders) || "🚫 No folders excluded";
  }
}

export function showWarning(message) {
  const warningBox = document.getElementById("warningBox");
  if (!warningBox) return;
  warningBox.classList.remove("hidden");
  warningBox.innerHTML = message;
}

export function hideWarning() {
  const warningBox = document.getElementById("warningBox");
  if (!warningBox) return;
  warningBox.classList.add("hidden");
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
  if (el) el.textContent = JSON.stringify(output, null, 2);
}
