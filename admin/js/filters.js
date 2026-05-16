// js/filters.js
// Pure filtering and sorting functions (clean + architecture-safe)

export function filterStudents(students, state) {
  const { search, statusFilter, engagementFilter, selectedCohorts, selectedTags } = state;

  let filtered = [...students];

  // =========================
  // STATUS FILTER (LIFECYCLE)
  // =========================
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => {
      const isAlumni = !!s.isAlumni;
      const isWithdrawn = !!s.withdrawn;

      switch (statusFilter) {
        case "active":
          return !isAlumni && !isWithdrawn;

        case "alumni":
          return isAlumni;

        case "withdrawn":
          return isWithdrawn;

        default:
          return true;
      }
    });
  }

  // =========================
  // ENGAGEMENT FILTER (NEW)
  // =========================
  if (engagementFilter) {
    filtered = filtered.filter((s) => {
      const score = s.activity?.engagementScore ?? 0;
      const days = s.activity?.daysSinceLastCommit;

      switch (engagementFilter) {
        case "low":
          return score < 40;

        case "high":
          return score >= 70;

        case "recent":
          return s.activity?.status === "active" || s.activity?.status === "recent";

        case "at-risk":
          return days !== null && days >= 30;

        default:
          return true;
      }
    });
  }

  // =========================
  // COHORT FILTER
  // =========================
  if (selectedCohorts.size > 0) {
    filtered = filtered.filter((s) => selectedCohorts.has(s.cohort));
  }

  // =========================
  // TAG FILTER
  // =========================
  if (selectedTags.size > 0) {
    filtered = filtered.filter((s) => {
      const studentTags = new Set(s.tags || []);
      for (const tag of selectedTags) {
        if (!studentTags.has(tag)) return false;
      }
      return true;
    });
  }

  // =========================
  // SEARCH FILTER
  // =========================
  if (search) {
    const q = search.toLowerCase();

    filtered = filtered.filter((s) => s.displayName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.githubUsername && s.githubUsername.toLowerCase().includes(q)));
  }

  return filtered;
}

/**
 * SORTING (NOW FULLY CONSISTENT WITH GITHUB MODULE)
 */
export function sortStudents(students, sortBy, sortDirection) {
  const sorted = [...students];

  sorted.sort((a, b) => {
    let comparison = 0;

    // NAME
    if (sortBy === "name") {
      comparison = a.displayName.localeCompare(b.displayName);
    }

    // GITHUB STATUS
    else if (sortBy === "status") {
      const order = {
        active: 0,
        recent: 1,
        dormant: 2,
        unknown: 3,
      };

      comparison = (order[a.activity?.status] ?? 3) - (order[b.activity?.status] ?? 3);
    }

    // LAST ACTIVITY (FIXED + STABLE)
    else if (sortBy === "activity") {
      const aDate = a.activity?.lastCommitDate ? new Date(a.activity.lastCommitDate) : 0;

      const bDate = b.activity?.lastCommitDate ? new Date(b.activity.lastCommitDate) : 0;

      comparison = bDate - aDate;
    }

    // ENGAGEMENT SCORE (NEW POWER SORT)
    else if (sortBy === "engagement") {
      const aScore = a.activity?.engagementScore ?? 0;
      const bScore = b.activity?.engagementScore ?? 0;

      comparison = bScore - aScore;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * COHORTS (UNCHANGED, SAFE)
 */
export function computeAvailableCohorts(students) {
  const cohorts = new Set();

  students.forEach((s) => {
    if (s.cohort && s.cohort !== "Unassigned") {
      cohorts.add(s.cohort);
    }
  });

  return Array.from(cohorts).sort();
}

/**
 * TAGS (UNCHANGED, SAFE)
 */
export function computeAvailableTags(students) {
  const tags = new Set();

  students.forEach((s) => {
    if (s.tags) {
      s.tags.forEach((t) => tags.add(t));
    }
  });

  return Array.from(tags).sort();
}
