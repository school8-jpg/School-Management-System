'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const load=(k,d)=>{try{const v=JSON.parse(localStorage.getItem('sms_'+k));return v==null?d:v}catch{return d}};
const save=(k,v)=>localStorage.setItem('sms_'+k,JSON.stringify(v));
const D={students:load('students',[]),teachers:load('teachers',[]),classes:load('classes',[]),fees:load('fees',[]),results:load('results',[]),attendance:load('attendance',{})};
const persist=k=>save(k,D[k]);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'\u20B9'+(+n||0).toLocaleString('en-IN');
const sum=(a,k)=>a.reduce((t,r)=>t+(+r[k]||0),0);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const cl=c=>c.name+' - '+c.section;
const tName=id=>(D.teachers.find(t=>t.tid===id)||{}).name||'\u2014';
const grade=p=>p>=90?'A+':p>=80?'A':p>=70?'B+':p>=60?'B':p>=50?'C':p>=40?'D':'F';
const bc=v=>({Paid:'ok',Partial:'warn',Pending:'er','A+':'ok',A:'ok','B+':'info',B:'info',C:'warn',D:'warn',F:'er'}[v]||'');
let q='',cf='',pending=null;

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
function openModal(t,h){$('#mTitle').textContent=t;$('#mBody').innerHTML=h;$('#modal').hidden=false}
function closeModal(){$('#modal').hidden=true;$('#mBody').innerHTML=''}
function confirmBox(msg,fn){openModal('Confirm Delete',`<p>${esc(msg)}</p><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn danger" id="yes">Delete</button></div>`);$('#yes').onclick=()=>{closeModal();fn()}}

/* ---------- Module configuration ---------- */
const fill=d=>{const s=D.students.find(x=>x.sid===d.sid);d.name=s?s.name:'';d.cls=s?s.cls:''};
const stuOpts=()=>D.students.map(s=>[s.sid,s.sid+' - '+s.name]);
const marks=[1,2,3,4,5].map(i=>({k:'m'+i,s:'Sub '+i,l:'Subject '+i+' Marks (max 100)',type:'number',req:1,max:100}));
const M={
 students:{t:'Student',f:[
  {k:'sid',l:'Student ID',req:1,lock:1},{k:'name',l:'Student Name',req:1},
  {k:'gender',l:'Gender',type:'select',req:1,o:()=>['Male','Female','Other']},
  {k:'dob',l:'Date of Birth',type:'date',req:1},
  {k:'cls',l:'Class',type:'select',req:1,o:()=>D.classes.map(cl)},
  {k:'email',l:'Email',type:'email',req:1},{k:'phone',l:'Contact Number',type:'tel',req:1}],
  u:['sid'],um:'Student ID already exists.',
  after:r=>{['fees','results'].forEach(k=>{D[k].forEach(x=>{if(x.sid===r.sid){x.name=r.name;x.cls=r.cls}});persist(k)})}},
 teachers:{t:'Teacher',f:[
  {k:'tid',l:'Teacher ID',req:1,lock:1},{k:'name',l:'Teacher Name',req:1},
  {k:'gender',l:'Gender',type:'select',req:1,o:()=>['Male','Female','Other']},
  {k:'subject',l:'Subject',req:1},{k:'email',l:'Email',type:'email',req:1},{k:'phone',l:'Contact Number',type:'tel',req:1}],
  u:['tid'],um:'Teacher ID already exists.'},
 classes:{t:'Class',f:[
  {k:'name',l:'Class Name',req:1,lock:1},{k:'section',l:'Section',req:1,lock:1},
  {k:'teacher',l:'Class Teacher',type:'select',o:()=>D.teachers.map(t=>[t.tid,t.name]),show:tName},
  {k:'room',l:'Room Number',req:1}],
  u:['name','section'],um:'This class and section already exist.',
  x:{l:'Students',v:r=>D.students.filter(s=>s.cls===cl(r)).length}},
 fees:{t:'Fee Record',f:[
  {k:'sid',l:'Student ID',type:'select',req:1,o:stuOpts,lock:1},{k:'name',l:'Student Name',ro:1},{k:'cls',l:'Class',ro:1},
  {k:'total',l:'Total Fees (\u20B9)',s:'Total Fees',type:'number',req:1,m:1},
  {k:'paid',l:'Paid Amount (\u20B9)',s:'Paid',type:'number',req:1,m:1},
  {k:'rem',l:'Remaining Amount (\u20B9)',s:'Remaining',ro:1,m:1},
  {k:'status',l:'Payment Status',s:'Status',ro:1},{k:'date',l:'Payment Date',type:'date'}],
  u:['sid'],um:'A fee record already exists for this student. Edit it instead.',
  calc:d=>{fill(d);const t=+d.total||0,p=+d.paid||0;d.rem=Math.max(t-p,0);d.status=t>0&&p>=t?'Paid':p>0?'Partial':'Pending'}},
 results:{t:'Result',f:[
  {k:'sid',l:'Student ID',type:'select',req:1,o:stuOpts,lock:1},{k:'name',l:'Student Name',ro:1},{k:'cls',l:'Class',ro:1},
  ...marks,{k:'total',l:'Total Marks',s:'Total',ro:1},{k:'pct',l:'Percentage',s:'%',ro:1},{k:'grade',l:'Grade',ro:1}],
  u:['sid'],um:'A result already exists for this student. Edit it instead.',
  calc:d=>{fill(d);d.total=[1,2,3,4,5].reduce((a,i)=>a+(+d['m'+i]||0),0);d.pct=+(d.total/5).toFixed(2);d.grade=grade(d.pct)}}
};

