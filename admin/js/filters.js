// js/filters.js
// Pure filtering and sorting functions

export function filterStudents(students, state) {
  const { search, statusFilter, selectedCohorts, selectedTags, lastCommitRange } = state;

  let filtered = [...students];

  // -------------------------
  // STATUS FILTER
  // -------------------------
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => {
      switch (statusFilter) {
        case "active":
          return s.state?.isActiveParticipant;
        case "engaged":
          return s.state?.isEngaged;
        case "alumni":
          return s.state?.lifecycle === "alumni";
        case "student":
          return s.state?.lifecycle === "student";
        case "withdrawn":
          return s.state?.lifecycle === "withdrawn";
        case "dormant":
          return s.state?.activity === "dormant";
        default:
          return true;
      }
    });
  }

  // -------------------------
  // COHORT FILTER
  // -------------------------
  if (selectedCohorts.size > 0) {
    filtered = filtered.filter((s) => selectedCohorts.has(s.cohort));
  }

  // -------------------------
  // TAG FILTER
  // -------------------------
  if (selectedTags.size > 0) {
    filtered = filtered.filter((s) => {
      const tags = new Set(s.tags || []);
      for (const t of selectedTags) {
        if (!tags.has(t)) return false;
      }
      return true;
    });
  }

  // -------------------------
  // SEARCH FILTER
  // -------------------------
  if (search) {
    const q = search.toLowerCase();

    filtered = filtered.filter((s) => s.displayName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.githubUsername || "").toLowerCase().includes(q));
  }

  // -------------------------
  // 🔥 LAST COMMIT FILTER
  // -------------------------
  if (lastCommitRange && lastCommitRange !== "all") {
    const days = parseInt(lastCommitRange, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    filtered = filtered.filter((s) => {
      if (!s.lastCommitDate) return false;
      return new Date(s.lastCommitDate).getTime() >= cutoff;
    });
  }

  return filtered;
}

// -------------------------
// SORT
// -------------------------
export function sortStudents(students, sortBy, sortDirection) {
  const sorted = [...students];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.displayName.localeCompare(b.displayName);
    }

    if (sortBy === "status") {
      const order = {
        active: 0,
        engaged: 1,
        dormant: 2,
        alumni: 3,
        withdrawn: 4,
      };

      comparison = (order[a.state?.activity] ?? 2) - (order[b.state?.activity] ?? 2);
    }

    if (sortBy === "activity") {
      const aDate = a.lastCommitDate ? new Date(a.lastCommitDate) : 0;
      const bDate = b.lastCommitDate ? new Date(b.lastCommitDate) : 0;

      comparison = bDate - aDate;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}
