// js/export.js

export function exportToCSV(students) {
  const headers = ["ID", "Display Name", "GitHub Username", "Status", "Activity", "Resume Ready", "Cohort", "Tags", "Notes", "Last Commit"];

  const rows = students.map((s) => [s.id, s.displayName, s.githubUsername || "", s.status, s.activityStatus, s.resumeRequirementMet ? "Yes" : "No", s.cohort || "", (s.tags || []).join("; "), s.notes || "", s.lastCommitDate || ""]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `webring_students_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
