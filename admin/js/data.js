// js/data.js

export async function loadStudentsJson() {
  try {
    const response = await fetch("students.json"); // ✅ FIXED PATH

    if (!response.ok) {
      throw new Error("students.json not found");
    }

    const data = await response.json();

    // Ensure structure is always safe
    const students = Array.isArray(data?.students) ? data.students : Array.isArray(data) ? data : [];

    return students;
  } catch (err) {
    console.error("Failed to load students.json:", err);
    return [];
  }
}
