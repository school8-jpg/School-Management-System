"use strict";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const KEYS = {
  students: "sms_students",
  teachers: "sms_teachers",
  classes: "sms_classes",
  attendance: "sms_attendance",
  fees: "sms_fees",
  results: "sms_results",
  exams: "sms_exams",
  notices: "sms_notices"
};

const CLASS_NAMES = ["5th", "6th", "7th", "8th", "9th", "10th"];
const DIVISIONS = ["A", "B", "C", "D", "E"];

const FIRST_NAMES = [
  "Aarav", "Sai", "Aditya", "Rohan", "Om", "Atharva", "Vedant",
  "Soham", "Krish", "Yash", "Arjun", "Ishaan", "Vihaan", "Reyansh",
  "Anaya", "Saanvi", "Aarya", "Diya", "Anvi", "Ira", "Myra",
  "Aditi", "Pooja", "Sneha", "Sakshi", "Riya", "Neha", "Kavya",
  "Tanvi", "Shravani", "Pranav", "Nikhil", "Siddharth", "Kunal",
  "Harsh", "Akash", "Rutuja", "Pallavi", "Mrunal", "Vaishnavi"
];

const LAST_NAMES = [
  "Patil", "Sharma", "Jadhav", "Pawar", "Shinde", "More",
  "Deshmukh", "Kulkarni", "Gaikwad", "Chavan", "Mane",
  "Kadam", "Bhosale", "Joshi", "Sawant", "Thorat",
  "Salunkhe", "Ghorpade", "Kale", "Pansare", "Wagh",
  "Lokhande", "Nikam", "Dhole", "Yadav", "Pawar",
  "Desai", "Mali", "Suryawanshi", "Bendale"
];

const TEACHER_NAMES = [
  "Anjali Patil", "Rahul Deshmukh", "Sneha Kulkarni",
  "Amit Jadhav", "Pooja Shinde", "Sanjay Pawar"
];

