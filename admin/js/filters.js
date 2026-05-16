// js/filters.js
// Pure filtering and sorting functions

export function filterStudents(students, state) {
  const { search, statusFilter, selectedCohorts, selectedTags } = state;

  let filtered = [...students];

  // Status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => s.status === statusFilter);
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
      const order = { active: 0, recent: 1, dormant: 2 };
      comparison = (order[a.activityStatus] || 2) - (order[b.activityStatus] || 2);
    } else if (sortBy === "activity") {
      const aDate = a.lastCommitDate ? new Date(a.lastCommitDate) : 0;
      const bDate = b.lastCommitDate ? new Date(b.lastCommitDate) : 0;
      comparison = bDate - aDate;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}

export function computeAvailableCohorts(students) {
  const cohorts = new Set();
  students.forEach((s) => {
    if (s.cohort && s.cohort !== "Unassigned") cohorts.add(s.cohort);
  });
  return Array.from(cohorts).sort();
}

export function computeAvailableTags(students) {
  const tags = new Set();
  students.forEach((s) => {
    if (s.tags) s.tags.forEach((t) => tags.add(t));
  });
  return Array.from(tags).sort();
}
