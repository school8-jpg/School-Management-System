/* =====================================================
   SCHOOL MANAGEMENT SYSTEM
   Project Members: Shravani Pawar & Tanvi Bahirwade
   HTML + CSS + Vanilla JavaScript + LocalStorage
===================================================== */

"use strict";

/* ==================== HELPERS ==================== */

const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const today = () => new Date().toISOString().slice(0, 10);

const uid = (prefix = "REC") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36).slice(2, 7)}`;

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getStore = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem("sms_" + key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const setStore = (key, value) => {
  localStorage.setItem("sms_" + key, JSON.stringify(value));
};

function notify(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function makeId(prefix) {
  return uid(prefix);
}

function setTitle(title) {
  const el = $("#pageTitle");
  if (el) el.textContent = title;
}

function emptyMessage(message) {
  return `<div class="empty-state"><div class="empty-icon">📂</div>
    <h3>${escapeHTML(message)}</h3>
    <p>Use the Add button to create a new record.</p></div>`;
}

function button(label, action, extraClass = "secondary") {
  return `<button type="button" class="btn ${extraClass}"
    data-action="${escapeHTML(action)}">${escapeHTML(label)}</button>`;
}

function searchBox(placeholder = "Search records...") {
  return `<input class="search-input" id="pageSearch"
    type="search" placeholder="${escapeHTML(placeholder)}">`;
}

function table(headers, rows) {
  if (!rows.length) return emptyMessage("No records found");

  return `<div class="table-wrap"><table>
    <thead><tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table></div>`;
}

function actionButtons(type, id) {
  return `<div class="actions">
    <button type="button" class="btn small secondary"
      data-action="edit" data-type="${escapeHTML(type)}"
      data-id="${escapeHTML(id)}">Edit</button>
    <button type="button" class="btn small danger"
      data-action="delete" data-type="${escapeHTML(type)}"
      data-id="${escapeHTML(id)}">Delete</button>
  </div>`;
}

function card(title, value, icon, description = "") {
  return `<div class="stat-card">
    <div class="stat-icon">${icon}</div>
    <div><p>${escapeHTML(title)}</p>
    <h3>${escapeHTML(value)}</h3>
    <small>${escapeHTML(description)}</small></div>
  </div>`;
}

function pageHeader(title, subtitle, action = "") {
  return `<div class="page-head">
    <div><h2>${escapeHTML(title)}</h2>
    <p>${escapeHTML(subtitle)}</p></div>
    ${action}
  </div>`;
}

function field(label, name, value = "", type = "text", required = true) {
  const val = escapeHTML(value);
  const req = required ? "required" : "";

  if (type === "textarea") {
    return `<label class="field">${escapeHTML(label)}
      <textarea name="${escapeHTML(name)}" ${req}>${val}</textarea>
    </label>`;
  }

  return `<label class="field">${escapeHTML(label)}
    <input name="${escapeHTML(name)}" type="${escapeHTML(type)}"
      value="${val}" ${req}>
  </label>`;
}

function selectField(label, name, options, value = "", required = true) {
  return `<label class="field">${escapeHTML(label)}
    <select name="${escapeHTML(name)}" ${required ? "required" : ""}>
      <option value="">Select ${escapeHTML(label)}</option>
      ${options.map(option => {
        const v = typeof option === "string" ? option : option.value;
        const text = typeof option === "string" ? option : option.label;
        return `<option value="${escapeHTML(v)}"
          ${String(value) === String(v) ? "selected" : ""}>
          ${escapeHTML(text)}
        </option>`;
      }).join("")}
    </select>
  </label>`;
}

function openModal(title, body) {
  $("#mTitle").textContent = title;
  $("#mBody").innerHTML = body;
  $("#modal").hidden = false;
  $("#modal").classList.add("open");
}

function closeModal() {
  $("#modal").hidden = true;
  $("#modal").classList.remove("open");
  $("#mBody").innerHTML = "";
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

/* ==================== DATA ==================== */

const DB = {
  students: {
    key: "students",
    title: "Students",
    prefix: "STU",
    fields: [
      ["Student Name", "name", "text"],
      ["Gender", "gender", "select", ["Male", "Female", "Other"]],
      ["Date of Birth", "dob", "date"],
      ["Class", "className", "text"],
      ["Email", "email", "email", false],
      ["Phone", "phone", "tel"]
    ]
  },

  teachers: {
    key: "teachers",
    title: "Teachers",
    prefix: "TCH",
    fields: [
      ["Teacher Name", "name", "text"],
      ["Gender", "gender", "select", ["Male", "Female", "Other"]],
      ["Subject", "subject", "text"],
      ["Email", "email", "email", false],
      ["Phone", "phone", "tel"]
    ]
  },

  classes: {
    key: "classes",
    title: "Classes",
    prefix: "CLS",
    fields: [
      ["Class Name", "className", "text"],
      ["Section", "section", "text"],
      ["Class Teacher", "teacher", "text"],
      ["Room Number", "room", "text"]
    ]
  },

  fees: {
    key: "fees",
    title: "Fees",
    prefix: "FEE",
    fields: [
      ["Student ID", "studentId", "text"],
      ["Student Name", "studentName", "text"],
      ["Total Fees (₹)", "total", "number"],
      ["Amount Paid (₹)", "paid", "number"]
    ]
  },

  results: {
    key: "results",
    title: "Results",
    prefix: "RES",
    fields: [
      ["Student ID", "studentId", "text"],
      ["Student Name", "studentName", "text"],
      ["Exam Name", "examName", "text"],
      ["Mathematics Marks", "maths", "number"],
      ["English Marks", "english", "number"],
      ["Science Marks", "science", "number"],
      ["Computer Marks", "computer", "number"],
      ["Social Studies Marks", "social", "number"]
    ]
  },

  exams: {
    key: "exams",
    title: "Exams",
    prefix: "EXM",
    fields: [
      ["Exam Name", "examName", "text"],
      ["Class", "className", "text"],
      ["Subject", "subject", "text"],
      ["Exam Date", "examDate", "date"],
      ["Start Time", "startTime", "time"],
      ["Duration (minutes)", "duration", "number"],
      ["Maximum Marks", "maxMarks", "number"],
      ["Room Number", "room", "text"],
      ["Instructions", "instructions", "textarea", false]
    ]
  },

  notices: {
    key: "notices",
    title: "Notices",
    prefix: "NOT",
    fields: [
      ["Notice Title", "title", "text"],
      ["Category", "category", "select",
        ["General", "Exam", "Holiday", "Event", "Important"]],
      ["Publish Date", "date", "date"],
      ["Audience", "audience", "select",
        ["All", "Students", "Teachers", "Parents"]],
      ["Notice Details", "details", "textarea"]
    ]
  }
};

function readRecords(type) {
  return getStore(DB[type].key);
}

function writeRecords(type, records) {
  setStore(DB[type].key, records);
}

function getRecord(type, id) {
  return readRecords(type).find(record => record.id === id);
}

/* ==================== LOGIN ==================== */

function showApp() {
  $("#login").hidden = true;
  $("#app").hidden = false;

  if (!localStorage.getItem("sms_logged_in")) {
    localStorage.setItem("sms_logged_in", "true");
  }

  navigate("dashboard");
}

function showLogin() {
  $("#app").hidden = true;
  $("#login").hidden = false;
}

$("#loginForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const username = $("#lu").value.trim();
  const password = $("#lp").value;
  const error = $("#loginErr");

  // Demo login only; replace with server authentication for real deployment.
  if (username === "admin" && password === "admin123") {
    error.hidden = true;
    localStorage.setItem("sms_logged_in", "true");
    showApp();
  } else {
    error.hidden = false;
    error.textContent = "Incorrect username or password.";
  }
});

$("#togglePw")?.addEventListener("click", () => {
  const input = $("#lp");
  input.type = input.type === "password" ? "text" : "password";
  $("#togglePw").textContent = input.type === "password" ? "Show" : "Hide";
});

$("#logout")?.addEventListener("click", () => {
  localStorage.removeItem("sms_logged_in");
  closeSidebar();
  showLogin();
});

/* ==================== NAVIGATION ==================== */

let currentPage = "dashboard";

const pageTitles = {
  dashboard: "Dashboard",
  students: "Students",
  teachers: "Teachers",
  classes: "Classes",
  attendance: "Attendance",
  fees: "Fees Management",
  results: "Results",
  exams: "Exam Management",
  "exam-form": "Create Exam Form",
  "exam-list": "Exam Form List",
  notices: "Notice Board",
  "notice-form": "Add Notice",
  reports: "Reports"
};

function navigate(page, options = {}) {
  const validPages = Object.keys(pageTitles);
  if (!validPages.includes(page)) page = "dashboard";

  currentPage = page;

  setTitle(pageTitles[page]);

  $$(".nav a[data-p]").forEach(link => {
    link.classList.toggle("active", link.dataset.p === page);
  });

  closeSidebar();

  switch (page) {
    case "dashboard":
      renderDashboard();
      break;
    case "students":
      renderStudents();
      break;
    case "teachers":
      renderTeachers();
      break;
    case "classes":
      renderGeneric("classes");
      break;
    case "attendance":
      renderAttendance();
      break;
    case "fees":
      renderGeneric("fees");
      break;
    case "results":
      renderResults();
      break;
    case "exams":
    case "exam-list":
      renderExams();
      break;
    case "exam-form":
      renderExamForm();
      break;
    case "notices":
      renderNotices();
      break;
    case "notice-form":
      renderNoticeForm();
      break;
    case "reports":
      renderReports();
      break;
  }

  if (options.action === "add") {
    if (page === "students") openRecordForm("students");
    if (page === "teachers") openRecordForm("teachers");
  }
}

document.addEventListener("click", event => {
  const link = event.target.closest("[data-p]");
  if (!link) return;

  event.preventDefault();

  navigate(link.dataset.p, {
    action: link.dataset.action || ""
  });
});

/* ==================== SIDEBAR ==================== */

function openSidebar() {
  $(".sidebar")?.classList.add("open");
  $("#overlay")?.classList.add("show");
}

function closeSidebar() {
  $(".sidebar")?.classList.remove("open");
  $("#overlay")?.classList.remove("show");
}

$("#menuBtn")?.addEventListener("click", openSidebar);
$("#overlay")?.addEventListener("click", closeSidebar);

/* ==================== DASHBOARD ==================== */

function renderDashboard() {
  const students = readRecords("students");
  const teachers = readRecords("teachers");
  const classes = readRecords("classes");
  const fees = readRecords("fees");
  const exams = readRecords("exams");
  const notices = readRecords("notices");

  const totalFees = fees.reduce((sum, item) => sum + number(item.total), 0);
  const paidFees = fees.reduce((sum, item) => sum + number(item.paid), 0);
  const remaining = Math.max(0, totalFees - paidFees);

  const recentNotices = [...notices]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4);

  $("#view").innerHTML = `
    ${pageHeader("School Dashboard",
      "Overview of your school's records and activities.")}

    <div class="stats-grid">
      ${card("Total Students", students.length, "🎓", "Registered students")}
      ${card("Total Teachers", teachers.length, "👨‍🏫", "Registered teachers")}
      ${card("Total Classes", classes.length, "🏫", "Created classes")}
      ${card("Examinations", exams.length, "📝", "Exam forms created")}
      ${card("Fees Collected", money(paidFees), "💰", "Recorded payments")}
      ${card("Fees Remaining", money(remaining), "📊", "Based on fee records")}
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head">
          <h3>Quick Actions</h3>
        </div>
        <div class="quick-actions">
          ${button("+ Add Student", "add-student", "primary")}
          ${button("+ Add Teacher", "add-teacher", "primary")}
          ${button("+ Create Exam", "new-exam", "secondary")}
          ${button("+ Add Notice", "new-notice", "secondary")}
          ${button("View Reports", "open-reports", "secondary")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h3>Latest Notices</h3></div>
        ${recentNotices.length ? recentNotices.map(n => `
          <div class="notice-mini">
            <strong>${escapeHTML(n.title)}</strong>
            <p>${escapeHTML(n.date || "")} · ${escapeHTML(n.category || "General")}</p>
          </div>
        `).join("") : emptyMessage("No notices published")}
      </section>
    </div>
  `;
}

/* ==================== GENERIC CRUD ==================== */

function recordFields(type, record = {}) {
  const config = DB[type];

  return config.fields.map(([label, name, kind, options, required]) => {
    const isRequired = required !== false;
    const value = record[name] ?? "";

    if (kind === "select") {
      return selectField(label, name, options, value, isRequired);
    }

    return field(label, name, value, kind, isRequired);
  }).join("");
}

function openRecordForm(type, id = "") {
  const config = DB[type];
  const record = id ? getRecord(type, id) : null;

  if (id && !record) {
    notify("Record not found.");
    return;
  }

  openModal(
    `${record ? "Edit" : "Add"} ${config.title.slice(0, -1)}`,
    `<form id="recordForm" class="form-grid">
      ${recordFields(type, record || {})}
      <div class="form-actions">
        <button type="button" class="btn secondary" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn primary">${record ? "Save Changes" : "Save Record"}</button>
      </div>
    </form>`
  );

  $("#recordForm").addEventListener("submit", event => {
    event.preventDefault();

    const data = formData(event.currentTarget);

    if (type === "fees") {
      data.total = Math.max(0, number(data.total));
      data.paid = Math.max(0, number(data.paid));

      if (data.paid > data.total) {
        notify("Paid amount cannot exceed total fees.");
        return;
      }

      data.remaining = data.total - data.paid;
      data.status = data.remaining === 0 ? "Paid" :
        data.paid > 0 ? "Partial" : "Unpaid";
    }

    if (type === "results") {
      const subjects = ["maths", "english", "science", "computer", "social"];
      for (const subject of subjects) {
        data[subject] = number(data[subject]);

        if (data[subject] < 0 || data[subject] > 100) {
          notify("Marks must be between 0 and 100.");
          return;
        }
      }

      data.total = subjects.reduce((sum, subject) => sum + data[subject], 0);
      data.percentage = (data.total / 500 * 100).toFixed(2);
      data.grade = gradeFromPercentage(number(data.percentage));
    }

    const records = readRecords(type);

    if (record) {
      const index = records.findIndex(item => item.id === id);
      records[index] = { ...records[index], ...data };
    } else {
      data.id = makeId(config.prefix);
      data.createdAt = new Date().toISOString();
      records.unshift(data);
    }

    writeRecords(type, records);
    closeModal();
    navigate(currentPage);
    notify(record ? "Record updated successfully." : "Record added successfully.");
  });
}

function renderGeneric(type) {
  const config = DB[type];
  const records = readRecords(type);

  $("#view").innerHTML = `
    ${pageHeader(
      config.title,
      `Manage ${config.title.toLowerCase()} records.`,
      button(`+ Add ${config.title.slice(0, -1)}`, `add-${type}`, "primary")
    )}

    <section class="panel">
      <div class="toolbar">
        ${searchBox(`Search ${config.title.toLowerCase()}...`)}
        <span class="record-count">${records.length} records</span>
      </div>
      <div id="recordsTable"></div>
    </section>
  `;

  const columns = {
    classes: [
      ["className", "Class"],
      ["section", "Section"],
      ["teacher", "Class Teacher"],
      ["room", "Room"]
    ],
    fees: [
      ["studentId", "Student ID"],
      ["studentName", "Student Name"],
      ["total", "Total Fees"],
      ["paid", "Paid"],
      ["remaining", "Remaining"],
      ["status", "Status"]
    ]
  }[type];

  function draw(filter = "") {
    const filtered = readRecords(type).filter(record =>
      Object.values(record).join(" ").toLowerCase().includes(filter.toLowerCase())
    );

    const rows = filtered.map(record => `
      <tr>
        ${columns.map(([key, label]) => {
          let value = record[key] ?? "";
          if (["total", "paid", "remaining"].includes(key)) value = money(value);
          return `<td>${escapeHTML(value)}</td>`;
        }).join("")}
        <td>${actionButtons(type, record.id)}</td>
      </tr>
    `);

    $("#recordsTable").innerHTML = table(
      [...columns.map(c => c[1]), "Actions"],
      rows
    );
  }

  draw();

  $("#pageSearch").addEventListener("input", event => draw(event.target.value));
}

/* ==================== STUDENTS ==================== */

function renderStudents() {
  const students = readRecords("students");

  $("#view").innerHTML = `
    ${pageHeader("Student Management",
      "Add students in the form and manage the student list separately.",
      button("+ Add Student", "add-student", "primary"))}

    <div class="section-tabs">
      <button class="tab-btn active" data-action="student-tab-add">Add Student</button>
      <button class="tab-btn" data-action="student-tab-list">Student List</button>
    </div>

    <section id="studentAddSection" class="panel">
      <div class="panel-head"><h3>Register a New Student</h3></div>
      <form id="studentQuickForm" class="form-grid">
        ${recordFields("students")}
        <div class="form-actions">
          <button class="btn primary" type="submit">Save Student</button>
          <button class="btn secondary" type="reset">Clear Form</button>
        </div>
      </form>
    </section>

    <section id="studentListSection" class="panel">
      <div class="panel-head"><h3>Student List</h3>
        <span class="record-count">${students.length} students</span>
      </div>
      <div class="toolbar">
        ${searchBox("Search by name, ID, class or phone...")}
      </div>
      <div id="studentTable"></div>
    </section>
  `;

  function draw(filter = "") {
    const data = readRecords("students").filter(s =>
      Object.values(s).join(" ").toLowerCase().includes(filter.toLowerCase())
    );

    $("#studentTable").innerHTML = table(
      ["Student ID", "Name", "Gender", "Class", "Phone", "Actions"],
      data.map(s => `
        <tr>
          <td>${escapeHTML(s.id)}</td>
          <td>${escapeHTML(s.name)}</td>
          <td>${escapeHTML(s.gender)}</td>
          <td>${escapeHTML(s.className)}</td>
          <td>${escapeHTML(s.phone)}</td>
          <td>
            ${actionButtons("students", s.id)}
            <button class="btn small secondary" data-action="print-student"
              data-id="${escapeHTML(s.id)}">Print</button>
          </td>
        </tr>
      `)
    );
  }

  draw();

  $("#pageSearch").addEventListener("input", e => draw(e.target.value));

  $("#studentQuickForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.id = makeId("STU");
    data.createdAt = new Date().toISOString();

    const records = readRecords("students");
    records.unshift(data);
    writeRecords("students", records);

    event.currentTarget.reset();
    draw($("#pageSearch").value);
    notify("Student added successfully.");
    renderStudents();
  });
}

/* ==================== TEACHERS ==================== */

function renderTeachers() {
  const teachers = readRecords("teachers");

  $("#view").innerHTML = `
    ${pageHeader("Teacher Management",
      "Register teachers and manage the teacher list separately.",
      button("+ Add Teacher", "add-teacher", "primary"))}

    <div class="section-tabs">
      <button class="tab-btn active" data-action="teacher-tab-add">Add Teacher</button>
      <button class="tab-btn" data-action="teacher-tab-list">Teacher List</button>
    </div>

    <section id="teacherAddSection" class="panel">
      <div class="panel-head"><h3>Register a New Teacher</h3></div>
      <form id="teacherQuickForm" class="form-grid">
        ${recordFields("teachers")}
        <div class="form-actions">
          <button class="btn primary" type="submit">Save Teacher</button>
          <button class="btn secondary" type="reset">Clear Form</button>
        </div>
      </form>
    </section>

    <section id="teacherListSection" class="panel">
      <div class="panel-head"><h3>Teacher List</h3>
        <span class="record-count">${teachers.length} teachers</span>
      </div>
      <div class="toolbar">
        ${searchBox("Search by name, subject or phone...")}
      </div>
      <div id="teacherTable"></div>
    </section>
  `;

  function draw(filter = "") {
    const data = readRecords("teachers").filter(t =>
      Object.values(t).join(" ").toLowerCase().includes(filter.toLowerCase())
    );

    $("#teacherTable").innerHTML = table(
      ["Teacher ID", "Name", "Gender", "Subject", "Phone", "Actions"],
      data.map(t => `
        <tr>
          <td>${escapeHTML(t.id)}</td>
          <td>${escapeHTML(t.name)}</td>
          <td>${escapeHTML(t.gender)}</td>
          <td>${escapeHTML(t.subject)}</td>
          <td>${escapeHTML(t.phone)}</td>
          <td>${actionButtons("teachers", t.id)}</td>
        </tr>
      `)
    );
  }

  draw();

  $("#pageSearch").addEventListener("input", e => draw(e.target.value));

  $("#teacherQuickForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.id = makeId("TCH");
    data.createdAt = new Date().toISOString();

    const records = readRecords("teachers");
    records.unshift(data);
    writeRecords("teachers", records);

    event.currentTarget.reset();
    draw($("#pageSearch").value);
    notify("Teacher added successfully.");
    renderTeachers();
  });
}

/* ==================== ATTENDANCE ==================== */

function renderAttendance() {
  const students = readRecords("students");
  const attendance = getStore("attendance", {});

  $("#view").innerHTML = `
    ${pageHeader("Attendance Management",
      "Record and review student attendance.")}

    <section class="panel">
      <form id="attendanceForm" class="form-grid">
        ${field("Attendance Date", "date", today(), "date")}
        ${selectField("Class", "className",
          [...new Set(students.map(s => s.className).filter(Boolean))])}
        <div class="form-actions">
          <button class="btn primary" type="submit">Load Students</button>
        </div>
      </form>
    </section>

    <section id="attendanceList" class="panel">
      ${emptyMessage("Select a date and class to load students")}
    </section>
  `;

  $("#attendanceForm").addEventListener("submit", event => {
    event.preventDefault();

    const data = formData(event.currentTarget);
    const list = students.filter(s => s.className === data.className);

    if (!list.length) {
      $("#attendanceList").innerHTML = emptyMessage("No students found in this class");
      return;
    }

    const key = `${data.date}_${data.className}`;
    const saved = attendance[key] || {};

    $("#attendanceList").innerHTML = `
      <div class="panel-head"><h3>Attendance: ${escapeHTML(data.className)}</h3>
        <span>${escapeHTML(data.date)}</span></div>
      <form id="attendanceSaveForm">
        ${table(["Student ID", "Student Name", "Status"],
          list.map(s => `
            <tr>
              <td>${escapeHTML(s.id)}</td>
              <td>${escapeHTML(s.name)}</td>
              <td>
                <select name="${escapeHTML(s.id)}">
                  ${["Present", "Absent", "Late"].map(status => `
                    <option ${((saved[s.id] || "Present") === status) ? "selected" : ""}
                      value="${status}">${status}</option>
                  `).join("")}
                </select>
              </td>
            </tr>
          `))}
        <button class="btn primary" type="submit">Save Attendance</button>
      </form>
    `;

    $("#attendanceSaveForm").addEventListener("submit", e => {
      e.preventDefault();
      const values = formData(e.currentTarget);
      const all = getStore("attendance", {});
      all[key] = values;
      setStore("attendance", all);
      notify("Attendance saved successfully.");
    });
  });
}

/* ==================== RESULTS ==================== */

function gradeFromPercentage(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 35) return "Pass";
  return "Fail";
}

function renderResults() {
  const records = readRecords("results");

  $("#view").innerHTML = `
    ${pageHeader("Examination Results",
      "Enter marks and automatically calculate total, percentage and grade.",
      button("+ Add Result", "add-results", "primary"))}

    <section class="panel">
      <div class="toolbar">${searchBox("Search student or exam...")}</div>
      <div id="resultsTable"></div>
    </section>
  `;

  function draw(filter = "") {
    const data = readRecords("results").filter(r =>
      Object.values(r).join(" ").toLowerCase().includes(filter.toLowerCase())
    );

    $("#resultsTable").innerHTML = table(
      ["Student ID", "Student Name", "Exam", "Total / 500", "Percentage", "Grade", "Actions"],
      data.map(r => `
        <tr>
          <td>${escapeHTML(r.studentId)}</td>
          <td>${escapeHTML(r.studentName)}</td>
          <td>${escapeHTML(r.examName)}</td>
          <td>${escapeHTML(r.total)}</td>
          <td>${escapeHTML(r.percentage)}%</td>
          <td>${escapeHTML(r.grade)}</td>
          <td>${actionButtons("results", r.id)}</td>
        </tr>
      `)
    );
  }

  draw();
  $("#pageSearch").addEventListener("input", e => draw(e.target.value));
}

/* ==================== EXAM MANAGEMENT ==================== */

function renderExams() {
  const exams = readRecords("exams");

  $("#view").innerHTML = `
    ${pageHeader("Exam Management",
      "Create examination forms, manage exams and print forms.",
      button("+ Create Exam Form", "new-exam", "primary"))}

    <div class="stats-grid">
      ${card("Total Exams", exams.length, "📝", "Exam forms created")}
      ${card("Upcoming Exams",
        exams.filter(e => e.examDate >= today()).length,
        "📅", "Today and future dates")}
      ${card("Past Exams",
        exams.filter(e => e.examDate < today()).length,
        "📚", "Earlier exam dates")}
    </div>

    <section class="panel">
      <div class="panel-head"><h3>Exam Form List</h3></div>
      <div class="toolbar">${searchBox("Search exam name, class or subject...")}</div>
      <div id="examTable"></div>
    </section>
  `;

  function draw(filter = "") {
    const data = readRecords("exams").filter(e =>
      Object.values(e).join(" ").toLowerCase().includes(filter.toLowerCase())
    );

    $("#examTable").innerHTML = table(
      ["Exam ID", "Exam Name", "Class", "Subject", "Date", "Time", "Actions"],
      data.map(e => `
        <tr>
          <td>${escapeHTML(e.id)}</td>
          <td>${escapeHTML(e.examName)}</td>
          <td>${escapeHTML(e.className)}</td>
          <td>${escapeHTML(e.subject)}</td>
          <td>${escapeHTML(e.examDate)}</td>
          <td>${escapeHTML(e.startTime)}</td>
          <td>
            ${actionButtons("exams", e.id)}
            <button class="btn small secondary" data-action="print-exam"
              data-id="${escapeHTML(e.id)}">Print Form</button>
          </td>
        </tr>
      `)
    );
  }

  draw();
  $("#pageSearch").addEventListener("input", e => draw(e.target.value));
}

function renderExamForm(id = "") {
  const record = id ? getRecord("exams", id) : null;

  $("#view").innerHTML = `
    ${pageHeader(record ? "Edit Exam Form" : "Create Exam Form",
      "Fill in the examination details. You can print the form after saving.")}

    <section class="panel">
      <form id="examForm" class="form-grid">
        ${recordFields("exams", record || {})}
        <div class="form-actions">
          <button type="submit" class="btn primary">
            ${record ? "Update Exam" : "Save Exam Form"}
          </button>
          <button type="reset" class="btn secondary">Clear</button>
          <button type="button" class="btn secondary"
            data-action="open-exams">Back to Exam List</button>
        </div>
      </form>
    </section>
  `;

  $("#examForm").addEventListener("submit", event => {
    event.preventDefault();

    const data = formData(event.currentTarget);
    data.duration = number(data.duration);
    data.maxMarks = number(data.maxMarks);

    if (data.duration <= 0 || data.maxMarks <= 0) {
      notify("Duration and maximum marks must be greater than zero.");
      return;
    }

    const records = readRecords("exams");

    if (record) {
      const index = records.findIndex(e => e.id === id);
      records[index] = { ...records[index], ...data };
    } else {
      data.id = makeId("EXM");
      data.createdAt = new Date().toISOString();
      records.unshift(data);
    }

    writeRecords("exams", records);
    notify("Exam form saved successfully.");

    navigate("exams");
  });
}

/* ==================== NOTICE BOARD ==================== */

function renderNotices() {
  const notices = readRecords("notices");

  $("#view").innerHTML = `
    ${pageHeader("Notice Board",
      "Publish and manage school announcements.",
      button("+ Add Notice", "new-notice", "primary"))}

    <section class="panel">
      <div class="toolbar">${searchBox("Search notices...")}</div>
      <div id="noticeList" class="notice-grid"></div>
    </section>
  `;

  function draw(filter = "") {
    const data = readRecords("notices")
      .filter(n => Object.values(n).join(" ").toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    $("#noticeList").innerHTML = data.length ? data.map(n => `
      <article class="notice-card">
        <div class="notice-tag">${escapeHTML(n.category || "General")}</div>
        <h3>${escapeHTML(n.title)}</h3>
        <p>${escapeHTML(n.details)}</p>
        <div class="notice-meta">
          <span>📅 ${escapeHTML(n.date)}</span>
          <span>👥 ${escapeHTML(n.audience)}</span>
        </div>
        <div class="actions">
          ${button("Edit", `edit-notice:${n.id}`, "secondary")}
          ${button("Print", `print-notice:${n.id}`, "secondary")}
          ${button("Delete", `delete-notice:${n.id}`, "danger")}
        </div>
      </article>
    `).join("") : emptyMessage("No notices published");
  }

  draw();
  $("#pageSearch").addEventListener("input", e => draw(e.target.value));
}

function renderNoticeForm(id = "") {
  const record = id ? getRecord("notices", id) : null;

  const values = record ? { ...record } : { date: today() };

  $("#view").innerHTML = `
    ${pageHeader(record ? "Edit Notice" : "Publish New Notice",
      "Add a notice for students, teachers, parents or everyone.")}

    <section class="panel">
      <form id="noticeForm" class="form-grid">
        ${recordFields("notices", values)}
        <div class="form-actions">
          <button class="btn primary" type="submit">
            ${record ? "Update Notice" : "Publish Notice"}
          </button>
          <button type="button" class="btn secondary"
            data-action="open-notices">Back to Notices</button>
        </div>
      </form>
    </section>
  `;

  $("#noticeForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const records = readRecords("notices");

    if (record) {
      const index = records.findIndex(n => n.id === id);
      records[index] = { ...records[index], ...data };
    } else {
      data.id = makeId("NOT");
      data.createdAt = new Date().toISOString();
      records.unshift(data);
    }

    writeRecords("notices", records);
    notify(record ? "Notice updated." : "Notice published.");
    navigate("notices");
  });
}

/* ==================== REPORTS ==================== */

function renderReports() {
  const students = readRecords("students");
  const teachers = readRecords("teachers");
  const fees = readRecords("fees");
  const results = readRecords("results");
  const exams = readRecords("exams");
  const notices = readRecords("notices");

  const totalFees = fees.reduce((sum, f) => sum + number(f.total), 0);
  const paidFees = fees.reduce((sum, f) => sum + number(f.paid), 0);

  $("#view").innerHTML = `
    ${pageHeader("School Reports",
      "Summary of your saved school records.",
      button("Print Report", "print-report", "primary"))}

    <section class="panel" id="printableReport">
      <h2>School Management Report</h2>
      <p>Generated on: ${escapeHTML(today())}</p>

      <div class="stats-grid">
        ${card("Students", students.length, "🎓")}
        ${card("Teachers", teachers.length, "👨‍🏫")}
        ${card("Exams", exams.length, "📝")}
        ${card("Notices", notices.length, "📢")}
        ${card("Total Fees", money(totalFees), "💰")}
        ${card("Fees Paid", money(paidFees), "✅")}
      </div>

      <h3>Student Register</h3>
      ${table(["ID", "Name", "Class", "Phone"],
        students.map(s => `<tr>
          <td>${escapeHTML(s.id)}</td>
          <td>${escapeHTML(s.name)}</td>
          <td>${escapeHTML(s.className)}</td>
          <td>${escapeHTML(s.phone)}</td>
        </tr>`))}

      <h3>Teacher Register</h3>
      ${table(["ID", "Name", "Subject", "Phone"],
        teachers.map(t => `<tr>
          <td>${escapeHTML(t.id)}</td>
          <td>${escapeHTML(t.name)}</td>
          <td>${escapeHTML(t.subject)}</td>
          <td>${escapeHTML(t.phone)}</td>
        </tr>`))}

      <h3>Examination Register</h3>
      ${table(["Exam", "Class", "Subject", "Date"],
        exams.map(e => `<tr>
          <td>${escapeHTML(e.examName)}</td>
          <td>${escapeHTML(e.className)}</td>
          <td>${escapeHTML(e.subject)}</td>
          <td>${escapeHTML(e.examDate)}</td>
        </tr>`))}
    </section>
  `;
}

/* ==================== PRINTING ==================== */

function printHTML(title, content) {
  const win = window.open("", "_blank");

  if (!win) {
    notify("Allow pop-ups to print this document.");
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
    <html><head><title>${escapeHTML(title)}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body{font-family:Arial,sans-serif;color:#172b4d;padding:25px;line-height:1.5}
      h1,h2{text-align:center}
      .header{text-align:center;border-bottom:2px solid #123c69;padding-bottom:12px;margin-bottom:20px}
      .box{border:1px solid #aaa;padding:12px;margin:12px 0}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th,td{border:1px solid #bbb;padding:8px;text-align:left}
      th{background:#edf4fb}
      .signatures{display:flex;justify-content:space-between;margin-top:70px}
      .signature{border-top:1px solid #333;width:180px;text-align:center;padding-top:8px}
      @page{size:A4;margin:15mm}
      @media print{button{display:none}}
    </style></head><body>
    ${content}
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
  win.document.close();
}

function printExam(id) {
  const e = getRecord("exams", id);
  if (!e) return notify("Exam not found.");

  printHTML("Exam Form", `
    <div class="header">
      <h1> SCHOOL MANAGEMENT SYSTEM </h1>
      <h2>EXAMINATION FORM</h2>
      <p>Academic Examination Record</p>
    </div>

    <div class="box"><strong>Exam ID:</strong> ${escapeHTML(e.id)}</div>
    <div class="box"><strong>Exam Name:</strong> ${escapeHTML(e.examName)}</div>
    <div class="box"><strong>Class:</strong> ${escapeHTML(e.className)}</div>
    <div class="box"><strong>Subject:</strong> ${escapeHTML(e.subject)}</div>
    <div class="box"><strong>Exam Date:</strong> ${escapeHTML(e.examDate)}</div>
    <div class="box"><strong>Start Time:</strong> ${escapeHTML(e.startTime)}</div>
    <div class="box"><strong>Duration:</strong> ${escapeHTML(e.duration)} minutes</div>
    <div class="box"><strong>Maximum Marks:</strong> ${escapeHTML(e.maxMarks)}</div>
    <div class="box"><strong>Room:</strong> ${escapeHTML(e.room)}</div>
    <div class="box"><strong>Instructions:</strong><br>${escapeHTML(e.instructions || "Follow the instructions given by the invigilator.")}</div>

    <div class="signatures">
      <div class="signature">Teacher Signature</div>
      <div class="signature">Principal Signature</div>
    </div>
  `);
}

function printStudent(id) {
  const s = getRecord("students", id);
  if (!s) return notify("Student not found.");

  printHTML("Student Details", `
    <div class="header">
      <h1>SCHOOL MANAGEMENT SYSTEM</h1>
      <h2>STUDENT DETAILS</h2>
    </div>
    <div class="box"><strong>Student ID:</strong> ${escapeHTML(s.id)}</div>
    <div class="box"><strong>Name:</strong> ${escapeHTML(s.name)}</div>
    <div class="box"><strong>Gender:</strong> ${escapeHTML(s.gender)}</div>
    <div class="box"><strong>Date of Birth:</strong> ${escapeHTML(s.dob)}</div>
    <div class="box"><strong>Class:</strong> ${escapeHTML(s.className)}</div>
    <div class="box"><strong>Email:</strong> ${escapeHTML(s.email)}</div>
    <div class="box"><strong>Phone:</strong> ${escapeHTML(s.phone)}</div>
    <div class="signatures">
      <div class="signature">Class Teacher</div>
      <div class="signature">Principal</div>
    </div>
  `);
}

function printNotice(id) {
  const n = getRecord("notices", id);
  if (!n) return notify("Notice not found.");

  printHTML("School Notice", `
    <div class="header">
      <h1>SCHOOL MANAGEMENT SYSTEM</h1>
      <h2>NOTICE</h2>
    </div>
    <p><strong>Notice ID:</strong> ${escapeHTML(n.id)}</p>
    <p><strong>Date:</strong> ${escapeHTML(n.date)}</p>
    <p><strong>Category:</strong> ${escapeHTML(n.category)}</p>
    <p><strong>Audience:</strong> ${escapeHTML(n.audience)}</p>
    <h2>${escapeHTML(n.title)}</h2>
    <div class="box">${escapeHTML(n.details).replace(/\n/g, "<br>")}</div>
    <div class="signatures"><div class="signature">Principal</div></div>
  `);
}

/* ==================== ACTION HANDLER ==================== */

document.addEventListener("click", event => {
  const el = event.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const type = el.dataset.type;
  const id = el.dataset.id;

  if (action === "close-modal") return closeModal();

  if (action === "add-student") return openRecordForm("students");
  if (action === "add-teacher") return openRecordForm("teachers");
  if (action === "add-classes") return openRecordForm("classes");
  if (action === "add-fees") return openRecordForm("fees");
  if (action === "add-results") return openRecordForm("results");

  if (action === "new-exam") return navigate("exam-form");
  if (action === "new-notice") return navigate("notice-form");
  if (action === "open-exams") return navigate("exams");
  if (action === "open-notices") return navigate("notices");
  if (action === "open-reports") return navigate("reports");

  if (action === "student-tab-add") {
    $("#studentAddSection").hidden = false;
    $("#studentListSection").hidden = true;
    $$(".section-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    return;
  }

  if (action === "student-tab-list") {
    $("#studentAddSection").hidden = true;
    $("#studentListSection").hidden = false;
    $$(".section-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    return;
  }

  if (action === "teacher-tab-add") {
    $("#teacherAddSection").hidden = false;
    $("#teacherListSection").hidden = true;
    $$(".section-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    return;
  }

  if (action === "teacher-tab-list") {
    $("#teacherAddSection").hidden = true;
    $("#teacherListSection").hidden = false;
    $$(".section-tabs .tab-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    return;
  }

  if (action === "edit") {
    if (DB[type]) return openRecordForm(type, id);
    return;
  }

  if (action === "delete") {
    if (!DB[type]) return;

    const record = getRecord(type, id);
    if (!record) return notify("Record not found.");

    if (!confirm(`Delete this ${DB[type].title.toLowerCase()} record?`)) return;

    writeRecords(type, readRecords(type).filter(item => item.id !== id));
    navigate(currentPage);
    notify("Record deleted.");
    return;
  }

  if (action === "print-student") return printStudent(id);
  if (action === "print-exam") return printExam(id);
  if (action === "print-report") {
    window.print();
    return;
  }

  if (action.startsWith("edit-notice:")) {
    return renderNoticeForm(action.split(":")[1]);
  }

  if (action.startsWith("print-notice:")) {
    return printNotice(action.split(":")[1]);
  }

  if (action.startsWith("delete-notice:")) {
    const noticeId = action.split(":")[1];

    if (!confirm("Delete this notice?")) return;

    writeRecords("notices",
      readRecords("notices").filter(n => n.id !== noticeId));

    navigate("notices");
    notify("Notice deleted.");
    return;
  }
});

/* ==================== MODAL CONTROLS ==================== */

$("#mClose")?.addEventListener("click", closeModal);

$("#modal")?.addEventListener("click", event => {
  if (event.target === $("#modal")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
    closeSidebar();
  }
});

/* ==================== INITIALIZE ==================== */

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("sms_logged_in") === "true") {
    showApp();
  } else {
    showLogin();
  }
});
