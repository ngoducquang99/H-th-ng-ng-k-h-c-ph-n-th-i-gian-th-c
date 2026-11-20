const studentId='SV2024001';
let courses=[], registrations=[];
const $=s=>document.querySelector(s);
const socket=io();
const content=$('.content');
const registrationTemplate=content.innerHTML;

async function api(url,options={}){const r=await fetch(url,options);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Có lỗi xảy ra');return d}
async function load(){courses=await api('/api/courses');registrations=await api(`/api/registrations?studentId=${studentId}`);if($('.courses-card'))renderRegistration()}

function pageHeader(eyebrow,title,action=''){
 return `<div class="title-row"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div>${action}</div>`;
}

function navigate(page){
 document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));
 const labels={home:'Trang chủ',registration:'Đăng ký học phần',schedule:'Thời khóa biểu',results:'Kết quả học tập',tuition:'Học phí'};
 $('.breadcrumb strong').textContent=labels[page];
 if(page==='registration'){
   content.innerHTML=registrationTemplate;
   bindRegistrationEvents();load();
 }else if(page==='home')renderHome();
 else if(page==='schedule')renderSchedule();
 else if(page==='results')renderResults();
 else renderTuition();
 history.replaceState(null,'',`#${page}`);
}

function renderHome(){
 const credits=registrations.reduce((n,r)=>n+r.credits,0);
 content.innerHTML=pageHeader('KỲ HỌC 1 · 2026–2027','Tổng quan sinh viên')+`
 <div class="stats"><div class="stat"><span class="icon violet">▦</span><div><small>Học phần đã đăng ký</small><b>${registrations.length} học phần</b></div></div><div class="stat"><span class="icon blue">◫</span><div><small>Tổng tín chỉ</small><b>${credits} tín chỉ</b></div></div><div class="stat"><span class="icon green">✓</span><div><small>Trạng thái học vụ</small><b class="success">Bình thường</b></div></div></div>
 <div class="dashboard-grid"><section class="panel"><div class="card-head"><h2>Thông tin sinh viên</h2></div><div class="profile-detail"><div class="large-avatar">NT</div><div><strong>Nguyễn Thảo</strong><span>SV2024001 · Công nghệ thông tin</span><span>Ngành Công nghệ thông tin · Khóa 2024</span></div></div></section>
 <section class="panel"><div class="card-head"><h2>Tiến độ học tập</h2><span>42 / 120 TC</span></div><div class="progress-wrap"><div class="progress-ring"><b>35%</b></div><div><p><b>42 tín chỉ</b><small>Đã tích lũy</small></p><p><b>3.42</b><small>Điểm trung bình</small></p><p><b>15</b><small>Học kỳ 1/2026</small></p></div></div></section></div>
 <section class="panel notice-panel"><div class="card-head"><h2>Thông báo mới nhất</h2></div><div class="notice"><i class="dot blue-dot"></i><div><strong>Thời gian đăng ký học phần học kỳ 1/2026</strong><span>Phòng Đào tạo · 20/11/2026</span></div></div><div class="notice"><i class="dot orange-dot"></i><div><strong>Lịch thi kết thúc học phần đã được công bố</strong><span>Phòng Khảo thí · 18/11/2026</span></div></div></section>`;
}

