// js/filters.js

export function filterStudents(students, state) {
  const { search, statusFilter, selectedCohorts, selectedTags } = state;

  let filtered = [...students];

  /**
   * -------------------------
   * STATUS FILTER (CLEAN MODEL)
   * -------------------------
   */
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => {
      const status = s.activity?.status;

      if (statusFilter === "active") return status === "active";
      if (statusFilter === "recent") return status === "recent";
      if (statusFilter === "dormant") return status === "dormant";

      if (statusFilter === "alumni") return s.isAlumni;
      if (statusFilter === "withdrawn") return s.withdrawn;

      return true;
    });
  }

  // Cohort filter
  if (selectedCohorts.size > 0) {
    filtered = filtered.filter((s) => selectedCohorts.has(s.cohort));
  }

  // Tags filter
  if (selectedTags.size > 0) {
    filtered = filtered.filter((s) => {
      const studentTags = new Set(s.tags || []);
      for (const tag of selectedTags) {
        if (!studentTags.has(tag)) return false;
      }
      return true;
    });
  }

  // Search
  if (search) {
    const q = search.toLowerCase();

    filtered = filtered.filter((s) => s.displayName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.githubUsername && s.githubUsername.toLowerCase().includes(q)));
  }

  return filtered;
}

export function sortStudents(students, sortBy, sortDirection) {
  const sorted = [...students];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.displayName.localeCompare(b.displayName);
    } else if (sortBy === "status") {
      const order = { active: 0, recent: 1, dormant: 2, unknown: 3 };

      comparison = (order[a.activity?.status] ?? 3) - (order[b.activity?.status] ?? 3);
    } else if (sortBy === "activity") {
      const aDate = a.activity?.lastCommitDate ? new Date(a.activity.lastCommitDate) : 0;

      const bDate = b.activity?.lastCommitDate ? new Date(b.activity.lastCommitDate) : 0;

      comparison = bDate - aDate;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}
