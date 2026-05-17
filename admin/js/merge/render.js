// js/merge/render.js
// UI rendering — builds the editable student table (headers, rows, inputs, dropdowns, checkboxes)
// Updates preview JSON, shows/hides warning messages and editor section

import { getConfig } from "./config.js";

export function renderTableHeader() {
  const thead = document.getElementById("tableHeader");

  if (!thead) return;

  thead.innerHTML = `
    <tr>
      <th>Folder ID</th>
      <th>Display Name</th>
      <th>GitHub</th>
      <th>Status</th>
      <th>Participation</th>
      <th>Returning</th>
      <th>Program</th>
      <th>Year</th>
      <th>Total Pushes</th>
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
    githubInput.placeholder = "github username";
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim()));
    githubCell.appendChild(githubInput);

    // Status dropdown
    const statusCell = row.insertCell(3);
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

    // Participation dropdown
    const participationCell = row.insertCell(4);
    const participationSelect = document.createElement("select");
    const participationOptions = [
      { value: "", label: "None" },
      { value: "summer-mentorship", label: "Summer Mentorship" },
      { value: "coursework", label: "Coursework" },
    ];
    participationOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.participation === opt.value || (opt.value === "" && !student.participation)) {
        option.selected = true;
      }
      participationSelect.appendChild(option);
    });
    participationSelect.addEventListener("change", (e) => {
      const value = e.target.value === "" ? null : e.target.value;
      onUpdate(idx, "participation", value);
    });
    participationCell.appendChild(participationSelect);

    // Returning dropdown (New / Returning)
    const returningCell = row.insertCell(5);
    const returningSelect = document.createElement("select");
    const returningOptions = [
      { value: false, label: "New" },
      { value: true, label: "Returning" },
    ];
    returningOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (student.returning === opt.value) option.selected = true;
      returningSelect.appendChild(option);
    });
    returningSelect.addEventListener("change", (e) => onUpdate(idx, "returning", e.target.value === "true"));
    returningCell.appendChild(returningSelect);

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
    (config.options?.years || ["2024", "2025", "2026", "2027", "2028"]).forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (student.year === opt) option.selected = true;
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener("change", (e) => onUpdate(idx, "year", e.target.value));
    yearCell.appendChild(yearSelect);

    // Total Pushes (read-only)
    const pushesCell = row.insertCell(8);
    const pushesSpan = document.createElement("span");
    pushesSpan.textContent = student.totalPushes || "0";
    pushesSpan.style.color = "#8b949e";
    pushesCell.appendChild(pushesSpan);

    // Tags
    const tagsCell = row.insertCell(9);
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

    // Resume
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
