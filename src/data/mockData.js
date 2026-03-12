export const ASSIGNMENTS = [
  { id: 1, title: "Thermodynamics Assignment", subject: "Physics", due: "Today, 11:59 PM", priority: "high", status: "in-progress", progress: 60 },
  { id: 2, title: "Integration Problems Set", subject: "Maths", due: "Tomorrow", priority: "medium", status: "pending", progress: 0 },
  { id: 3, title: "Shakespeare Essay – Hamlet", subject: "English", due: "Dec 18", priority: "low", status: "pending", progress: 30 },
  { id: 4, title: "Java OOP Project", subject: "CS", due: "Dec 20", priority: "high", status: "in-progress", progress: 75 },
  { id: 5, title: "Cell Division Diagrams", subject: "Biology", due: "Dec 22", priority: "medium", status: "completed", progress: 100 },
];

export const ATTENDANCE = [
  { subject: "Physics", present: 42, total: 48, required: 75 },
  { subject: "Mathematics", present: 38, total: 42, required: 75 },
  { subject: "English", present: 35, total: 40, required: 75 },
  { subject: "Chemistry", present: 28, total: 45, required: 75 },
  { subject: "CS", present: 30, total: 33, required: 75 },
];

export const EXPENSES = [
  { category: "Food & Canteen", amount: 2400, icon: "🍱", color: "#FF6B6B" },
  { category: "Transport", amount: 1200, icon: "🚌", color: "#4ECDC4" },
  { category: "Books & Stationery", amount: 850, icon: "📚", color: "#FFE66D" },
  { category: "Entertainment", amount: 600, icon: "🎮", color: "#A8EDEA" },
  { category: "Miscellaneous", amount: 350, icon: "🛒", color: "#C3B1E1" },
];

export const GRADES = [
  { subject: "Physics", marks: 88, total: 100, grade: "A" },
  { subject: "Mathematics", marks: 94, total: 100, grade: "A+" },
  { subject: "English", marks: 79, total: 100, grade: "B+" },
  { subject: "Chemistry", marks: 72, total: 100, grade: "B" },
  { subject: "CS", marks: 96, total: 100, grade: "A+" },
];

export const HABITS = [
  { name: "Morning Revision", streak: 12, done: true, icon: "📖" },
  { name: "Exercise 30 min", streak: 7, done: false, icon: "🏃" },
  { name: "No Social Media 10pm+", streak: 5, done: true, icon: "📵" },
  { name: "Drink 2L Water", streak: 18, done: true, icon: "💧" },
  { name: "10 Maths Problems", streak: 3, done: false, icon: "✏️" },
];

export const SCHEDULE = [
  { time: "8:00 AM", event: "Physics Lecture", type: "class", room: "LH-201" },
  { time: "10:00 AM", event: "Maths Tutorial", type: "class", room: "Lab-3" },
  { time: "12:00 PM", event: "Lunch Break", type: "break", room: "" },
  { time: "2:00 PM", event: "Java Lab", type: "lab", room: "CS-Lab" },
  { time: "4:00 PM", event: "Study: Thermodynamics", type: "study", room: "Library" },
  { time: "6:00 PM", event: "Group Assignment Review", type: "collab", room: "Room 105" },
];