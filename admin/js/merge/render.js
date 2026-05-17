// js/merge/render.js
// UI rendering — builds the editable student table (headers, rows, inputs, dropdowns, checkboxes)
// Updates preview JSON, shows/hides warning messages and editor section

import { getConfig } from "./config.js";

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
      <th>Participation Type</th>
      <th>New / Returning</th>
      <th>Program</th>
      <th>Grad Year</th>
      <th>Total Pushes</th>
      <th>Last Commit</th>
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

    // Checkbox
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

    // Display Name
    const nameCell = row.insertCell(2);
    const nameInput = document.createElement("input");
    nameInput.value = student.displayName || "";
    nameInput.addEventListener("change", (e) => onUpdate(idx, "displayName", e.target.value));
    nameCell.appendChild(nameInput);

    // GitHub
    const githubCell = row.insertCell(3);
    const githubInput = document.createElement("input");
    githubInput.placeholder = "github username";
    githubInput.value = student.githubUsername || "";
    githubInput.addEventListener("change", (e) => onUpdate(idx, "githubUsername", e.target.value.trim()));
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

    // Participation dropdown
    const participationCell = row.insertCell(5);
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

    // Returning dropdown
    const returningCell = row.insertCell(6);
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
    const programCell = row.insertCell(7);
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
    const yearCell = row.insertCell(8);
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

    // Total Pushes (editable number) - make sure it shows current value
    const pushesCell = row.insertCell(9);
    const pushesInput = document.createElement("input");
    pushesInput.type = "number";
    pushesInput.value = student.totalPushes !== undefined ? student.totalPushes : 0;
    pushesInput.style.width = "70px";
    pushesInput.addEventListener("change", (e) => {
      const val = parseInt(e.target.value) || 0;
      onUpdate(idx, "totalPushes", val);
    });
    pushesCell.appendChild(pushesInput);

    // Last Commit Date (editable date picker) - show existing date if present
    const lastCommitCell = row.insertCell(10);
    const lastCommitInput = document.createElement("input");
    lastCommitInput.type = "date";
    // Format date correctly if it exists
    if (student.lastCommitDate) {
      const date = new Date(student.lastCommitDate);
      if (!isNaN(date)) {
        lastCommitInput.value = date.toISOString().split("T")[0];
      }
    }
    lastCommitInput.style.width = "110px";
    lastCommitInput.addEventListener("change", (e) => {
      onUpdate(idx, "lastCommitDate", e.target.value || null);
    });
    lastCommitCell.appendChild(lastCommitInput);

    // Tags
    const tagsCell = row.insertCell(11);
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
    const resumeCell = row.insertCell(12);
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
