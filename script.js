(() => {
'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const KEY = {students:'sms_students',teachers:'sms_teachers',classes:'sms_classes',attendance:'sms_attendance',fees:'sms_fees',results:'sms_results',exams:'sms_exams',notices:'sms_notices'};
const CLASS_NAMES = ['5th','6th','7th','8th','9th','10th'];
const DIVISIONS = ['A','B','C','D','E'];
const FIRST = ['Aarav','Sai','Aditya','Rohan','Om','Atharva','Vedant','Soham','Krish','Yash','Vihaan','Arjun','Ishaan','Reyansh','Kabir','Tanvi','Anaya','Aarya','Saanvi','Ira','Myra','Diya','Avni','Prisha','Riya','Anvi','Kavya','Siya','Neha','Pooja','Mihir','Siddhant','Parth','Shreyas','Nikhil','Sakshi','Mrunal','Tejas','Ishita','Aditi'];
const LAST = ['Patil','Sharma','Jadhav','Pawar','Shinde','More','Deshmukh','Kulkarni','Gaikwad','Chavan','Mane','Kadam','Bhosale','Joshi','Sawant','Salunkhe','Thorat','Pawar','Naik','Lokhande','Kale','Mali','Gore','Wagh','Inamdar','Pisal','Dhumal','Khot','Raut','Phadtare'];
let currentPage='dashboard', studentTab='list', teacherTab='list', toastTimer;
const store = key => { try { return JSON.parse(localStorage.getItem(KEY[key]) || '[]'); } catch { return []; } };
const save = (key, data) => localStorage.setItem(KEY[key], JSON.stringify(data));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = prefix => prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const today = () => new Date().toISOString().slice(0,10);
const initials = name => String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const money = n => '₹'+Number(n||0).toLocaleString('en-IN');
const niceDate = value => value ? new Date(value+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const selected = (a,b) => String(a??'')===String(b??'')?'selected':'';
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2700);}
function seedData(){
  let students=store('students'), teachers=store('teachers'), classes=store('classes');
  // Backfill missing class/division/roll-number slots, without deleting the user's records.
  if(!Array.isArray(students)) students=[];
  let added=0;
  CLASS_NAMES.forEach((className, ci)=>DIVISIONS.forEach((division, di)=>{for(let rollNo=1;rollNo<=10;rollNo++){
    const exists=students.some(s=>s.className===className&&s.division===division&&Number(s.rollNo)===rollNo);
    if(!exists){const idx=ci*50+di*10+rollNo-1;students.push({id:'demo_'+className+division+rollNo,rollNo,name:FIRST[idx%FIRST.length]+' '+LAST[(idx*7+ci+di)%LAST.length],gender:rollNo%2?'Male':'Female',className,division,dob:'',email:`student${ci+1}${division}${rollNo}@school.demo`,phone:'',address:'Maharashtra',status:'Active'});added++;}
  }}));
  save('students',students);
  if(!Array.isArray(classes)) classes=[];
  CLASS_NAMES.forEach(className=>DIVISIONS.forEach(division=>{if(!classes.some(c=>c.name===className&&c.division===division))classes.push({id:'class_'+className+division,name:className,division,room:'Room '+(100+CLASS_NAMES.indexOf(className)*5+DIVISIONS.indexOf(division)),teacher:''});}));
  save('classes',classes);
  if(!Array.isArray(teachers)) teachers=[];
  const teacherNames=[['Rahul Patil','Mathematics'],['Sneha Sharma','English'],['Amit Jadhav','Science'],['Pooja Pawar','Social Studies'],['Neha Shinde','Marathi'],['Sagar Kulkarni','Computer']];
  CLASS_NAMES.forEach((className,i)=>{if(!teachers.some(t=>t.className===className)){teachers.push({id:'teacher_demo_'+className,name:teacherNames[i][0],subject:teacherNames[i][1],className,phone:'',email:`teacher${i+1}@school.demo`,qualification:'B.Ed.',status:'Active'});}});
  save('teachers',teachers);
  for(const key of ['attendance','fees','results','exams','notices']) if(!Array.isArray(store(key)))save(key,[]);
  if(added) console.info(`${added} demo students backfilled`);
}
function nav(page){currentPage=page;$('#pageCrumb').textContent=page[0].toUpperCase()+page.slice(1);$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#sidebar').classList.remove('open');render();}
function heading(title,sub,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div><div class="heading-actions">${actions}</div></div>`;}
function stat(label,value,icon,tone,foot){return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${tone}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;}
function person(name,sub){return `<div class="person-cell"><span class="person-avatar">${esc(initials(name))}</span><span><b>${esc(name)}</b><small>${esc(sub||'')}</small></span></div>`;}
function pill(status){const s=String(status||'Active').toLowerCase();let cls=['active','paid','present','published'].includes(s)?s:['inactive','absent','unpaid','draft'].includes(s)?s:['pending','partial','late'].includes(s)?s:'active';return `<span class="pill ${cls}">${esc(status||'Active')}</span>`;}
function panel(title,body,extra=''){return `<section class="panel"><div class="panel-head"><h3>${title}</h3>${extra}</div>${body}</section>`;}
function tablePanel(title, searchPlaceholder, filters, tableHead, rows, emptyText='No records found.'){
 return `<section class="panel table-panel"><div class="table-toolbar"><h3>${title}</h3><div class="toolbar-controls"><input class="search-input" id="tableSearch" placeholder="${searchPlaceholder}" aria-label="Search records">${filters||''}</div></div><div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody id="tableRows">${rows||''}</tbody></table>${rows?'':`<div class="empty-state"><strong>${emptyText}</strong>Add a record or change your search.</div>`}</div></section>`;
}
function classOptions(value='', includeAll=false){return (includeAll?'<option value="">All classes</option>':'<option value="">Select class</option>')+CLASS_NAMES.map(c=>`<option ${selected(c,value)} value="${c}">${c}</option>`).join('');}
function divisionOptions(value='',includeAll=false){return (includeAll?'<option value="">All divisions</option>':'<option value="">Select division</option>')+DIVISIONS.map(d=>`<option ${selected(d,value)} value="${d}">${d}</option>`).join('');}
function field(label,name,value='',type='text',opts=null,full=false,required=false){let control=opts?`<select name="${name}" ${required?'required':''}>${opts}</select>`:type==='textarea'?`<textarea name="${name}" ${required?'required':''}>${esc(value)}</textarea>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${type==='number'?'min="0"':''}>`;return `<div class="form-field ${full?'full-span':''}"><label>${label}${required?' *':''}</label>${control}</div>`;}
function formHtml(kind,item={}){
 let fields='';
 if(kind==='student')fields=field('Full name','name',item.name,'text',null,false,true)+field('Roll number','rollNo',item.rollNo||'','number',null,false,true)+field('Class','className',item.className||'',null,classOptions(item.className),false,true)+field('Division','division',item.division||'',null,divisionOptions(item.division),false,true)+field('Gender','gender',item.gender||'Male',null,['Male','Female','Other'].map(v=>`<option ${selected(v,item.gender||'Male')} value="${v}">${v}</option>`).join(''))+field('Date of birth','dob',item.dob||'','date')+field('Email','email',item.email||'','email')+field('Phone','phone',item.phone||'','tel')+field('Address','address',item.address||'','text',null,true)+field('Status','status',item.status||'Active',null,['Active','Inactive'].map(v=>`<option ${selected(v,item.status||'Active')} value="${v}">${v}</option>`).join(''));
 else if(kind==='teacher')fields=field('Full name','name',item.name,'text',null,false,true)+field('Subject','subject',item.subject,'text',null,false,true)+field('Assigned class','className',item.className||'',null,classOptions(item.className),false,true)+field('Phone','phone',item.phone||'','tel')+field('Email','email',item.email||'','email')+field('Qualification','qualification',item.qualification||'','text')+field('Status','status',item.status||'Active',null,['Active','Inactive'].map(v=>`<option ${selected(v,item.status||'Active')} value="${v}">${v}</option>`).join(''));
 else if(kind==='fee')fields=field('Student','studentId',item.studentId||'',null,store('students').map(s=>`<option value="${esc(s.id)}" ${selected(s.id,item.studentId)}>${esc(s.name)} — ${esc(s.className)} ${esc(s.division)}</option>`).join(''),true,true)+field('Fee amount (₹)','amount',item.amount??'','number',null,false,true)+field('Paid amount (₹)','paid',item.paid??0,'number',null,false,true)+field('Due date','dueDate',item.dueDate||today(),'date')+field('Academic year','year',item.year||'2026-27')+field('Notes','notes',item.notes||'','text',null,true);
 else if(kind==='result')fields=field('Student','studentId',item.studentId||'',null,store('students').map(s=>`<option value="${esc(s.id)}" ${selected(s.id,item.studentId)}>${esc(s.name)} — ${esc(s.className)} ${esc(s.division)}</option>`).join(''),true,true)+field('Exam name','examName',item.examName||'Unit Test 1','text',null,false,true)+field('Subject','subject',item.subject||'','text',null,false,true)+field('Marks obtained','marks',item.marks??'','number',null,false,true)+field('Total marks','total',item.total??100,'number',null,false,true)+field('Date','date',item.date||today(),'date');
 else if(kind==='exam')fields=field('Exam name','name',item.name,'text',null,false,true)+field('Class','className',item.className||'',null,classOptions(item.className),false,true)+field('Start date','startDate',item.startDate||today(),'date',null,false,true)+field('End date','endDate',item.endDate||today(),'date',null,false,true)+field('Status','status',item.status||'Upcoming',null,['Upcoming','Ongoing','Completed'].map(v=>`<option ${selected(v,item.status||'Upcoming')} value="${v}">${v}</option>`).join(''))+field('Notes','notes',item.notes||'','text',null,true);
 else if(kind==='notice')fields=field('Notice title','title',item.title,'text',null,true,true)+field('Message','message',item.message,'textarea',null,true,true)+field('Audience','audience',item.audience||'All classes',null,['All classes',...CLASS_NAMES].map(v=>`<option ${selected(v,item.audience||'All classes')} value="${v}">${v}</option>`).join(''))+field('Publish date','date',item.date||today(),'date',null,false,true)+field('Status','status',item.status||'Published',null,['Published','Draft'].map(v=>`<option ${selected(v,item.status||'Published')} value="${v}">${v}</option>`).join(''));
 else if(kind==='class')fields=field('Class','name',item.name||'',null,classOptions(item.name),false,true)+field('Division','division',item.division||'',null,divisionOptions(item.division),false,true)+field('Room','room',item.room||'','text')+field('Class teacher','teacher',item.teacher||'','text');
 return fields;
}
function openModal(kind,id=null){
 const singular=kind[0].toUpperCase()+kind.slice(1);const key=kind==='class'?'classes':kind==='fee'?'fees':kind==='result'?'results':kind==='exam'?'exams':kind==='notice'?'notices':kind==='student'?'students':'teachers';
 const item=id?store(key).find(x=>x.id===id)||{}:{};
 $('#modalRoot').innerHTML=`<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><h2 id="modalTitle">${id?'Edit':'Add'} ${singular}</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></div><div class="modal-body"><form id="recordForm" data-kind="${kind}" data-id="${id||''}"><div class="form-layout">${formHtml(kind,item)}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn primary" type="submit">Save ${singular}</button></div></form></div></section></div>`;
 $('#modalRoot').querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.hasAttribute('data-close-modal'))$('#modalRoot').innerHTML='';});
 $('#recordForm').addEventListener('submit',saveForm);
}
function saveForm(e){
 e.preventDefault();const form=e.currentTarget,kind=form.dataset.kind,id=form.dataset.id;const data=Object.fromEntries(new FormData(form).entries());
 for(const k of ['rollNo','amount','paid','marks','total'])if(data[k]!==undefined&&data[k]!=='')data[k]=Number(data[k]);
 const keyMap={student:'students',teacher:'teachers',class:'classes',fee:'fees',result:'results',exam:'exams',notice:'notices'};const key=keyMap[kind];let rows=store(key);
 if(kind==='student'){
  const dup=rows.some(x=>x.id!==id&&x.className===data.className&&x.division===data.division&&Number(x.rollNo)===Number(data.rollNo));
  if(dup){toast('That roll number already exists in this class and division.');return;}
 }
 if(kind==='class'&&rows.some(x=>x.id!==id&&x.name===data.name&&x.division===data.division)){toast('This class and division already exists.');return;}
 data.id=id||uid(kind);
 if(kind==='fee'){data.status=Number(data.paid)>=Number(data.amount)?'Paid':Number(data.paid)>0?'Partial':'Unpaid';}
 if(kind==='result'){data.percentage=Number(data.total)>0?+(Number(data.marks)/Number(data.total)*100).toFixed(2):0;data.grade=data.percentage>=90?'A+':data.percentage>=80?'A':data.percentage>=70?'B':data.percentage>=60?'C':data.percentage>=40?'D':'F';}
 if(kind==='notice'&&!data.date)data.date=today();
 if(id)rows=rows.map(x=>x.id===id?data:x);else rows.unshift(data);
 save(key,rows);$('#modalRoot').innerHTML='';toast(`${kind[0].toUpperCase()+kind.slice(1)} ${id?'updated':'added'} successfully.`);render();
}
function deleteRecord(key,id){if(!confirm('Delete this record permanently?'))return;save(key,store(key).filter(x=>x.id!==id));toast('Record deleted.');render();}
function exportCSV(key){const rows=store(key);if(!rows.length){toast('No records to export.');return;}const cols=[...new Set(rows.flatMap(r=>Object.keys(r)))];const csv=[cols.join(','),...rows.map(r=>cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))].join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`school-${key}-${today()}.csv`;a.click();URL.revokeObjectURL(url);toast('CSV export downloaded.');}
function renderDashboard(){
 const students=store('students'),teachers=store('teachers'),fees=store('fees'),attendance=store('attendance');
 const collected=fees.reduce((a,f)=>a+Number(f.paid||0),0),due=fees.reduce((a,f)=>a+Math.max(0,Number(f.amount||0)-Number(f.paid||0)),0);
 const todayAttendance=attendance.filter(a=>a.date===today());const present=todayAttendance.filter(a=>a.status==='Present').length;
 const chart=CLASS_NAMES.map((c,i)=>{const count=students.filter(s=>s.className===c).length;const h=Math.min(100,count/Math.max(1,...CLASS_NAMES.map(n=>students.filter(s=>s.className===n).length))*100);return `<div class="bar-group"><div class="bar-pair"><div class="bar" style="height:${Math.max(4,h*.68)}%"></div><div class="bar alt" style="height:${Math.max(4,h)}%"></div></div><span class="bar-label">${c}</span></div>`}).join('');
 const recent=students.slice(-5).reverse().map(s=>`<tr><td>${person(s.name,`Roll No. ${s.rollNo}`)}</td><td>${esc(s.className)} - ${esc(s.division)}</td><td>${pill(s.status)}</td></tr>`).join('');
 return heading('Dashboard','Here is what is happening at your school today.',`<button class="btn ghost" data-action="export" data-key="students">↓ Export students</button><button class="btn primary" data-action="add" data-kind="student">＋ Add student</button>`)
 +`<div class="stats-grid">${stat('Total Students',students.length,'♙','tone-blue','Across 6 classes · A–E divisions')}${stat('Total Teachers',teachers.length,'♧','tone-green','Active teaching staff')}${stat('Fees Collected',money(collected),'₹','tone-purple','Total recorded payments')}${stat('Fees Remaining',money(due),'◷','tone-orange','Outstanding fee balance')}</div>`
 +`<div class="dashboard-grid">${panel('Student distribution','<div class="chart-area">'+chart+'</div><div class="legend"><span><i></i>Students per class</span><span><i class="alt"></i>Class capacity view</span></div>', '<span class="pill active">6 classes</span>')}${panel('Quick actions',`<div class="quick-list"><button class="quick-item" data-action="add" data-kind="student"><span class="quick-icon">♙</span><span><b>Add a student</b><small>Create a student profile</small></span><span class="quick-arrow">›</span></button><button class="quick-item" data-action="add" data-kind="teacher"><span class="quick-icon">♧</span><span><b>Add a teacher</b><small>Update teaching staff</small></span><span class="quick-arrow">›</span></button><button class="quick-item" data-action="page" data-page="attendance"><span class="quick-icon">✓</span><span><b>Mark attendance</b><small>Record today's attendance</small></span><span class="quick-arrow">›</span></button><button class="quick-item" data-action="add" data-kind="notice"><span class="quick-icon">▤</span><span><b>Publish a notice</b><small>Share a school announcement</small></span><span class="quick-arrow">›</span></button></div>`)} </div>`
 +`<section class="panel table-panel"><div class="table-toolbar"><h3>Recently added students</h3><button class="btn secondary small" data-action="page" data-page="students">View student list →</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead><tbody>${recent||'<tr><td colspan="3">No students yet.</td></tr>'}</tbody></table></div></section>`;
}
function renderStudents(){
 const students=store('students');
 const actions=`<button class="btn ghost" data-action="export" data-key="students">↓ Export CSV</button><button class="btn primary" data-action="student-tab" data-tab="add">＋ Add student</button>`;
 const intro=heading('Students','Manage student profiles, class assignments and records.',actions);
 const tabs=`<div class="section-tabs"><button class="tab-btn ${studentTab==='list'?'active':''}" data-action="student-tab" data-tab="list">Student List (${students.length})</button><button class="tab-btn ${studentTab==='add'?'active':''}" data-action="student-tab" data-tab="add">Add Student</button></div>`;
 if(studentTab==='add')return intro+tabs+`<section class="panel form-card"><div class="panel-head"><h3>Student information</h3><span class="pill active">New record</span></div><form id="inlineStudentForm"><div class="form-layout">${formHtml('student')}</div><div class="form-actions"><button class="btn ghost" type="reset">Clear form</button><button class="btn primary" type="submit">Save student</button></div></form></section>`;
 const filters=`<select class="filter-select" id="classFilter">${classOptions('',true)}</select><select class="filter-select" id="divisionFilter">${divisionOptions('',true)}</select>`;
 const rows=students.map(s=>`<tr data-search="${esc([s.name,s.email,s.className,s.division,s.rollNo,s.phone].join(' ').toLowerCase())}" data-class="${esc(s.className)}" data-division="${esc(s.division)}"><td>${person(s.name,s.email||`Roll No. ${s.rollNo}`)}</td><td>${esc(s.rollNo)}</td><td>${esc(s.className)} - ${esc(s.division)}</td><td>${esc(s.gender||'—')}</td><td>${esc(s.phone||'—')}</td><td>${pill(s.status)}</td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="student" data-id="${esc(s.id)}" aria-label="Edit student">✎</button><button class="action-btn" data-action="delete" data-key="students" data-id="${esc(s.id)}" aria-label="Delete student">⌫</button></div></td></tr>`).join('');
 return intro+tabs+tablePanel('All students','Search name, roll no, email…',filters,'<th>Student</th><th>Roll No.</th><th>Class</th><th>Gender</th><th>Phone</th><th>Status</th><th>Actions</th>',rows,'No students found.');
}
function renderTeachers(){
 const teachers=store('teachers'),actions=`<button class="btn ghost" data-action="export" data-key="teachers">↓ Export CSV</button><button class="btn primary" data-action="teacher-tab" data-tab="add">＋ Add teacher</button>`;
 const intro=heading('Teachers','Manage teacher profiles, subjects and class assignments.',actions);
 const tabs=`<div class="section-tabs"><button class="tab-btn ${teacherTab==='list'?'active':''}" data-action="teacher-tab" data-tab="list">Teacher List (${teachers.length})</button><button class="tab-btn ${teacherTab==='add'?'active':''}" data-action="teacher-tab" data-tab="add">Add Teacher</button></div>`;
 if(teacherTab==='add')return intro+tabs+`<section class="panel form-card"><div class="panel-head"><h3>Teacher information</h3><span class="pill active">New record</span></div><form id="inlineTeacherForm"><div class="form-layout">${formHtml('teacher')}</div><div class="form-actions"><button class="btn ghost" type="reset">Clear form</button><button class="btn primary" type="submit">Save teacher</button></div></form></section>`;
 const rows=teachers.map(t=>`<tr data-search="${esc([t.name,t.subject,t.className,t.email,t.phone].join(' ').toLowerCase())}"><td>${person(t.name,t.email)}</td><td>${esc(t.subject||'—')}</td><td>${esc(t.className||'—')}</td><td>${esc(t.qualification||'—')}</td><td>${esc(t.phone||'—')}</td><td>${pill(t.status)}</td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="teacher" data-id="${esc(t.id)}">✎</button><button class="action-btn" data-action="delete" data-key="teachers" data-id="${esc(t.id)}">⌫</button></div></td></tr>`).join('');
 return intro+tabs+tablePanel('All teachers','Search teacher, subject, class…','', '<th>Teacher</th><th>Subject</th><th>Class</th><th>Qualification</th><th>Phone</th><th>Status</th><th>Actions</th>',rows,'No teachers found.');
}
function renderClasses(){
 const classes=store('classes');
 const rows=classes.map(c=>`<tr data-search="${esc([c.name,c.division,c.room,c.teacher].join(' ').toLowerCase())}"><td><b>${esc(c.name)}</b></td><td><span class="pill active">${esc(c.division)}</span></td><td>${esc(c.room||'—')}</td><td>${store('students').filter(s=>s.className===c.name&&s.division===c.division).length}</td><td>${esc(c.teacher||store('teachers').find(t=>t.className===c.name)?.name||'—')}</td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="class" data-id="${esc(c.id)}">✎</button></div></td></tr>`).join('');
 return heading('Classes','Class structure for standards 5th–10th and divisions A–E.',`<button class="btn ghost" data-action="export" data-key="classes">↓ Export CSV</button><button class="btn primary" data-action="add" data-kind="class">＋ Add class</button>`)+`<div class="stats-grid">${stat('Standards',6,'▤','tone-blue','5th through 10th')}${stat('Divisions',5,'▦','tone-green','A, B, C, D and E')}${stat('Class sections',classes.length,'⌂','tone-purple','Configured class divisions')}${stat('Students',store('students').length,'♙','tone-orange','Across all class sections')}</div>`+tablePanel('Class & division list','Search class, division, room…','', '<th>Class</th><th>Division</th><th>Room</th><th>Students</th><th>Class teacher</th><th>Actions</th>',rows);
}
function renderAttendance(){
 const students=store('students'),records=store('attendance');
 const date=$('#attendanceDate')?.value||today(),cl=$('#attendanceClass')?.value||'',div=$('#attendanceDivision')?.value||'';
 const list=students.filter(s=>(!cl||s.className===cl)&&(!div||s.division===div));
 const statusMap=new Map(records.filter(r=>r.date===date).map(r=>[r.studentId,r.status]));
 const rows=list.map(s=>`<tr><td>${person(s.name,`Roll No. ${s.rollNo}`)}</td><td>${esc(s.className)} - ${esc(s.division)}</td><td><select class="filter-select attendance-status" data-student="${esc(s.id)}"><option ${selected(statusMap.get(s.id)||'Present','Present')} value="Present">Present</option><option ${selected(statusMap.get(s.id)||'Present','Absent')} value="Absent">Absent</option><option ${selected(statusMap.get(s.id)||'Present','Late')} value="Late">Late</option></select></td></tr>`).join('');
 return heading('Attendance','Record and review daily student attendance.',`<button class="btn ghost" data-action="export" data-key="attendance">↓ Export CSV</button>`)+`<section class="panel"><div class="attendance-toolbar"><label>Date <input type="date" id="attendanceDate" value="${date}"></label><label>Class <select id="attendanceClass">${classOptions(cl,true)}</select></label><label>Division <select id="attendanceDivision">${divisionOptions(div,true)}</select></label><button class="btn primary" id="saveAttendance">Save attendance</button></div><div class="mini-summary"><span>Students shown: <b>${list.length}</b></span><span>Already recorded today: <b>${statusMap.size}</b></span></div></section><div style="height:14px"></div>`+tablePanel('Attendance register','Search student name…','', '<th>Student</th><th>Class</th><th>Attendance status</th>',rows,'No students match this class filter.');
}
function renderFees(){
 const fees=store('fees'),students=store('students'),total=fees.reduce((a,f)=>a+Number(f.amount||0),0),paid=fees.reduce((a,f)=>a+Number(f.paid||0),0),due=Math.max(0,total-paid);
 const rows=fees.map(f=>{const s=students.find(x=>x.id===f.studentId);return `<tr data-search="${esc([s?.name,f.year,f.status,f.notes].join(' ').toLowerCase())}"><td>${person(s?.name||'Unknown student',s?`${s.className} - ${s.division}`:'Student removed')}</td><td>${money(f.amount)}</td><td>${money(f.paid)}</td><td>${money(Math.max(0,Number(f.amount)-Number(f.paid)))}</td><td>${niceDate(f.dueDate)}</td><td>${pill(f.status)}</td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="fee" data-id="${esc(f.id)}">✎</button><button class="action-btn" data-action="delete" data-key="fees" data-id="${esc(f.id)}">⌫</button></div></td></tr>`}).join('');
 return heading('Fees management','Track fees, payments and outstanding balances.',`<button class="btn ghost" data-action="export" data-key="fees">↓ Export CSV</button><button class="btn primary" data-action="add" data-kind="fee">＋ Add fee record</button>`)+`<div class="stats-grid">${stat('Total fees',money(total),'₹','tone-blue','Recorded fee amounts')}${stat('Collected',money(paid),'✓','tone-green','Payments received')}${stat('Outstanding',money(due),'◷','tone-orange','Remaining balance')}${stat('Fee records',fees.length,'▤','tone-purple','Student fee entries')}</div>`+tablePanel('Fee register','Search student, status, year…','', '<th>Student</th><th>Fee amount</th><th>Paid</th><th>Remaining</th><th>Due date</th><th>Status</th><th>Actions</th>',rows,'No fee records yet.');
}
function renderResults(){
 const results=store('results'),students=store('students');
 const rows=results.map(r=>{const s=students.find(x=>x.id===r.studentId);return `<tr data-search="${esc([s?.name,r.examName,r.subject,r.grade].join(' ').toLowerCase())}"><td>${person(s?.name||'Unknown student',s?`${s.className} - ${s.division}`:'Student removed')}</td><td>${esc(r.examName)}</td><td>${esc(r.subject)}</td><td>${esc(r.marks)} / ${esc(r.total)}</td><td>${Number(r.percentage||0).toFixed(1)}%</td><td><span class="pill ${r.grade==='F'?'absent':'active'}">${esc(r.grade||'—')}</span></td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="result" data-id="${esc(r.id)}">✎</button><button class="action-btn" data-action="delete" data-key="results" data-id="${esc(r.id)}">⌫</button></div></td></tr>`}).join('');
 return heading('Results & marks','Enter subject marks and automatically calculate percentage and grade.',`<button class="btn ghost" data-action="export" data-key="results">↓ Export CSV</button><button class="btn primary" data-action="add" data-kind="result">＋ Add result</button>`)+tablePanel('Result register','Search student, exam, subject…','', '<th>Student</th><th>Exam</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Actions</th>',rows,'No results recorded yet.');
}
function renderExams(){
 const exams=store('exams'),rows=exams.map(x=>`<tr data-search="${esc([x.name,x.className,x.status].join(' ').toLowerCase())}"><td><b>${esc(x.name)}</b></td><td>${esc(x.className)}</td><td>${niceDate(x.startDate)}</td><td>${niceDate(x.endDate)}</td><td>${pill(x.status)}</td><td><div class="actions"><button class="action-btn" data-action="edit" data-kind="exam" data-id="${esc(x.id)}">✎</button><button class="action-btn" data-action="delete" data-key="exams" data-id="${esc(x.id)}">⌫</button></div></td></tr>`).join('');
 return heading('Exams','Plan exams, dates and class schedules.',`<button class="btn primary" data-action="add" data-kind="exam">＋ Schedule exam</button>`)+tablePanel('Exam schedule','Search exam or class…','', '<th>Exam</th><th>Class</th><th>Start date</th><th>End date</th><th>Status</th><th>Actions</th>',rows,'No exams scheduled yet.');
}
function renderNotices(){
 const notices=store('notices');
 const cards=notices.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(n=>`<article class="notice-card"><div class="notice-icon">▤</div><div style="flex:1"><h4>${esc(n.title)}</h4><p>${esc(n.message)}</p><div class="notice-meta">${esc(n.audience||'All classes')} · ${niceDate(n.date)} · ${pill(n.status)}</div></div><div class="actions"><button class="action-btn" data-action="edit" data-kind="notice" data-id="${esc(n.id)}">✎</button><button class="action-btn" data-action="delete" data-key="notices" data-id="${esc(n.id)}">⌫</button></div></article>`).join('');
 return heading('Notices & announcements','Publish important updates for students and school staff.',`<button class="btn primary" data-action="add" data-kind="notice">＋ Create notice</button>`)+`<section class="panel"><div class="panel-head"><h3>All notices</h3><span class="pill active">${notices.length} total</span></div><div class="notice-list">${cards||'<div class="empty-state"><strong>No notices yet</strong>Create a notice to display it here.</div>'}</div></section>`;
}
function renderReports(){
 const students=store('students'),teachers=store('teachers'),fees=store('fees'),results=store('results'),attendance=store('attendance');
 const total=fees.reduce((a,f)=>a+Number(f.amount||0),0),paid=fees.reduce((a,f)=>a+Number(f.paid||0),0),pct=total?Math.round(paid/total*100):0;
 const byClass=CLASS_NAMES.map(c=>{const count=students.filter(s=>s.className===c).length;return `<div class="report-card"><h3>${c} students</h3><div class="report-number">${count}</div><p>Student profiles currently registered in ${c}.</p><div class="progress"><span style="width:${Math.min(100,count/Math.max(1,...CLASS_NAMES.map(n=>students.filter(s=>s.className===n).length))*100)}%"></span></div></div>`}).join('');
 return heading('Reports & analytics','A quick overview of school records. Export individual sections as CSV.')+`<div class="stats-grid">${stat('Students',students.length,'♙','tone-blue','All registered students')}${stat('Teachers',teachers.length,'♧','tone-green','Teacher profiles')}${stat('Result records',results.length,'✧','tone-purple','Marks entered')}${stat('Attendance entries',attendance.length,'✓','tone-orange','Saved attendance records')}</div><section class="panel"><div class="panel-head"><h3>Fee collection progress</h3><b>${pct}%</b></div><div class="progress" style="height:10px"><span style="width:${pct}%"></span></div><div class="mini-summary"><span>Total fees: <b>${money(total)}</b></span><span>Collected: <b>${money(paid)}</b></span><span>Remaining: <b>${money(Math.max(0,total-paid))}</b></span></div></section><div style="height:17px"></div><div class="report-cards">${byClass}</div><div style="height:18px"></div><section class="panel"><div class="panel-head"><h3>Export your records</h3><span class="muted">CSV files open in Excel or Google Sheets</span></div><div class="heading-actions">${Object.keys(KEY).map(k=>`<button class="btn ghost small" data-action="export" data-key="${k}">↓ ${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></section>`;
}
function render(){
 const pages={dashboard:renderDashboard,students:renderStudents,teachers:renderTeachers,classes:renderClasses,attendance:renderAttendance,fees:renderFees,results:renderResults,exams:renderExams,notices:renderNotices,reports:renderReports};
 $('#pageContent').innerHTML=(pages[currentPage]||renderDashboard)();
 $('#navStudentCount').textContent=store('students').length;
 $('#todayText').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'});
 $('#year').textContent=new Date().getFullYear();
 const search=$('#tableSearch');if(search)search.addEventListener('input',filterTable);
 ['classFilter','divisionFilter'].forEach(id=>{const el=$('#'+id);if(el)el.addEventListener('change',filterTable);});
 const sf=$('#inlineStudentForm');if(sf)sf.addEventListener('submit',e=>{e.preventDefault();saveInline('student',sf);});
 const tf=$('#inlineTeacherForm');if(tf)tf.addEventListener('submit',e=>{e.preventDefault();saveInline('teacher',tf);});
 const saveAtt=$('#saveAttendance');if(saveAtt)saveAtt.addEventListener('click',saveAttendance);
 ['attendanceDate','attendanceClass','attendanceDivision'].forEach(id=>{const el=$('#'+id);if(el)el.addEventListener('change',render);});
}
function filterTable(){const q=($('#tableSearch')?.value||'').toLowerCase();const cl=$('#classFilter')?.value||'',div=$('#divisionFilter')?.value||'';let shown=0;$$('#tableRows tr').forEach(tr=>{const ok=(tr.dataset.search||tr.textContent.toLowerCase()).includes(q)&&(!cl||tr.dataset.class===cl)&&(!div||tr.dataset.division===div);tr.style.display=ok?'':'none';if(ok)shown++;});const old=$('.filtered-empty');if(old)old.remove();if(shown===0&&$('#tableRows'))$('#tableRows').closest('.table-wrap').insertAdjacentHTML('beforeend','<div class="empty-state filtered-empty"><strong>No matching records</strong>Try a different search or filter.</div>');}
function saveInline(kind,form){const data=Object.fromEntries(new FormData(form).entries());for(const k of ['rollNo'])if(data[k])data[k]=Number(data[k]);const key=kind==='student'?'students':'teachers';const rows=store(key);if(kind==='student'&&rows.some(s=>s.className===data.className&&s.division===data.division&&Number(s.rollNo)===Number(data.rollNo))){toast('That roll number already exists in this class and division.');return;}data.id=uid(kind);rows.push(data);save(key,rows);if(kind==='student')studentTab='list';else teacherTab='list';toast(`${kind==='student'?'Student':'Teacher'} added successfully.`);render();}
function saveAttendance(){
 const date=$('#attendanceDate').value||today(),rows=store('attendance'),stamp=new Date().toISOString();
 $$('.attendance-status').forEach(el=>{const studentId=el.dataset.student;const old=rows.findIndex(r=>r.studentId===studentId&&r.date===date);const rec={id:old>=0?rows[old].id:uid('att'),studentId,date,status:el.value,updatedAt:stamp};if(old>=0)rows[old]=rec;else rows.push(rec);});
 save('attendance',rows);toast('Attendance saved successfully.');render();
}
document.addEventListener('click',e=>{
 const navBtn=e.target.closest('[data-page]');if(navBtn&&navBtn.classList.contains('nav-item')){nav(navBtn.dataset.page);return;}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const {action,kind,id,key,page,tab}=btn.dataset;
 if(action==='page')nav(page);
 if(action==='add')openModal(kind);
 if(action==='edit')openModal(kind,id);
 if(action==='delete')deleteRecord(key,id);
 if(action==='export')exportCSV(key);
 if(action==='student-tab'){studentTab=tab;if(tab==='add'){render();}else render();}
 if(action==='teacher-tab'){teacherTab=tab;render();}
});
$('#mainNav').addEventListener('click',e=>{const b=e.target.closest('.nav-item');if(b)nav(b.dataset.page);});
$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('sms_logged_in');$('#app').classList.add('hidden');$('#loginScreen').classList.remove('hidden');});
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();const u=$('#loginUser').value.trim(),p=$('#loginPass').value; if(u==='admin'&&p==='admin123'){sessionStorage.setItem('sms_logged_in','1');$('#loginError').textContent='';$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');seedData();nav('dashboard');}else $('#loginError').textContent='Incorrect username or password. Try admin / admin123.';});
seedData();
if(sessionStorage.getItem('sms_logged_in')==='1'){$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');nav('dashboard');}
})();