// js/merge/main.js
// Main entry point — orchestrates the entire merge tool workflow
// Sets up event listeners for all UI buttons (Fetch JSON, Upload, Fetch Folders, Reconcile, Download, Fetch Push Counts, Fetch Last Commit Dates, Fetch First Commit Dates)
// Handles the reconciliation pipeline and student data updates
// Supports column sorting by clicking table headers

import { loadConfig } from "./config.js";
import { fetchStudentsFromGitHub, fetchFoldersFromGitHub, fetchCommitCountsForAllStudents, fetchLastCommitDatesForStudents, fetchFirstCommitDatesForStudents } from "./github.js";
import { reconcile } from "./reconcile.js";
import { renderTableHeader, renderTable, updateUIFromConfig, showWarning, hideWarning, showEditor, renderPreview, sortStudents, setSortState, getSortState } from "./render.js";
import { cleanForExport } from "./student.js";
import { isSystemFolder } from "../../lib/system.js";

let existingStudents = [];
let currentStudents = [];
let sortedStudents = [];

// Handle update to a student field (maintains sort order)

function handleUpdate(idx, field, value) {
  // Get the student from the sorted array
  const student = sortedStudents[idx];
  if (!student) return;

  // Find the actual student in currentStudents by id
  const actualIndex = currentStudents.findIndex((s) => s.id === student.id);
  if (actualIndex === -1) return;

  console.log(`🔧 handleUpdate: updating ${student.id} field ${field} to ${value}`);
  currentStudents[actualIndex][field] = value;

  // Re-apply current sort after update
  const sortState = getSortState();
  if (sortState.column && currentStudents.length) {
    sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
  } else {
    sortedStudents = [...currentStudents];
  }

  renderTable(sortedStudents, handleUpdate);
  renderPreview(currentStudents.map(cleanForExport));
}

async function init() {
  await loadConfig();

  updateUIFromConfig();

  // Define sort callback for table header clicks
  function onSortColumn(column, direction) {
    setSortState(column, direction);
    if (currentStudents.length) {
      sortedStudents = sortStudents(currentStudents, column, direction);
      renderTable(sortedStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));
    }
  }

  renderTableHeader(onSortColumn);
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
    sortedStudents = [...currentStudents];

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

    renderTable(sortedStudents, handleUpdate);
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
    // Re-render with current sort
    const sortState = getSortState();
    if (sortState.column && currentStudents.length) {
      sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
    } else {
      sortedStudents = [...currentStudents];
    }
    renderTable(sortedStudents, handleUpdate);
    renderPreview(currentStudents.map(cleanForExport));
  });

  // Select None button
  document.getElementById("selectNoneBtn")?.addEventListener("click", () => {
    currentStudents.forEach((student) => {
      student.selectedForFetch = false;
    });
    // Re-render with current sort
    const sortState = getSortState();
    if (sortState.column && currentStudents.length) {
      sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
    } else {
      sortedStudents = [...currentStudents];
    }
    renderTable(sortedStudents, handleUpdate);
    renderPreview(currentStudents.map(cleanForExport));
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

      // Re-sort after updates
      const sortState = getSortState();
      if (sortState.column && currentStudents.length) {
        sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
      } else {
        sortedStudents = [...currentStudents];
      }

      renderTable(sortedStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));

      // Clear all selected checkboxes after fetch
      currentStudents.forEach((s) => (s.selectedForFetch = false));
      sortedStudents = sortStudents(currentStudents, sortState.column || "displayName", sortState.direction || "asc");
      renderTable(sortedStudents, handleUpdate);

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
      const results = await fetchLastCommitDatesForStudents(selectedStudents);
      console.log("Results:", results);

      for (const { id, lastCommitDate } of results) {
        const studentIndex = currentStudents.findIndex((s) => s.id === id);
        if (studentIndex !== -1 && lastCommitDate) {
          currentStudents[studentIndex].lastCommitDate = lastCommitDate;
          console.log(`Updated ${id}: ${lastCommitDate}`);
        }
      }

      // Re-sort after updates
      const sortState = getSortState();
      if (sortState.column && currentStudents.length) {
        sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
      } else {
        sortedStudents = [...currentStudents];
      }

      renderTable(sortedStudents, handleUpdate);
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

  // Fetch First Commit Dates for selected students only
  document.getElementById("fetchFirstCommitBtn")?.addEventListener("click", async () => {
    console.log("Fetch First Commit button clicked");

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

    const btn = document.getElementById("fetchFirstCommitBtn");
    const originalText = btn.textContent;
    btn.textContent = `⟳ Fetching ${selectedStudents.length}...`;
    btn.disabled = true;

    try {
      const results = await fetchFirstCommitDatesForStudents(selectedStudents);
      console.log("Results:", results);

      for (const { id, firstCommitDate } of results) {
        const studentIndex = currentStudents.findIndex((s) => s.id === id);
        if (studentIndex !== -1 && firstCommitDate) {
          currentStudents[studentIndex].firstCommitDate = firstCommitDate;
          console.log(`Updated first commit for ${id}: ${firstCommitDate}`);
        }
      }

      // Re-sort after updates
      const sortState = getSortState();
      if (sortState.column && currentStudents.length) {
        sortedStudents = sortStudents(currentStudents, sortState.column, sortState.direction);
      } else {
        sortedStudents = [...currentStudents];
      }

      renderTable(sortedStudents, handleUpdate);
      renderPreview(currentStudents.map(cleanForExport));

      alert(`✅ Fetched first commit dates for ${results.length} students`);
    } catch (err) {
      console.error("Error:", err);
      alert(`❌ Error fetching first commit dates: ${err.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

init();