const SUBJECTS = ["English", "Mathematics", "Science", "Marathi", "Social Studies", "Computer"];

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(KEYS[key]) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(KEYS[key], JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function dateToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function seedData() {
  let students = read("students");
  let teachers = read("teachers");
  let classes = read("classes");

  // Create the initial demo data only if these stores are empty.
  if (classes.length === 0) {
    classes = [];
    CLASS_NAMES.forEach(className => {
      DIVISIONS.forEach(division => {
        classes.push({
          id: uid(),
          className,
          division,
          room: `${className}-${division}`
        });
      });
    });
    save("classes", classes);
  }

  if (students.length === 0) {
    students = [];
    let index = 0;

    CLASS_NAMES.forEach(className => {
      DIVISIONS.forEach(division => {
        for (let n = 0; n < 10; n++) {
          const first = FIRST_NAMES[index % FIRST_NAMES.length];
          const last = LAST_NAMES[(index * 7 + n * 3) % LAST_NAMES.length];
          const gender = (index % 2 === 0) ? "Male" : "Female";

          students.push({
            id: uid(),
            rollNo: n + 1,
            name: `${first} ${last}`,
            gender,
            className,
            division,
            dob: "",
            email: `student${index + 1}@school.demo`,
            phone: `90000${String(10000 + index).slice(-5)}`,
            address: "Maharashtra",
            status: "Active"
          });
          index++;
        }
      });
    });

    save("students", students);
  }

  if (teachers.length === 0) {
    teachers = CLASS_NAMES.map((className, i) => ({
      id: uid(),
      name: TEACHER_NAMES[i],
      subject: SUBJECTS[i],
      className,
      email: `teacher${i + 1}@school.demo`,
      phone: `91111${String(10000 + i).slice(-5)}`
    }));
    save("teachers", teachers);
  }

  // Initialize other modules without overwriting existing data.
  ["attendance", "fees", "results", "exams", "notices"].forEach(key => {
    if (localStorage.getItem(KEYS[key]) === null) save(key, []);
  });
}

let currentPage = "dashboard";
let currentStudentFilter = { className: "All", division: "All", search: "" };
let currentTeacherFilter = { className: "All", search: "" };

function openModal(title, content) {
  $("#mTitle").textContent = title;
  $("#mBody").innerHTML = content;
  $("#modal").classList.remove("hidden");
}

function closeModal() {
  $("#modal").classList.add("hidden");
  $("#mBody").innerHTML = "";
}

function table(headers, rows) {
  if (!rows.length) return `<div class="empty">No records found.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

function classOptions(selected = "", includeAll = false) {
  const classes = includeAll ? ["All", ...CLASS_NAMES] : CLASS_NAMES;
  return classes.map(c =>
    `<option value="${esc(c)}" ${c === selected ? "selected" : ""}>${esc(c === "All" ? "All Classes" : c)}</option>`
  ).join("");
}

function divisionOptions(selected = "", includeAll = false) {
  const divisions = includeAll ? ["All", ...DIVISIONS] : DIVISIONS;
  return divisions.map(d =>
    `<option value="${esc(d)}" ${d === selected ? "selected" : ""}>${esc(d === "All" ? "All Divisions" : d)}</option>`
  ).join("");
}

function studentName(id) {
  const s = read("students").find(x => x.id === id);
  return s ? s.name : "Unknown Student";
}

function renderDashboard() {
  const students = read("students");
  const teachers = read("teachers");
  const classes = read("classes");
  const attendance = read("attendance");
  const fees = read("fees");
  const notices = read("notices");

  const totalFees = fees.reduce((sum, f) => sum + Number(f.total || 0), 0);
  const paidFees = fees.reduce((sum, f) => sum + Number(f.paid || 0), 0);

  $("#view").innerHTML = `
    <div class="welcome">
      <h1>Welcome to EduManage 👋</h1>
      <p>Manage students, teachers, classes, attendance and school records in one place.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">👨‍🎓</span><small>Total Students</small><h2>${students.length}</h2></div>
      <div class="stat-card"><span class="stat-icon">👩‍🏫</span><small>Total Teachers</small><h2>${teachers.length}</h2></div>
      <div class="stat-card"><span class="stat-icon">🏫</span><small>Class Divisions</small><h2>${classes.length}</h2></div>
      <div class="stat-card"><span class="stat-icon">📢</span><small>Notices</small><h2>${notices.length}</h2></div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><h3>Class Overview</h3><span class="badge">5th–10th</span></div>
        <div class="division-grid">
          ${CLASS_NAMES.map(c => `
            <div class="division-card">
              <h3>${c}</h3>
              <strong>${students.filter(s => s.className === c).length}</strong>
              <div class="muted">Students</div>
            </div>`).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>School Summary</h3></div>
        <p>📋 Attendance records: <strong>${attendance.length}</strong></p>
        <p>💰 Fees recorded: <strong>${money(totalFees)}</strong></p>
        <p>✅ Fees paid: <strong>${money(paidFees)}</strong></p>
        <p>⏳ Fees remaining: <strong>${money(Math.max(0, totalFees - paidFees))}</strong></p>
        <p>👩‍🏫 One teacher assigned to each class.</p>
        <button class="btn primary" data-page="students">View Students →</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h3>Recently Added Students</h3><button class="btn primary" data-page="students">View All</button></div>
      ${table(["Roll No.", "Student Name", "Class", "Division", "Status"],
        students.slice(-8).reverse().map(s => `
          <tr>
            <td>${s.rollNo}</td><td><strong>${esc(s.name)}</strong></td>
            <td>${esc(s.className)}</td><td><span class="badge">${esc(s.division)}</span></td>
            <td><span class="badge green">${esc(s.status || "Active")}</span></td>
          </tr>`))}
    </div>`;
}

function studentForm(s = {}) {
  return `
    <form id="studentForm" class="form-grid">
      <input type="hidden" name="id" value="${esc(s.id || "")}">
      <div class="form-group"><label>Student Name *</label><input name="name" required value="${esc(s.name || "")}" placeholder="Full name"></div>
      <div class="form-group"><label>Gender *</label>
        <select name="gender" required>
          <option value="">Select Gender</option>
          ${["Male", "Female", "Other"].map(g => `<option ${s.gender === g ? "selected" : ""}>${g}</option>`).join("")}
        </select>
      </div>
      <div class="form-group"><label>Class *</label><select name="className" required>${classOptions(s.className || "5th")}</select></div>
      <div class="form-group"><label>Division *</label><select name="division" required>${divisionOptions(s.division || "A")}</select></div>
      <div class="form-group"><label>Roll Number *</label><input name="rollNo" type="number" min="1" required value="${esc(s.rollNo || "")}"></div>
      <div class="form-group"><label>Date of Birth</label><input name="dob" type="date" value="${esc(s.dob || "")}"></div>
      <div class="form-group"><label>Email</label><input name="email" type="email" value="${esc(s.email || "")}"></div>
      <div class="form-group"><label>Phone</label><input name="phone" type="tel" value="${esc(s.phone || "")}"></div>
      <div class="form-group full-width"><label>Address</label><input name="address" value="${esc(s.address || "")}"></div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Save Student</button>
        <button class="btn" type="button" id="cancelForm">Cancel</button>
      </div>
    </form>`;
}

function renderStudents() {
  const students = read("students");
  const list = students.filter(s =>
    (currentStudentFilter.className === "All" || s.className === currentStudentFilter.className) &&
    (currentStudentFilter.division === "All" || s.division === currentStudentFilter.division) &&
    `${s.name} ${s.className} ${s.division} ${s.rollNo}`.toLowerCase().includes(currentStudentFilter.search.toLowerCase())
  );

  $("#view").innerHTML = `
    <div class="section-head">
      <div><h2>Students</h2><p class="muted">Manage all student records and class divisions.</p></div>
      <button class="btn primary" data-action="add-student">＋ Add Student</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><small>Total Students</small><h2>${students.length}</h2></div>
      <div class="stat-card"><small>Classes</small><h2>6</h2></div>
      <div class="stat-card"><small>Divisions</small><h2>30</h2></div>
      <div class="stat-card"><small>Students per Division</small><h2>10*</h2></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Student List</h3><span class="badge">${list.length} records</span></div>
      <div class="toolbar">
        <input id="studentSearch" placeholder="Search student name or roll no..." value="${esc(currentStudentFilter.search)}">
        <select id="studentClassFilter">${classOptions(currentStudentFilter.className, true)}</select>
        <select id="studentDivisionFilter">${divisionOptions(currentStudentFilter.division, true)}</select>
        <button class="btn" data-action="reset-student-filter">Reset</button>
      </div>
      ${table(["Roll No.", "Name", "Class", "Division", "Gender", "Phone", "Actions"],
        list.map(s => `
          <tr>
            <td>${esc(s.rollNo)}</td>
            <td><strong>${esc(s.name)}</strong><br><small class="muted">${esc(s.email || "")}</small></td>
            <td>${esc(s.className)}</td>
            <td><span class="badge">${esc(s.division)}</span></td>
            <td>${esc(s.gender)}</td>
            <td>${esc(s.phone || "-")}</td>
            <td><div class="actions">
              <button class="small-btn" data-action="edit-student" data-id="${esc(s.id)}">Edit</button>
              <button class="small-btn danger" data-action="delete-student" data-id="${esc(s.id)}">Delete</button>
            </div></td>
          </tr>`))}
    </div>`;
}

function renderTeachers() {
  const teachers = read("teachers");
  const filter = currentTeacherFilter;
  const list = teachers.filter(t =>
    (filter.className === "All" || t.className === filter.className) &&
    `${t.name} ${t.subject} ${t.className}`.toLowerCase().includes(filter.search.toLowerCase())
  );

  $("#view").innerHTML = `
    <div class="section-head">
      <div><h2>Teachers</h2><p class="muted">One class teacher assigned to each class.</p></div>
      <button class="btn primary" data-action="add-teacher">＋ Add Teacher</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><small>Total Teachers</small><h2>${teachers.length}</h2></div>
      <div class="stat-card"><small>Classes</small><h2>6</h2></div>
      <div class="stat-card"><small>Subjects</small><h2>${new Set(teachers.map(t => t.subject)).size}</h2></div>
      <div class="stat-card"><small>Class Teacher Ratio</small><h2>1 : 1</h2></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Teacher List</h3><span class="badge">${list.length} records</span></div>
      <div class="toolbar">
        <input id="teacherSearch" placeholder="Search teacher..." value="${esc(filter.search)}">
        <select id="teacherClassFilter">${classOptions(filter.className, true)}</select>
        <button class="btn" data-action="reset-teacher-filter">Reset</button>
      </div>
      ${table(["Teacher Name", "Class", "Subject", "Email", "Phone", "Actions"],
        list.map(t => `
          <tr>
            <td><strong>${esc(t.name)}</strong></td><td>${esc(t.className)}</td>
            <td>${esc(t.subject)}</td><td>${esc(t.email || "-")}</td>
            <td>${esc(t.phone || "-")}</td>
            <td><div class="actions">
              <button class="small-btn" data-action="edit-teacher" data-id="${esc(t.id)}">Edit</button>
              <button class="small-btn danger" data-action="delete-teacher" data-id="${esc(t.id)}">Delete</button>
            </div></td>
          </tr>`))}
    </div>`;
}

function renderClasses() {
  const students = read("students");
  const teachers = read("teachers");
  const classes = read("classes");

  $("#view").innerHTML = `
    <div class="section-head">
      <div><h2>Classes & Divisions</h2><p class="muted">Six classes with five divisions each.</p></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><small>Total Classes</small><h2>6</h2></div>
      <div class="stat-card"><small>Total Divisions</small><h2>${classes.length}</h2></div>
      <div class="stat-card"><small>Total Students</small><h2>${students.length}</h2></div>
      <div class="stat-card"><small>Total Teachers</small><h2>${teachers.length}</h2></div>
    </div>
    ${CLASS_NAMES.map(c => `
      <div class="panel">
        <div class="panel-head">
          <h3>Class ${c}</h3>
          <span class="badge">${students.filter(s => s.className === c).length} students</span>
        </div>
        <div class="division-grid">
          ${DIVISIONS.map(d => {
            const count = students.filter(s => s.className === c && s.division === d).length;
            return `<div class="division-card">
              <h3>Division ${d}</h3>
              <strong>${count}</strong>
              <div class="muted">Students</div>
              <button class="small-btn" data-action="view-division" data-class="${c}" data-division="${d}">View Students</button>
            </div>`;
          }).join("")}
        </div>
        <p class="muted">Class Teacher: ${esc(teachers.find(t => t.className === c)?.name || "Not assigned")}</p>
      </div>`).join("")}`;
}

function renderAttendance() {
  const students = read("students");
  const records = read("attendance");
  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Attendance</h2><p class="muted">Record student attendance by date.</p></div></div>
    <div class="panel">
      <form id="attendanceForm" class="form-grid">
        <div class="form-group"><label>Date</label><input type="date" name="date" required value="${new Date().toISOString().slice(0, 10)}"></div>
        <div class="form-group"><label>Class</label><select name="className" required>${classOptions("5th")}</select></div>
        <div class="form-group"><label>Division</label><select name="division" required>${divisionOptions("A")}</select></div>
        <div class="form-group"><label>Student</label><select name="studentId" required>
          ${students.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${s.className} ${s.division}</option>`).join("")}
        </select></div>
        <div class="form-group"><label>Status</label><select name="status"><option>Present</option><option>Absent</option><option>Late</option></select></div>
        <div class="form-actions"><button class="btn primary">Save Attendance</button></div>
      </form>
    </div>
    <div class="panel"><h3>Attendance Records</h3>
      ${table(["Date", "Student", "Class", "Division", "Status"],
        records.slice().reverse().map(r => {
          const s = students.find(x => x.id === r.studentId);
          return `<tr><td>${esc(r.date)}</td><td>${esc(s?.name || r.studentName || "Unknown")}</td>
          <td>${esc(r.className)}</td><td>${esc(r.division)}</td><td><span class="badge ${r.status === "Present" ? "green" : "red"}">${esc(r.status)}</span></td></tr>`;
        }))}
    </div>`;
}

function renderFees() {
  const fees = read("fees");
  const students = read("students");
  const total = fees.reduce((sum, f) => sum + Number(f.total || 0), 0);
  const paid = fees.reduce((sum, f) => sum + Number(f.paid || 0), 0);

  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Fees Management</h2><p class="muted">Track total fees, paid amount and balance.</p></div></div>
    <div class="stats-grid">
      <div class="stat-card"><small>Total Fees</small><h2>${money(total)}</h2></div>
      <div class="stat-card"><small>Collected</small><h2>${money(paid)}</h2></div>
      <div class="stat-card"><small>Remaining</small><h2>${money(Math.max(0, total - paid))}</h2></div>
      <div class="stat-card"><small>Fee Records</small><h2>${fees.length}</h2></div>
    </div>
    <div class="panel">
      <h3>Add Fee Record</h3><br>
      <form id="feeForm" class="form-grid">
        <div class="form-group full-width"><label>Student</label><select name="studentId" required>
          ${students.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${s.className} ${s.division}</option>`).join("")}
        </select></div>
        <div class="form-group"><label>Total Fees (₹)</label><input name="total" type="number" min="0" required></div>
        <div class="form-group"><label>Paid Amount (₹)</label><input name="paid" type="number" min="0" required></div>
        <div class="form-actions"><button class="btn primary">Save Fee</button></div>
      </form>
    </div>
    <div class="panel"><h3>Fee Records</h3><br>
      ${table(["Student", "Class", "Total", "Paid", "Remaining", "Status"],
        fees.map(f => {
          const s = students.find(x => x.id === f.studentId);
          const remain = Math.max(0, Number(f.total) - Number(f.paid));
          return `<tr><td>${esc(s?.name || f.studentName || "Unknown")}</td>
          <td>${esc(s ? `${s.className} ${s.division}` : "-")}</td>
          <td>${money(f.total)}</td><td>${money(f.paid)}</td><td>${money(remain)}</td>
          <td><span class="badge ${remain === 0 ? "green" : "red"}">${remain === 0 ? "Paid" : "Pending"}</span></td></tr>`;
        }))}
    </div>`;
}

function renderResults() {
  const results = read("results");
  const students = read("students");
  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Results</h2><p class="muted">Enter marks and calculate percentage.</p></div></div>
    <div class="panel">
      <form id="resultForm" class="form-grid">
        <div class="form-group full-width"><label>Student</label><select name="studentId" required>
          ${students.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${s.className} ${s.division}</option>`).join("")}
        </select></div>
        <div class="form-group"><label>Exam Name</label><input name="examName" required placeholder="Unit Test 1"></div>
        ${["Maths", "English", "Science", "Computer", "Social"].map(subject => `
          <div class="form-group"><label>${subject} Marks (out of 100)</label>
          <input type="number" name="${subject.toLowerCase()}" min="0" max="100" required value="0"></div>`).join("")}
        <div class="form-actions"><button class="btn primary">Save Result</button></div>
      </form>
    </div>
    <div class="panel"><h3>Result List</h3><br>
      ${table(["Student", "Exam", "Total / 500", "Percentage", "Grade"],
        results.map(r => {
          const s = students.find(x => x.id === r.studentId);
          const marks = ["maths", "english", "science", "computer", "social"].reduce((sum, k) => sum + Number(r[k] || 0), 0);
          const pct = marks / 5;
          const grade = pct >= 90 ? "A+" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "Needs Improvement";
          return `<tr><td>${esc(s?.name || "Unknown")}</td><td>${esc(r.examName)}</td>
          <td>${marks}/500</td><td>${pct.toFixed(2)}%</td><td><span class="badge">${grade}</span></td></tr>`;
        }))}
    </div>`;
}

function renderExams() {
  const exams = read("exams");
  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Exams</h2><p class="muted">Create and manage examination schedules.</p></div>
      <button class="btn primary" data-action="add-exam">＋ Add Exam</button>
    </div>
    <div class="panel">
      ${table(["Exam", "Class", "Subject", "Date", "Time", "Duration", "Max Marks", "Actions"],
        exams.map(e => `<tr><td>${esc(e.examName)}</td><td>${esc(e.className)}</td><td>${esc(e.subject)}</td>
          <td>${esc(e.date)}</td><td>${esc(e.time)}</td><td>${esc(e.duration)} min</td><td>${esc(e.maxMarks)}</td>
          <td><button class="small-btn danger" data-action="delete-exam" data-id="${esc(e.id)}">Delete</button></td></tr>`))}
    </div>`;
}

