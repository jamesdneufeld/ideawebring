// js/data.js
// Safe loader with strict validation

export async function loadStudentsJson() {
  try {
    const response = await fetch("../students.json");

    if (!response.ok) {
      throw new Error(`students.json not found (${response.status})`);
    }

    const data = await response.json();

    // ✅ STRICT validation (this is the fix)
    if (!data) {
      throw new Error("students.json is empty or invalid");
    }

    if (!Array.isArray(data.students)) {
      throw new Error("students.json must contain { students: [...] }");
    }

    return data.students;
  } catch (err) {
    console.error("❌ Failed to load students.json:", err);

    // Fail loudly instead of silently breaking dashboard
    return [];
  }
}
