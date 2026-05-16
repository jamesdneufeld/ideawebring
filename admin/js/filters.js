export function filterStudents(students, state) {
  const { search, statusFilter, selectedCohorts, selectedTags } = state;

  let filtered = [...students];

  // -----------------------
  // STATUS FILTER (safe)
  // -----------------------
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => {
      if (statusFilter === "active") return !s.isAlumni && !s.withdrawn;
      if (statusFilter === "alumni") return s.isAlumni;
      if (statusFilter === "withdrawn") return s.withdrawn;

      // NEW ENGAGEMENT FILTERS
      if (statusFilter === "low-engagement") {
        return (s.activity?.engagementScore || 0) < 40;
      }

      if (statusFilter === "at-risk") {
        return (s.activity?.daysSinceLastCommit ?? 999) > 30;
      }

      if (statusFilter === "recent") {
        return (s.activity?.daysSinceLastCommit ?? 999) <= 7;
      }

      return true;
    });
  }

  // cohort
  if (selectedCohorts.size > 0) {
    filtered = filtered.filter((s) => selectedCohorts.has(s.cohort));
  }

  // tags
  if (selectedTags.size > 0) {
    filtered = filtered.filter((s) => {
      const tags = new Set(s.tags || []);
      return [...selectedTags].every((t) => tags.has(t));
    });
  }

  // search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) => s.displayName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.githubUsername || "").toLowerCase().includes(q));
  }

  return filtered;
}