/* ---------- Auth ---------- */
const authed=()=>load('auth',false);
function showApp(){const a=authed();$('#login').hidden=a;$('#app').hidden=!a;if(a)route()}
$('#loginForm').onsubmit=e=>{e.preventDefault();const u=$('#lu').value.trim(),p=$('#lp').value,er=$('#loginErr');
 if(!u||!p){er.textContent='Please enter both username and password.';er.hidden=false;return}
 if(u==='admin'&&p==='admin123'){er.hidden=true;save('auth',true);$('#lp').value='';location.hash='dashboard';showApp()}
 else{er.textContent='Invalid username or password.';er.hidden=false}};
$('#togglePw').onclick=()=>{const i=$('#lp'),s=i.type==='password';i.type=s?'text':'password';$('#togglePw').textContent=s?'Hide':'Show'};
$('#logout').onclick=()=>{save('auth',false);history.replaceState(null,'',location.pathname);closeSide();showApp()};

/* ---------- Router / layout ---------- */
const PAGES=['dashboard','students','teachers','classes','attendance','fees','results','reports'];
function closeSide(){document.body.classList.remove('side-open')}
$('#menuBtn').onclick=()=>document.body.classList.toggle('side-open');
$('#overlay').onclick=closeSide;
$('#mClose').onclick=closeModal;
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
addEventListener('hashchange',()=>authed()&&route());
function route(){let p=location.hash.slice(1);if(!PAGES.includes(p))p='dashboard';q='';cf='';
 $$('.nav a').forEach(a=>a.classList.toggle('active',a.dataset.p===p));
 $('#pageTitle').textContent=p[0].toUpperCase()+p.slice(1);closeSide();R[p]();scrollTo(0,0);
 if(pending){const f=pending;pending=null;f()}}
function quick(p,fn){pending=fn;if(location.hash.slice(1)===p)route();else location.hash=p}

/* ---------- Generic list / CRUD ---------- */
function cellHtml(f,r){const raw=r[f.k];let v=f.show?f.show(raw):f.m?money(raw):f.k==='pct'?raw+'%':(raw===''||raw==null?'\u2014':raw);
 v=esc(v);return(f.k==='status'||f.k==='grade')?`<span class="badge ${bc(raw)}">${v}</span>`:v}
function list(mod){const m=M[mod];
 $('#view').innerHTML=`<div class="bar no-print"><input id="q" class="search" placeholder="Search ${m.t.toLowerCase()}s..." autocomplete="off">${mod==='students'?`<select id="cf"><option value="">All Classes</option>${D.classes.map(c=>`<option>${esc(cl(c))}</option>`).join('')}</select>`:''}<button class="btn primary" onclick="addRec('${mod}')">+ Add ${m.t}</button></div>
 <div class="card tbl"><table><thead><tr>${m.f.map(f=>`<th>${f.s||f.l}</th>`).join('')}${m.x?`<th>${m.x.l}</th>`:''}<th>Actions</th></tr></thead><tbody id="tb"></tbody></table></div>`;
 $('#q').oninput=e=>{q=e.target.value;rows(mod)};
 if($('#cf'))$('#cf').onchange=e=>{cf=e.target.value;rows(mod)};
 rows(mod)}