function renderSchedule(){
 const weekly=[
  ['Thứ 2','7:00','Lập trình nhập môn','A1-301','CS101'],['Thứ 2','9:30','Tiếng Anh chuyên ngành','B1-102','ENG201'],
  ['Thứ 3','7:00','Cơ sở dữ liệu','B2-204','CS205'],['Thứ 4','7:00','Cấu trúc dữ liệu','A2-105','CS301'],
  ['Thứ 5','13:00','Hệ phân tán','C1-210','CS401'],['Thứ 6','7:00','Phân tích thiết kế','B1-302','SE220'],['Thứ 7','13:00','Mạng máy tính','A3-401','NET210']];
 content.innerHTML=pageHeader('THỜI KHÓA BIỂU · HỌC KỲ 1/2026','Lịch học trong tuần','<div class="week-control"><button id="prevWeek">‹</button><strong>17 – 23/11/2026</strong><button id="nextWeek">›</button></div>')+
 `<div class="schedule-layout"><section class="panel schedule-table"><div class="card-head"><h2>Thời khóa biểu tuần</h2><span>7 lớp học</span></div><div class="table-wrap"><table><thead><tr><th>Thứ</th><th>Tiết</th><th>Thời gian</th><th>Học phần</th><th>Phòng</th><th>Mã HP</th></tr></thead><tbody>${weekly.map((r,i)=>`<tr><td><b>${r[0]}</b></td><td>${i%2+1}</td><td><span class="time-badge">${r[1]}</span></td><td><span class="course-name">${r[2]}</span></td><td>${r[3]}</td><td><span class="course-code">${r[4]}</span></td></tr>`).join('')}</tbody></table></div></section><aside class="panel today-card"><div class="card-head"><h2>Hôm nay</h2></div><div class="today-date"><b>20</b><span>Thứ Sáu<br>Tháng 11</span></div><div class="today-class"><i></i><div><strong>Phân tích thiết kế hệ thống</strong><span>07:00 – 09:30 · B1-302</span></div></div></aside></div>`;
 $('#prevWeek').onclick=()=>toast('Đã chuyển sang tuần trước');$('#nextWeek').onclick=()=>toast('Đã chuyển sang tuần sau');
}

