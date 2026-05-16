// js/merge/main.js

import { loadConfig } from "./config.js";
import { fetchStudentsFromGitHub, fetchFoldersFromGitHub } from "./github.js";

import { reconcile } from "./reconcile.js";

import { renderTableHeader, renderTable, updateUIFromConfig, showWarning, hideWarning, showEditor, renderPreview } from "./render.js";

import { cleanForExport } from "./student.js";

let existingStudents = [];
let currentStudents = [];

async function init() {
  await loadConfig();

  updateUIFromConfig();
  renderTableHeader();
  setupEventListeners();
}

function setupEventListeners() {
  // Load students.json from GitHub
  document.getElementById("fetchStudentsBtn").addEventListener("click", async () => {
    try {
      const { students } = await fetchStudentsFromGitHub();

      existingStudents = students || [];

      document.getElementById("uploadStatus").innerHTML = `✅ Loaded ${existingStudents.length} students from repo`;
    } catch (err) {
      document.getElementById("uploadStatus").innerHTML = `❌ ${err.message}`;
    }
  });

  // Upload local students.json
  document.getElementById("uploadBtn").addEventListener("click", () => {
    document.getElementById("upload").click();
  });

  document.getElementById("upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const json = JSON.parse(await file.text());

      existingStudents = json.students || [];

      document.getElementById("uploadStatus").innerHTML = `✅ Loaded ${existingStudents.length} students from local file`;
    } catch (err) {
      document.getElementById("uploadStatus").innerHTML = `❌ Error loading file: ${err.message}`;
    }
  });

  // Fetch folders from GitHub repo
  document.getElementById("fetchFoldersBtn").addEventListener("click", async () => {
    try {
      const { folders = [] } = await fetchFoldersFromGitHub();

      document.getElementById("folderInput").value = folders.join("\n");

      alert(`✅ Loaded ${folders.length} student folders`);
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });

  // Load local TXT file
  document.getElementById("loadTxtBtn").addEventListener("click", () => {
    document.getElementById("folderFile").click();
  });

  document.getElementById("folderFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    document.getElementById("folderInput").value = await file.text();
  });

  // Reconcile students
  document.getElementById("reconcileBtn").addEventListener("click", () => {
    const folders = document
      .getElementById("folderInput")
      .value.split("\n")
      .map((f) => f.trim())
      .filter((f) => f && !f.startsWith("#"));

    if (!folders.length) {
      alert("Please load or paste folder names first");
      return;
    }

    const { students, summary } = reconcile(folders, existingStudents);

    currentStudents = students;

    if (summary.hasMissing) {
      showWarning(`
          🔍 Identity Resolution Summary:<br>
          🟢 High: ${summary.highCount}<br>
          🟡 Match: ${summary.matchCount}<br>
          🔴 None: ${summary.noneCount}<br>
          <span class="diff-changed">💡 ${summary.rulesList}</span>
        `);
    } else {
      hideWarning();
    }

    function handleUpdate(idx, field, value) {
      currentStudents[idx][field] = value;

      // Re-render so cohort preview updates live
      renderTable(currentStudents, handleUpdate);

      renderPreview(currentStudents.map(cleanForExport));
    }

    renderTable(currentStudents, handleUpdate);

    renderPreview(currentStudents.map(cleanForExport));

    showEditor();
  });

  // Download students.json
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const output = {
      lastUpdated: new Date().toISOString().split("T")[0],

      students: currentStudents.map(cleanForExport),
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "students.json";

    a.click();

    URL.revokeObjectURL(a.href);
  });
}

init();
