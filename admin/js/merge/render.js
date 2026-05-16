// js/merge/render.js (for merge engine table)
import { getConfig } from "./config.js";
import { getCohortDisplay } from "./student.js";

export function renderTableHeader() {
  const thead = document.getElementById("tableHeader");
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
  const config = getConfig();
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

    // GitHub Username
    const githubCell = row.insertCell(2);
    const githubInput = document.createElement("input");
    githubInput.placeholder = "github username";
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
    yearSelect.className = "year-input";
    config.options.years.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.year === opt) option.selected = true;
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener("change", (e) => onUpdate(idx, "year", e.target.value));
    yearCell.appendChild(yearSelect);

    // Alumni
    const alumniCell = row.insertCell(5);
    alumniCell.className = "checkbox-cell";
    const alumniCheckbox = document.createElement("input");
    alumniCheckbox.type = "checkbox";
    alumniCheckbox.checked = student.isAlumni;
    alumniCheckbox.addEventListener("change", (e) => onUpdate(idx, "isAlumni", e.target.checked));
    alumniCell.appendChild(alumniCheckbox);

    // Withdrawn
    const withdrawnCell = row.insertCell(6);
    withdrawnCell.className = "checkbox-cell";
    const withdrawnCheckbox = document.createElement("input");
    withdrawnCheckbox.type = "checkbox";
    withdrawnCheckbox.checked = student.withdrawn;
    withdrawnCheckbox.addEventListener("change", (e) => onUpdate(idx, "withdrawn", e.target.checked));
    withdrawnCell.appendChild(withdrawnCheckbox);

    // Former IDs
    const formerIdsCell = row.insertCell(7);
    const formerIdsInput = document.createElement("input");
    formerIdsInput.type = "text";
    formerIdsInput.placeholder = "former folder names, comma, separated";
    formerIdsInput.value = (student.formerIds || []).join(", ");
    formerIdsInput.addEventListener("change", (e) => {
      const idsArray = e.target.value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      onUpdate(idx, "formerIds", idsArray);
    });
    formerIdsCell.appendChild(formerIdsInput);

    // Cohort preview
    const cohortCell = row.insertCell(8);
    const cohortDisplay = getCohortDisplay(student.program, student.year, student.isAlumni, student.withdrawn);
    cohortCell.innerHTML = `<span class="cohort-preview">${cohortDisplay}</span>`;

    // Tags
    const tagsCell = row.insertCell(9);
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "comma, separated, tags";
    tagsInput.value = (student.tags || []).join(", ");
    tagsInput.addEventListener("change", (e) => {
      const tagsArray = e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      onUpdate(idx, "tags", tagsArray);
    });
    tagsCell.appendChild(tagsInput);

    // Resume Requirement
    const resumeCell = row.insertCell(10);
    resumeCell.className = "checkbox-cell";
    const resumeCheckbox = document.createElement("input");
    resumeCheckbox.type = "checkbox";
    resumeCheckbox.checked = student.resumeRequirementMet;
    resumeCheckbox.addEventListener("change", (e) => onUpdate(idx, "resumeRequirementMet", e.target.checked));
    resumeCell.appendChild(resumeCheckbox);

    // Notes
    const notesCell = row.insertCell(11);
    const notesInput = document.createElement("input");
    notesInput.placeholder = "optional notes";
    notesInput.value = student.notes || "";
    notesInput.addEventListener("change", (e) => onUpdate(idx, "notes", e.target.value));
    notesCell.appendChild(notesInput);
  });
}

export function updateUIFromConfig() {
  const config = getConfig();
  document.getElementById("pageTitle").textContent = config.ui.title || "🕸️ Web Ring · Merge Engine";
  document.getElementById("pageSubhead").textContent = config.ui.subhead || "Ranked rule-based identity reconciliation";
  document.getElementById("excludeHint").innerHTML = config.ui.excludeHint || "🚫 Auto-excluded folders configured in config.json";
}

export function showWarning(message) {
  const warningBox = document.getElementById("warningBox");
  warningBox.classList.remove("hidden");
  warningBox.innerHTML = message;
}

export function hideWarning() {
  document.getElementById("warningBox").classList.add("hidden");
}

export function showEditor() {
  document.getElementById("editorSection").classList.remove("hidden");
}

export function renderPreview(students) {
  const output = {
    lastUpdated: new Date().toISOString().split("T")[0],
    students: students,
  };
  document.getElementById("output").textContent = JSON.stringify(output, null, 2);
}