function renderResults(){
 const subjects=[['CS101','Lập trình nhập môn',3,'A','8.7'],['CS205','Cơ sở dữ liệu',4,'A','9.0'],['CS301','Cấu trúc dữ liệu & Giải thuật',4,'B+','8.2'],['SE220','Phân tích thiết kế hệ thống',3,'A','8.8'],['ENG201','Tiếng Anh chuyên ngành',2,'B','7.5']];
 content.innerHTML=pageHeader('KẾT QUẢ HỌC TẬP','Bảng điểm học phần','<select class="page-select"><option>Học kỳ 1 · 2026–2027</option><option>Học kỳ 2 · 2025–2026</option></select>')+
 `<div class="gpa-grid"><div class="gpa-card"><span>Điểm trung bình tích lũy</span><strong>3.42</strong><small>/ 4.00</small></div><div class="gpa-card"><span>Xếp loại</span><strong class="green-text">Giỏi</strong></div><div class="gpa-card"><span>Tín chỉ tích lũy</span><strong>42</strong><small>/ 120 TC</small></div></div>
 <section class="panel result-panel"><div class="card-head"><h2>Kết quả học kỳ 1/2026–2027</h2><span>5 học phần</span></div><div class="table-wrap"><table><thead><tr><th>Mã HP</th><th>Tên học phần</th><th>TC</th><th>Điểm chữ</th><th>Điểm số</th><th>Trạng thái</th></tr></thead><tbody>${subjects.map(s=>`<tr><td><span class="course-code">${s[0]}</span></td><td><b>${s[1]}</b></td><td>${s[2]}</td><td><span class="grade">${s[3]}</span></td><td><b>${s[4]}</b></td><td><span class="status-badge">Đạt</span></td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderTuition(){
 content.innerHTML=pageHeader('HỌC PHÍ · HỌC KỲ 1/2026','Thông tin học phí','<button class="outline-action" id="downloadInvoice">↓ Tải phiếu thu</button>')+
 `<div class="tuition-grid"><section class="panel tuition-summary"><div class="card-head"><h2>Tổng quan học phí</h2><span class="status-badge pending">Còn nợ 4.500.000 đ</span></div><div class="fee-row"><span>Tổng học phí kỳ</span><b>8.500.000 đ</b></div><div class="fee-row"><span>Đã thanh toán</span><b class="green-text">4.000.000 đ</b></div><div class="fee-row"><span>Còn phải thanh toán</span><b class="red-text">4.500.000 đ</b></div><div class="fee-progress"><i style="width:47%"></i></div><button class="pay-button" id="payNow">Thanh toán ngay</button></section>
 <section class="panel payment-history"><div class="card-head"><h2>Lịch sử thanh toán</h2></div><div class="payment"><div><strong>Thanh toán học phí</strong><span>20/10/2026 · QR Banking</span></div><b>4.000.000 đ</b></div><div class="payment"><div><strong>Nộp khoản phí ban đầu</strong><span>05/08/2026 · Ví điện tử</span></div><b>1.500.000 đ</b></div></section></div>`;
 $('#payNow').onclick=()=>toast('Đã chuyển sang cổng thanh toán an toàn');$('#downloadInvoice').onclick=()=>toast('Đang tạo phiếu thu PDF');
}

function renderRegistration(){
 const q=$('#search').value.toLowerCase().trim();const filter=$('#filter').value;
 const filtered=courses.filter(c=>{const match=`${c.code} ${c.name}`.toLowerCase().includes(q);const reg=registrations.some(r=>r.courseId===c.id);return match&&(filter==='all'||(filter==='available'&&c.available>0)||(filter==='registered'&&reg))});
 $('#courseCount').textContent=`${filtered.length} học phần`;
 $('#courses').innerHTML=filtered.map(c=>{const reg=registrations.some(r=>r.courseId===c.id);const pct=Math.round(c.registered/c.capacity*100);return `<tr><td><span class="course-code">${c.code}</span></td><td><span class="course-name">${c.name}</span><span class="course-meta">${c.lecturer}</span></td><td>${c.credits}</td><td><b>${c.schedule}</b><span class="course-meta">${c.room}</span></td><td><div class="seat ${c.available===0?'full':''}"><div class="seat-line"><i style="width:${pct}%"></i></div>${c.registered}/${c.capacity}</div></td><td><button class="register-btn ${reg?'registered':''}" data-id="${c.id}" ${reg?'':c.available===0?'disabled':''}>${reg?'Đã chọn':'Đăng ký'}</button></td></tr>`}).join('')||'<tr><td colspan="6" style="text-align:center;color:#98a2b3;height:120px">Không tìm thấy học phần</td></tr>';
 const credits=registrations.reduce((sum,r)=>sum+(r.credits||0),0);
 $('#creditCount').textContent=`${registrations.length} học phần`;$('#creditTotal').textContent=`${credits} tín chỉ`;$('#selectedCount').textContent=registrations.length;$('#footerCredits').textContent=`${credits} TC`;
 $('#selectedList').innerHTML=registrations.length?registrations.map(r=>`<div class="selected-item"><div class="selected-item-top"><div><strong>${r.courseCode} — ${r.courseName}</strong><small>${r.schedule} · ${r.credits} tín chỉ</small></div><button class="remove" data-remove="${r.courseId}" title="Hủy đăng ký">×</button></div></div>`).join(''):'<div class="empty">Chưa có học phần nào được chọn<br>Chọn học phần từ danh sách bên trái</div>';
 $('#confirmBtn').disabled=!registrations.length;
}

function bindRegistrationEvents(){
 $('#courses').addEventListener('click',async e=>{const btn=e.target.closest('[data-id]');if(!btn)return;const c=courses.find(x=>x.id===btn.dataset.id);if(registrations.some(r=>r.courseId===c.id)){await remove(c.id);return}try{await api('/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId,courseId:c.id})});toast(`Đã đăng ký ${c.name}`);await load()}catch(err){toast(err.message,true)}});
 $('#selectedList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b)remove(b.dataset.remove)});
 $('#search').addEventListener('input',renderRegistration);$('#filter').addEventListener('change',renderRegistration);
 $('#confirmBtn').addEventListener('click',()=>toast('Đăng ký học phần đã được xác nhận thành công'));
}
async function remove(courseId){try{await api(`/api/registrations/${courseId}?studentId=${studentId}`,{method:'DELETE'});toast('Đã hủy đăng ký học phần');await load()}catch(err){toast(err.message,true)}}
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=`toast show ${error?'error':''}`;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.className='toast',2600)}

document.querySelectorAll('.sidebar nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.page)}));
socket.on('courses-updated',c=>{courses=c;if($('.courses-card'))renderRegistration()});socket.on('registration-updated',()=>load());socket.on('registration-cancelled',()=>load());

load().then(()=>{bindRegistrationEvents();const hash=location.hash.slice(1);if(hash&&hash!=='registration')navigate(hash)});