function rows(mod){const m=M[mod],s=q.trim().toLowerCase();
 const a=D[mod].filter(r=>(!cf||r.cls===cf)&&(!s||m.f.some(f=>String(f.show?f.show(r[f.k]):r[f.k]??'').toLowerCase().includes(s))));
 $('#tb').innerHTML=a.length?a.map(r=>`<tr>${m.f.map(f=>`<td>${cellHtml(f,r)}</td>`).join('')}${m.x?`<td>${m.x.v(r)}</td>`:''}<td class="act"><button class="lnk" onclick="viewRec('${mod}','${r._id}')">View</button><button class="lnk" onclick="editRec('${mod}','${r._id}')">Edit</button><button class="lnk d" onclick="delRec('${mod}','${r._id}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="99" class="empty">No records found</td></tr>'}
const find=(mod,id)=>D[mod].find(r=>r._id===id);
function addRec(mod){
 if(mod==='students'&&!D.classes.length)return toast('Please add a class first.');
 if((mod==='fees'||mod==='results')&&!D.students.length)return toast('Please add a student first.');
 formModal(mod)}
function editRec(mod,id){formModal(mod,find(mod,id))}
function viewRec(mod,id){const m=M[mod],r=find(mod,id);
 openModal(m.t+' Details','<dl class="dl">'+m.f.map(f=>`<div><dt>${f.l}</dt><dd>${cellHtml(f,r)}</dd></div>`).join('')+(m.x?`<div><dt>${m.x.l}</dt><dd>${m.x.v(r)}</dd></div>`:'')+'</dl><div class="actions"><button class="btn" onclick="closeModal()">Close</button></div>')}
function delRec(mod,id){const r=find(mod,id);
 if(mod==='classes'&&D.students.some(s=>s.cls===cl(r)))return toast('Cannot delete: students are assigned to this class.');
 confirmBox(`Are you sure you want to delete this ${M[mod].t.toLowerCase()}? This cannot be undone.`,()=>{
  D[mod]=D[mod].filter(x=>x._id!==id);persist(mod);
  if(mod==='students'){['fees','results'].forEach(k=>{D[k]=D[k].filter(x=>x.sid!==r.sid);persist(k)});Object.values(D.attendance).forEach(o=>delete o[r.sid]);persist('attendance')}
  if(mod==='teachers'){D.classes.forEach(c=>{if(c.teacher===r.tid)c.teacher=''});persist('classes')}
  toast('Deleted successfully.');list(mod)})}

function formModal(mod,rec){const m=M[mod],d=rec||{};
 const fs=m.f.map(f=>{const v=d[f.k]??'',lock=f.ro||(f.lock&&rec);let inp;
  if(f.type==='select'){const dis=lock?' style="pointer-events:none;background:#eef0f8"':'';
   inp=`<select name="${f.k}"${dis}><option value="">Select</option>${f.o().map(o=>{const[a,b]=Array.isArray(o)?o:[o,o];return`<option value="${esc(a)}"${a===v?' selected':''}>${esc(b)}</option>`}).join('')}</select>`}
  else inp=`<input name="${f.k}" type="${f.type||'text'}" value="${esc(v)}"${lock?' readonly tabindex="-1"':''}${f.type==='number'?` min="0"${f.max?` max="${f.max}"`:''} step="any"`:''}>`;
  return`<label>${f.l}${f.req?' *':''}${inp}</label>`}).join('');
 openModal((rec?'Edit ':'Add ')+m.t,`<form id="f" novalidate><div id="ferr" class="err" hidden></div><div class="grid">${fs}</div><div class="actions"><button type="button" class="btn" onclick="closeModal()">Cancel</button><button class="btn primary">${rec?'Update':'Save'}</button></div></form>`);
 const F=$('#f'),read=()=>Object.fromEntries(new FormData(F));
 if(m.calc){const upd=()=>{const x=read();m.calc(x);m.f.filter(f=>f.ro).forEach(f=>F.elements[f.k].value=x[f.k]??'')};F.addEventListener('input',upd);F.addEventListener('change',upd);upd()}
 F.onsubmit=e=>{e.preventDefault();const x=read();Object.keys(x).forEach(k=>x[k]=String(x[k]).trim());
  const err=validate(mod,x,rec);if(err){const b=$('#ferr');b.textContent=err;b.hidden=false;b.scrollIntoView({block:'nearest'});return}
  m.calc&&m.calc(x);m.f.forEach(f=>{if(f.type==='number')x[f.k]=+x[f.k]});
  let r;if(rec){Object.assign(rec,x);r=rec}else{r={_id:uid(),...x};D[mod].push(r)}
  persist(mod);m.after&&m.after(r);closeModal();toast(rec?'Updated successfully.':'Added successfully.');list(mod)}}

function validate(mod,x,rec){const m=M[mod];
 for(const f of m.f){if(f.ro)continue;const v=x[f.k]||'';
  if(f.req&&!v)return f.l.replace(/ \(.*\)/,'')+' is required.';
  if(!v)continue;
  if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return'Please enter a valid email address.';
  if(f.type==='tel'&&!/^\d{10}$/.test(v))return'Contact number must be exactly 10 digits.';
  if(f.type==='number'){const n=+v;if(isNaN(n)||n<0)return f.l+' must be a valid non-negative number.';if(f.max&&n>f.max)return f.l.replace(/ \(.*\)/,'')+' cannot exceed '+f.max+'.'}}
 if(m.u&&D[mod].some(r=>(!rec||r._id!==rec._id)&&m.u.every(k=>String(r[k]).toLowerCase()===String(x[k]).toLowerCase())))return m.um;
 if(mod==='fees'){if(+x.paid>+x.total)return'Paid amount cannot be greater than total fees.';if(+x.paid>0&&!x.date)return'Payment date is required when an amount is paid.'}
 return''}

/* ---------- Attendance ---------- */
function attStats(c){let p=0,a=0,l=0;for(const k in D.attendance){if(c&&k.split('|')[1]!==c)continue;for(const s in D.attendance[k]){const v=D.attendance[k][s];v==='Present'?p++:v==='Absent'?a++:l++}}const t=p+a+l;return{p,a,l,t,pct:t?Math.round((p+l)/t*100):0}}
function stuPct(sid){let g=0,t=0;for(const k in D.attendance){const v=D.attendance[k][sid];if(v){t++;if(v!=='Absent')g++}}return t?Math.round(g/t*100)+'%':'\u2014'}
let att={};
function attPage(){
 $('#view').innerHTML=`<div class="bar no-print"><label class="inl">Date<input type="date" id="ad" value="${today()}"></label><label class="inl">Class<select id="ac"><option value="">Select class</option>${D.classes.map(c=>`<option>${esc(cl(c))}</option>`).join('')}</select></label></div><div id="aBody"></div>`;
 $('#ad').onchange=$('#ac').onchange=attDraw;attDraw()}
function attDraw(){const d=$('#ad').value,c=$('#ac').value,B=$('#aBody');
 if(!d||!c){B.innerHTML='<div class="card empty">Select a date and a class to mark attendance.</div>';return}
 const ss=D.students.filter(s=>s.cls===c);
 if(!ss.length){B.innerHTML='<div class="card empty">No students found in this class.</div>';return}
 const saved=D.attendance[d+'|'+c];att={};ss.forEach(s=>att[s.sid]=(saved&&saved[s.sid])||'Present');
 B.innerHTML=`<div class="card"><div class="bar2"><span id="aSum"></span><span class="badge ${saved?'ok':'warn'}">${saved?'Saved':'Not saved'}</span><span class="sp"></span><button class="btn" onclick="attAll('Present')">Mark all Present</button><button class="btn" onclick="attAll('Absent')">Mark all Absent</button><button class="btn primary" onclick="attSave()">${saved?'Update':'Save'} Attendance</button></div>
 <div class="tbl"><table><thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Status</th><th>Overall %</th></tr></thead><tbody>${ss.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.sid)}</td><td>${esc(s.name)}</td><td>${['Present','Absent','Late'].map(v=>`<label class="rb"><input type="radio" name="r${i}" value="${v}" data-s="${esc(s.sid)}"${att[s.sid]===v?' checked':''}>${v}</label>`).join('')}</td><td>${stuPct(s.sid)}</td></tr>`).join('')}</tbody></table></div>
 <p class="note">Attendance % = (Present + Late) \u00F7 Total students.</p></div>`;
 B.onchange=e=>{if(e.target.type==='radio'){att[e.target.dataset.s]=e.target.value;attSum()}};attSum()}
