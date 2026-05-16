// js/data.js

export async function loadStudentsJson() {
  try {
    const response = await fetch("../students.json");
    if (!response.ok) throw new Error("students.json not found");
    const data = await response.json();
    return data.students || [];
  } catch (err) {
    console.error("Failed to load students.json:", err);
    return [];
  }
}