function renderNotices() {
  const notices = read("notices");
  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Notice Board</h2><p class="muted">Share important school announcements.</p></div>
      <button class="btn primary" data-action="add-notice">＋ Add Notice</button>
    </div>
    <div class="panel">
      ${notices.length ? notices.slice().reverse().map(n => `
        <div class="notice-card">
          <span class="badge">${esc(n.category || "General")}</span>
          <h3>${esc(n.title)}</h3>
          <small class="muted">${esc(n.date)} · ${esc(n.audience || "All")}</small>
          <p>${esc(n.details)}</p>
          <button class="small-btn danger" data-action="delete-notice" data-id="${esc(n.id)}">Delete</button>
        </div>`).join("") : `<div class="empty">No notices yet. Click “Add Notice” to create one.</div>`}
    </div>`;
}

function renderReports() {
  const students = read("students");
  const teachers = read("teachers");
  const fees = read("fees");
  const results = read("results");
  const attendance = read("attendance");
  $("#view").innerHTML = `
    <div class="section-head"><div><h2>Reports</h2><p class="muted">School overview and downloadable CSV reports.</p></div></div>
    <div class="stats-grid">
      <div class="stat-card"><small>Students</small><h2>${students.length}</h2></div>
      <div class="stat-card"><small>Teachers</small><h2>${teachers.length}</h2></div>
      <div class="stat-card"><small>Attendance Records</small><h2>${attendance.length}</h2></div>
      <div class="stat-card"><small>Results</small><h2>${results.length}</h2></div>
    </div>
    <div class="panel">
      <h3>Export Data</h3><br>
      <div class="toolbar">
        <button class="btn primary" data-action="export-students">Export Students CSV</button>
        <button class="btn primary" data-action="export-teachers">Export Teachers CSV</button>
        <button class="btn primary" data-action="export-fees">Export Fees CSV</button>
        <button class="btn primary" data-action="export-attendance">Export Attendance CSV</button>
      </div>
      <p class="muted">CSV files can be opened in Excel or Google Sheets.</p>
    </div>`;
}

function navigate(page) {
  const pages = {
    dashboard: ["Dashboard", renderDashboard],
    students: ["Students", renderStudents],
    teachers: ["Teachers", renderTeachers],
    classes: ["Classes & Divisions", renderClasses],
    attendance: ["Attendance", renderAttendance],
    fees: ["Fees Management", renderFees],
    results: ["Results", renderResults],
    exams: ["Exams", renderExams],
    notices: ["Notice Board", renderNotices],
    reports: ["Reports", renderReports]
  };

  if (!pages[page]) page = "dashboard";
  currentPage = page;
  $("#pageTitle").textContent = pages[page][0];
  $$(".nav").forEach(btn => btn.classList.toggle("active", btn.dataset.p === page));
  pages[page][1]();

  const view = $("#view");
  view.classList.remove("animate-page");
  void view.offsetWidth;
  view.classList.add("animate-page");

  $("#sidebar").classList.remove("open");
  $("#overlay").classList.remove("show");
}

function showStudentForm(id = "") {
  const s = id ? read("students").find(x => x.id === id) : {};
  if (id && !s) return notify("Student not found.");
  openModal(id ? "Edit Student" : "Add Student", studentForm(s));
}

function showTeacherForm(id = "") {
  const t = id ? read("teachers").find(x => x.id === id) : {};
  if (id && !t) return notify("Teacher not found.");

  openModal(id ? "Edit Teacher" : "Add Teacher", `
    <form id="teacherForm" class="form-grid">
      <input type="hidden" name="id" value="${esc(t.id || "")}">
      <div class="form-group"><label>Teacher Name *</label><input name="name" required value="${esc(t.name || "")}"></div>
      <div class="form-group"><label>Class *</label><select name="className" required>${classOptions(t.className || "5th")}</select></div>
      <div class="form-group"><label>Subject *</label><select name="subject" required>${SUBJECTS.map(s => `<option ${t.subject === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="form-group"><label>Email</label><input name="email" type="email" value="${esc(t.email || "")}"></div>
      <div class="form-group"><label>Phone</label><input name="phone" value="${esc(t.phone || "")}"></div>
      <div class="form-actions"><button class="btn primary">Save Teacher</button><button class="btn" type="button" id="cancelForm">Cancel</button></div>
    </form>`);
}

function showExamForm() {
  openModal("Add Exam", `
    <form id="examForm" class="form-grid">
      <div class="form-group full-width"><label>Exam Name</label><input name="examName" required placeholder="Unit Test 1"></div>
      <div class="form-group"><label>Class</label><select name="className">${classOptions("5th")}</select></div>
      <div class="form-group"><label>Subject</label><select name="subject">${SUBJECTS.map(s => `<option>${s}</option>`).join("")}</select></div>
      <div class="form-group"><label>Date</label><input name="date" type="date" required></div>
      <div class="form-group"><label>Time</label><input name="time" type="time" required></div>
      <div class="form-group"><label>Duration (minutes)</label><input name="duration" type="number" min="1" value="60" required></div>
      <div class="form-group"><label>Maximum Marks</label><input name="maxMarks" type="number" min="1" value="100" required></div>
      <div class="form-actions"><button class="btn primary">Save Exam</button></div>
    </form>`);
}

function showNoticeForm() {
  openModal("Create Notice", `
    <form id="noticeForm" class="form-grid">
      <div class="form-group full-width"><label>Notice Title</label><input name="title" required></div>
      <div class="form-group"><label>Category</label><select name="category"><option>General</option><option>Exam</option><option>Holiday</option><option>Event</option><option>Urgent</option></select></div>
      <div class="form-group"><label>Audience</label><select name="audience"><option>All</option><option>Students</option><option>Teachers</option><option>Parents</option></select></div>
      <div class="form-group full-width"><label>Details</label><textarea name="details" rows="4" required></textarea></div>
      <div class="form-actions"><button class="btn primary">Publish Notice</button></div>
    </form>`);
}

function exportCSV(name, data) {
  if (!data.length) return notify("No records to export.");
  const headers = [...new Set(data.flatMap(row => Object.keys(row)))];
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  notify("CSV downloaded.");
}

document.addEventListener("submit", event => {
  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());

  if (form.id === "loginForm") {
    event.preventDefault();
    if (data.lu === "admin" && data.lp === "admin123") {
      localStorage.setItem("sms_logged_in", "true");
      $("#login").classList.add("hidden");
      $("#app").classList.remove("hidden");
      navigate("dashboard");
      notify("Login successful!");
    } else {
      $("#loginErr").textContent = "Incorrect username or password.";
    }
  }

  if (form.id === "studentForm") {
    event.preventDefault();
    let students = read("students");
    const existing = data.id ? students.find(s => s.id === data.id) : null;

    const student = {
      ...existing,
      ...data,
      id: data.id || uid(),
      rollNo: Number(data.rollNo),
      status: existing?.status || "Active"
    };

    const duplicate = students.some(s =>
      s.id !== student.id &&
      s.className === student.className &&
      s.division === student.division &&
      Number(s.rollNo) === student.rollNo
    );
    if (duplicate) return notify("This roll number already exists in that division.");

    if (data.id) students = students.map(s => s.id === data.id ? student : s);
    else students.push(student);

    save("students", students);
    closeModal();
    notify(data.id ? "Student updated!" : "Student added!");
    navigate("students");
  }

  if (form.id === "teacherForm") {
    event.preventDefault();
    let teachers = read("teachers");
    const existing = data.id ? teachers.find(t => t.id === data.id) : null;

    if (!data.id && teachers.some(t => t.className === data.className)) {
      return notify("A teacher is already assigned to this class. Edit that teacher instead.");
    }

    const teacher = { ...existing, ...data, id: data.id || uid() };
    if (data.id) teachers = teachers.map(t => t.id === data.id ? teacher : t);
    else teachers.push(teacher);

    save("teachers", teachers);
    closeModal();
    notify("Teacher saved!");
    navigate("teachers");
  }

  if (form.id === "attendanceForm") {
    event.preventDefault();
    const student = read("students").find(s => s.id === data.studentId);
    const records = read("attendance");
    records.push({
      id: uid(),
      date: data.date,
      className: student?.className || data.className,
      division: student?.division || data.division,
      studentId: data.studentId,
      status: data.status
    });
    save("attendance", records);
    notify("Attendance saved!");
    navigate("attendance");
  }

  if (form.id === "feeForm") {
    event.preventDefault();
    const total = Number(data.total);
    const paid = Number(data.paid);
    if (paid > total) return notify("Paid amount cannot exceed total fees.");

    const student = read("students").find(s => s.id === data.studentId);
    const fees = read("fees");
    fees.push({
      id: uid(),
      studentId: data.studentId,
      studentName: student?.name || "",
      total,
      paid
    });
    save("fees", fees);
    notify("Fee record saved!");
    navigate("fees");
  }

  if (form.id === "resultForm") {
    event.preventDefault();
    const keys = ["maths", "english", "science", "computer", "social"];
    for (const k of keys) {
      if (Number(data[k]) < 0 || Number(data[k]) > 100) return notify("Marks must be between 0 and 100.");
    }
    const results = read("results");
    results.push({ id: uid(), ...data });
    save("results", results);
    notify("Result saved!");
    navigate("results");
  }

  if (form.id === "examForm") {
    event.preventDefault();
    const exams = read("exams");
    exams.push({ id: uid(), ...data });
    save("exams", exams);
    closeModal();
    notify("Exam added!");
    navigate("exams");
  }

  if (form.id === "noticeForm") {
    event.preventDefault();
    const notices = read("notices");
    notices.push({ id: uid(), ...data, date: new Date().toISOString().slice(0, 10) });
    save("notices", notices);
    closeModal();
    notify("Notice published!");
    navigate("notices");
  }
});

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-p], [data-page]");
  if (nav) {
    event.preventDefault();
    navigate(nav.dataset.p || nav.dataset.page);
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const id = actionEl.dataset.id;

  switch (action) {
    case "add-student": showStudentForm(); break;
    case "edit-student": showStudentForm(id); break;

    case "delete-student": {
      if (!confirm("Delete this student?")) break;
      save("students", read("students").filter(s => s.id !== id));
      notify("Student deleted.");
      navigate("students");
      break;
    }

    case "add-teacher": showTeacherForm(); break;
    case "edit-teacher": showTeacherForm(id); break;

    case "delete-teacher": {
      if (!confirm("Delete this teacher?")) break;
      save("teachers", read("teachers").filter(t => t.id !== id));
      notify("Teacher deleted.");
      navigate("teachers");
      break;
    }

    case "view-division":
      currentStudentFilter = { className: actionEl.dataset.class, division: actionEl.dataset.division, search: "" };
      navigate("students");
      break;

    case "reset-student-filter":
      currentStudentFilter = { className: "All", division: "All", search: "" };
      navigate("students");
      break;

    case "reset-teacher-filter":
      currentTeacherFilter = { className: "All", search: "" };
      navigate("teachers");
      break;

    case "add-exam": showExamForm(); break;

    case "delete-exam": {
      if (!confirm("Delete this exam?")) break;
      save("exams", read("exams").filter(e => e.id !== id));
      navigate("exams");
      notify("Exam deleted.");
      break;
    }

    case "add-notice": showNoticeForm(); break;

    case "delete-notice": {
      if (!confirm("Delete this notice?")) break;
      save("notices", read("notices").filter(n => n.id !== id));
      navigate("notices");
      notify("Notice deleted.");
      break;
    }

    case "export-students": exportCSV("students.csv", read("students")); break;
    case "export-teachers": exportCSV("teachers.csv", read("teachers")); break;
    case "export-fees": exportCSV("fees.csv", read("fees")); break;
    case "export-attendance": exportCSV("attendance.csv", read("attendance")); break;
  }

  if (actionEl.id === "cancelForm") closeModal();
});

