// js/merge/main.js

import { loadConfig, getConfig } from "./config.js";
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
  // Fetch students from GitHub
  document.getElementById("fetchStudentsBtn").addEventListener("click", async () => {
    try {
      const { students } = await fetchStudentsFromGitHub();
      existingStudents = students;
      document.getElementById("uploadStatus").innerHTML = `✅ Loaded ${students.length} students from repo`;
    } catch (err) {
      document.getElementById("uploadStatus").innerHTML = `❌ ${err.message}`;
    }
  });

  // Upload local file
  document.getElementById("uploadBtn").addEventListener("click", () => {
    document.getElementById("upload").click();
  });

  document.getElementById("upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      existingStudents = json.students || [];
      document.getElementById("uploadStatus").innerHTML = `✅ Loaded ${existingStudents.length} students from local file`;
    } catch (err) {
      document.getElementById("uploadStatus").innerHTML = `❌ Error loading file: ${err.message}`;
    }
  });

  // Fetch folders from GitHub
  document.getElementById("fetchFoldersBtn").addEventListener("click", async () => {
    try {
      const { folders, excludedCount } = await fetchFoldersFromGitHub();
      document.getElementById("folderInput").value = folders.join("\n");
      alert(`✅ Loaded ${folders.length} student folders (excluded ${excludedCount} admin folders)`);
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });

  // Load .txt file
  document.getElementById("loadTxtBtn").addEventListener("click", () => {
    document.getElementById("folderFile").click();
  });

  document.getElementById("folderFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    document.getElementById("folderInput").value = text;
  });

  // Reconcile
  document.getElementById("reconcileBtn").addEventListener("click", () => {
    const folderInput = document.getElementById("folderInput").value;
    const folders = folderInput
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f && !f.startsWith("#"));

    if (folders.length === 0) {
      alert("Please load or paste folder names first");
      return;
    }

    const { students, summary } = reconcile(folders, existingStudents);
    currentStudents = students;

    if (summary.hasMissing) {
      showWarning(`
        🔍 Identity Resolution Summary (Ranked Rules):<br>
        🟢 High confidence: ${summary.highCount}<br>
        🟡 Medium confidence: ${summary.mediumCount}<br>
        🔴 No match (new student): ${summary.lowCount}<br>
        <span class="diff-changed">💡 Match priority: ${summary.rulesList}</span>
      `);
    } else {
      hideWarning();
    }

    function handleUpdate(idx, field, value) {
      currentStudents[idx][field] = value;
      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));
    }

    renderTable(currentStudents, handleUpdate);
    renderPreview(currentStudents.map(cleanForExport));
    showEditor();
  });

  // Download
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const output = {
      lastUpdated: new Date().toISOString().split("T")[0],
      students: currentStudents.map(cleanForExport),
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "students.json";
    a.click();
    URL.revokeObjectURL(blob);
  });
}

init();