function attSum(){const v=Object.values(att),p=v.filter(x=>x==='Present').length,a=v.filter(x=>x==='Absent').length,l=v.length-p-a;
 $('#aSum').innerHTML=`<b>Present:</b> ${p} &nbsp; <b>Absent:</b> ${a} &nbsp; <b>Late:</b> ${l} &nbsp; <b>Attendance:</b> ${v.length?Math.round((p+l)/v.length*100):0}%`}
function attAll(v){for(const k in att)att[k]=v;$$('#aBody input[type=radio]').forEach(r=>r.checked=r.value===v);attSum()}
function attSave(){const d=$('#ad').value,c=$('#ac').value;D.attendance[d+'|'+c]={...att};persist('attendance');toast('Attendance saved.');attDraw()}

/* ---------- Pages ---------- */
const statCard=(l,v,s)=>`<div class="stat"><span>${l}</span><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`;
const tableHtml=(h,r)=>`<div class="card tbl"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r.length?r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${h.length}" class="empty">No data available</td></tr>`}</tbody></table></div>`;
const R={
 dashboard(){const a=attStats();
  $('#view').innerHTML=`<div class="stats">${statCard('Total Students',D.students.length)}${statCard('Total Teachers',D.teachers.length)}${statCard('Total Classes',D.classes.length)}${statCard('Attendance',a.pct+'%',`Present ${a.p} \u00B7 Absent ${a.a} \u00B7 Late ${a.l}`)}${statCard('Total Fees',money(sum(D.fees,'total')))}${statCard('Pending Fees',money(sum(D.fees,'rem')))}</div>
  <h3 class="sec">Quick Actions</h3><div class="qa"><button class="btn primary" onclick="quick('students',()=>addRec('students'))">Add Student</button><button class="btn primary" onclick="quick('teachers',()=>addRec('teachers'))">Add Teacher</button><button class="btn primary" onclick="location.hash='attendance'">Mark Attendance</button><button class="btn primary" onclick="quick('fees',()=>addRec('fees'))">Add Fees</button><button class="btn primary" onclick="quick('results',()=>addRec('results'))">Add Result</button></div>`},
 students(){list('students')},teachers(){list('teachers')},classes(){list('classes')},fees(){list('fees')},results(){list('results')},
 attendance:attPage,
 reports(){const a=attStats(),av=D.results.length?(sum(D.results,'pct')/D.results.length).toFixed(2)+'%':'0%';
  $('#view').innerHTML=`<div class="bar no-print"><button class="btn primary" onclick="window.print()">Print Report</button></div>
  <h2 class="ptitle">School Management System \u2013 Report (${new Date().toLocaleDateString('en-IN')})</h2>
  <h3 class="sec">Summary Statistics</h3><div class="stats">${statCard('Students',D.students.length)}${statCard('Teachers',D.teachers.length)}${statCard('Classes',D.classes.length)}${statCard('Attendance',a.pct+'%')}${statCard('Total Fees',money(sum(D.fees,'total')))}${statCard('Fees Collected',money(sum(D.fees,'paid')))}${statCard('Pending Fees',money(sum(D.fees,'rem')))}${statCard('Average Result',av)}</div>
  <h3 class="sec">Student Report</h3>${tableHtml(['ID','Name','Gender','Class','Email','Contact'],D.students.map(s=>[s.sid,s.name,s.gender,s.cls,s.email,s.phone].map(esc)))}
  <h3 class="sec">Teacher Report</h3>${tableHtml(['ID','Name','Gender','Subject','Email','Contact'],D.teachers.map(s=>[s.tid,s.name,s.gender,s.subject,s.email,s.phone].map(esc)))}
  <h3 class="sec">Attendance Report</h3>${tableHtml(['Class','Students','Present','Absent','Late','Attendance %'],D.classes.map(c=>{const n=cl(c),s=attStats(n);return[esc(n),D.students.filter(x=>x.cls===n).length,s.p,s.a,s.l,s.pct+'%']}))}
  <h3 class="sec">Fees Report</h3>${tableHtml(['Student ID','Name','Class','Total','Paid','Remaining','Status'],D.fees.map(f=>[esc(f.sid),esc(f.name),esc(f.cls),money(f.total),money(f.paid),money(f.rem),`<span class="badge ${bc(f.status)}">${f.status}</span>`]))}
  <h3 class="sec">Results Report</h3>${tableHtml(['Student ID','Name','Class','Total','Percentage','Grade'],D.results.map(r=>[esc(r.sid),esc(r.name),esc(r.cls),r.total+' / 500',r.pct+'%',`<span class="badge ${bc(r.grade)}">${r.grade}</span>`]))}`}
};
showApp();
