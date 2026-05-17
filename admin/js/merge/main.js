// js/merge/main.js
// Main entry point — orchestrates the entire merge tool workflow
// Sets up event listeners for all UI buttons (Fetch JSON, Upload, Fetch Folders, Reconcile, Download, Fetch Push Counts, Fetch Last Commit Dates)
// Handles the reconciliation pipeline and student data updates

import { loadConfig } from "./config.js";
import { fetchStudentsFromGitHub, fetchFoldersFromGitHub, fetchCommitCountsForAllStudents, fetchLastCommitDatesForStudents } from "./github.js";
import { reconcile } from "./reconcile.js";
import { renderTableHeader, renderTable, updateUIFromConfig, showWarning, hideWarning, showEditor, renderPreview } from "./render.js";
import { cleanForExport } from "./student.js";
import { isSystemFolder } from "../../lib/system.js";

let existingStudents = [];
let currentStudents = [];

async function init() {
  await loadConfig();

  updateUIFromConfig();
  renderTableHeader();
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById("fetchStudentsBtn").addEventListener("click", async () => {
    try {
      const { students } = await fetchStudentsFromGitHub();

      existingStudents = students || [];

      document.getElementById("uploadStatus").innerHTML = `✅ Loaded ${existingStudents.length} students from repo`;
    } catch (err) {
      document.getElementById("uploadStatus").innerHTML = `❌ ${err.message}`;
    }
  });

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

  document.getElementById("fetchFoldersBtn").addEventListener("click", async () => {
    try {
      const { folders = [] } = await fetchFoldersFromGitHub();

      document.getElementById("folderInput").value = folders.join("\n");

      alert(`✅ Loaded ${folders.length} student folders`);
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  });

  document.getElementById("loadTxtBtn").addEventListener("click", () => {
    document.getElementById("folderFile").click();
  });

  document.getElementById("folderFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    document.getElementById("folderInput").value = await file.text();
  });

  document.getElementById("reconcileBtn").addEventListener("click", () => {
    const folders = document
      .getElementById("folderInput")
      .value.split("\n")
      .map((f) => f.trim())
      .filter((f) => f && !f.startsWith("#"))
      .filter((f) => !isSystemFolder(f));

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

      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));
    }

    renderTable(currentStudents, handleUpdate);
    renderPreview(currentStudents.map(cleanForExport));

    showEditor();
  });

  document.getElementById("downloadBtn").addEventListener("click", () => {
    const output = {
      lastUpdated: new Date().toISOString().split("T")[0],

      students: currentStudents.map(cleanForExport),
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "students.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  // Select All button
  document.getElementById("selectAllBtn")?.addEventListener("click", () => {
    currentStudents.forEach((student) => {
      student.selectedForFetch = true;
    });
    function handleUpdate(idx, field, value) {
      currentStudents[idx][field] = value;
      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));
    }
    renderTable(currentStudents, handleUpdate);
  });

  // Select None button
  document.getElementById("selectNoneBtn")?.addEventListener("click", () => {
    currentStudents.forEach((student) => {
      student.selectedForFetch = false;
    });
    function handleUpdate(idx, field, value) {
      currentStudents[idx][field] = value;
      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));
    }
    renderTable(currentStudents, handleUpdate);
  });

  // Fetch Push Counts for selected students only
  document.getElementById("fetchPushCountsBtn").addEventListener("click", async () => {
    if (!currentStudents.length) {
      alert("Please reconcile students first");
      return;
    }

    const selectedStudents = currentStudents.filter((s) => s.selectedForFetch === true);

    if (selectedStudents.length === 0) {
      alert("Please check the checkbox for students you want to update, or click 'Select All'");
      return;
    }

    const btn = document.getElementById("fetchPushCountsBtn");
    const originalText = btn.textContent;
    btn.textContent = `⟳ Fetching ${selectedStudents.length} students...`;
    btn.disabled = true;

    try {
      const counts = await fetchCommitCountsForAllStudents(selectedStudents);

      counts.forEach(({ id, commitCount, lastCommitDate }) => {
        const student = currentStudents.find((s) => s.id === id);
        if (student) {
          student.totalPushes = commitCount;
          if (lastCommitDate) student.lastCommitDate = lastCommitDate;
        }
      });

      function handleUpdate(idx, field, value) {
        currentStudents[idx][field] = value;
        renderTable(currentStudents, handleUpdate);
        renderPreview(currentStudents.map(cleanForExport));
      }

      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));

      // Clear all selected checkboxes after fetch
      currentStudents.forEach((s) => (s.selectedForFetch = false));
      renderTable(currentStudents, handleUpdate);

      alert(`✅ Fetched push counts for ${counts.length} students`);
    } catch (err) {
      alert(`❌ Error fetching push counts: ${err.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // Fetch Last Commit Dates for selected students only
  document.getElementById("fetchLastCommitBtn")?.addEventListener("click", async () => {
    console.log("Fetch Last Commit button clicked");

    if (!currentStudents.length) {
      alert("Please reconcile students first");
      return;
    }

    const selectedStudents = currentStudents.filter((s) => s.selectedForFetch === true);
    console.log("Selected students:", selectedStudents.length);

    if (selectedStudents.length === 0) {
      alert("Please check the checkbox for students you want to update, or click 'Select All'");
      return;
    }

    const btn = document.getElementById("fetchLastCommitBtn");
    const originalText = btn.textContent;
    btn.textContent = `⟳ Fetching ${selectedStudents.length}...`;
    btn.disabled = true;

    try {
      console.log("Calling fetchLastCommitDatesForStudents...");
      const results = await fetchLastCommitDatesForStudents(selectedStudents);
      console.log("Results:", results);

      results.forEach(({ id, lastCommitDate }) => {
        const student = currentStudents.find((s) => s.id === id);
        if (student && lastCommitDate) {
          student.lastCommitDate = lastCommitDate;
          console.log(`Updated ${id}: ${lastCommitDate}`);
        }
      });

      function handleUpdate(idx, field, value) {
        currentStudents[idx][field] = value;
        renderTable(currentStudents, handleUpdate);
        renderPreview(currentStudents.map(cleanForExport));
      }

      renderTable(currentStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));

      alert(`✅ Fetched last commit dates for ${results.length} students`);
    } catch (err) {
      console.error("Error:", err);
      alert(`❌ Error fetching last commit dates: ${err.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

init();
