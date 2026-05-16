// js/merge/render.js (fixed criticals only)
import { getConfig } from "./config.js";
import { getCohortDisplay } from "./student.js";

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
      <th>Alumni</th>
      <th>Withdrawn</th>
      <th>Former IDs</th>
      <th>Cohort</th>
      <th>Tags</th>
      <th>Resume Met</th>
      <th>Notes</th>
    </tr>
  `;
}

export function renderTable(students, onUpdate) {
  const tbody = document.getElementById("studentTableBody");
  if (!tbody) return;

  const config = getConfig();

  const programs = config.options?.programs || [];
  const years = config.options?.years || [];

  tbody.innerHTML = "";

  students.forEach((student, idx) => {
    const row = tbody.insertRow();

    const idCell = row.insertCell(0);
    idCell.textContent = student.id;
    idCell.style.color = "#8b949e";

    const nameCell = row.insertCell(1);
    const nameInput = document.createElement("input");
    nameInput.value = student.displayName;
    nameInput.addEventListener("change", (e) => onUpdate(idx, "displayName", e.target.value));
    nameCell.appendChild(nameInput);

    const githubCell = row.insertCell(2);
    const githubInput = document.createElement("input");
    githubInput.placeholder = "github username";
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim()));
    githubCell.appendChild(githubInput);

    const programCell = row.insertCell(3);
    const programSelect = document.createElement("select");
    programs.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.program === opt) option.selected = true;
      programSelect.appendChild(option);
    });
    programSelect.addEventListener("change", (e) => onUpdate(idx, "program", e.target.value));
    programCell.appendChild(programSelect);

    const yearCell = row.insertCell(4);
    const yearSelect = document.createElement("select");
    yearSelect.className = "year-input";
    years.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.year === opt) option.selected = true;
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener("change", (e) => onUpdate(idx, "year", e.target.value));
    yearCell.appendChild(yearSelect);

    const alumniCell = row.insertCell(5);
    alumniCell.className = "checkbox-cell";
    const alumniCheckbox = document.createElement("input");
    alumniCheckbox.type = "checkbox";
    alumniCheckbox.checked = student.isAlumni;
    alumniCheckbox.addEventListener("change", (e) => onUpdate(idx, "isAlumni", e.target.checked));
    alumniCell.appendChild(alumniCheckbox);

    const withdrawnCell = row.insertCell(6);
    withdrawnCell.className = "checkbox-cell";
    const withdrawnCheckbox = document.createElement("input");
    withdrawnCheckbox.type = "checkbox";
    withdrawnCheckbox.checked = student.withdrawn;
    withdrawnCheckbox.addEventListener("change", (e) => onUpdate(idx, "withdrawn", e.target.checked));
    withdrawnCell.appendChild(withdrawnCheckbox);

    const formerIdsCell = row.insertCell(7);
    const formerIdsInput = document.createElement("input");
    formerIdsInput.type = "text";
    formerIdsInput.placeholder = "former folder names, comma, separated";
    formerIdsInput.value = (student.formerIds || []).join(", ");
    formerIdsInput.addEventListener("change", (e) => {
      const idsArray = e.target.value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      onUpdate(idx, "formerIds", idsArray);
    });
    formerIdsCell.appendChild(formerIdsInput);

    const cohortCell = row.insertCell(8);
    const cohortDisplay = getCohortDisplay(student.program, student.year, student.isAlumni, student.withdrawn);
    cohortCell.innerHTML = `<span class="cohort-preview">${cohortDisplay}</span>`;

    const tagsCell = row.insertCell(9);
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "comma, separated, tags";
    tagsInput.value = (student.tags || []).join(", ");
    tagsInput.addEventListener("change", (e) => {
      const tagsArray = e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      onUpdate(idx, "tags", tagsArray);
    });
    tagsCell.appendChild(tagsInput);

    const resumeCell = row.insertCell(10);
    resumeCell.className = "checkbox-cell";
    const resumeCheckbox = document.createElement("input");
    resumeCheckbox.type = "checkbox";
    resumeCheckbox.checked = student.resumeRequirementMet;
    resumeCheckbox.addEventListener("change", (e) => onUpdate(idx, "resumeRequirementMet", e.target.checked));
    resumeCell.appendChild(resumeCheckbox);

    const notesCell = row.insertCell(11);
    const notesInput = document.createElement("input");
    notesInput.placeholder = "optional notes";
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
    excludeEl.textContent = generateExcludeHint(excludeFolders) || "🚫 No folders excluded";
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
  const el = document.getElementById("output");
  if (!el) return;

  const output = {
    lastUpdated: new Date().toISOString().split("T")[0],
    students,
  };

  el.textContent = JSON.stringify(output, null, 2);
}