document.addEventListener("input", event => {
  if (event.target.id === "studentSearch") {
    currentStudentFilter.search = event.target.value;
    renderStudents();
    const input = $("#studentSearch");
    input?.focus();
    if (input) input.setSelectionRange(input.value.length, input.value.length);
  }

  if (event.target.id === "teacherSearch") {
    currentTeacherFilter.search = event.target.value;
    renderTeachers();
    const input = $("#teacherSearch");
    input?.focus();
    if (input) input.setSelectionRange(input.value.length, input.value.length);
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "studentClassFilter") {
    currentStudentFilter.className = event.target.value;
    if (currentStudentFilter.className === "All") currentStudentFilter.division = "All";
    renderStudents();
  }

  if (event.target.id === "studentDivisionFilter") {
    currentStudentFilter.division = event.target.value;
    renderStudents();
  }

  if (event.target.id === "teacherClassFilter") {
    currentTeacherFilter.className = event.target.value;
    renderTeachers();
  }
});

$("#mClose").addEventListener("click", closeModal);
$("#modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

$("#menuBtn").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
  $("#overlay").classList.toggle("show");
});
$("#overlay").addEventListener("click", () => {
  $("#sidebar").classList.remove("open");
  $("#overlay").classList.remove("show");
});

$("#logout").addEventListener("click", () => {
  localStorage.removeItem("sms_logged_in");
  $("#app").classList.add("hidden");
  $("#login").classList.remove("hidden");
  $("#lp").value = "";
  $("#loginErr").textContent = "";
});

$("#today").textContent = dateToday();

seedData();

if (localStorage.getItem("sms_logged_in") === "true") {
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
  navigate("dashboard");
}
