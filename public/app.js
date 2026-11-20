const studentId='SV2024001';
let courses=[], registrations=[];
const $=s=>document.querySelector(s);
const socket=io();

async function api(url,options={}){const r=await fetch(url,options);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Có lỗi xảy ra');return d}
async function load(){courses=await api('/api/courses');registrations=await api(`/api/registrations?studentId=${studentId}`);render()}

function render(){
  const q=$('#search').value.toLowerCase().trim(); const filter=$('#filter').value;
  const filtered=courses.filter(c=>{const match=`${c.code} ${c.name}`.toLowerCase().includes(q);const registered=registrations.some(r=>r.courseId===c.id);return match&&(filter==='all'||(filter==='available'&&c.available>0)||(filter==='registered'&&registered))});
  $('#courseCount').textContent=`${filtered.length} học phần`;
  $('#courses').innerHTML=filtered.map(c=>{const reg=registrations.some(r=>r.courseId===c.id);const pct=Math.round(c.registered/c.capacity*100);return `<tr><td><span class="course-code">${c.code}</span></td><td><span class="course-name">${c.name}</span><span class="course-meta">${c.lecturer}</span></td><td>${c.credits}</td><td><b>${c.schedule}</b><span class="course-meta">${c.room}</span></td><td><div class="seat ${c.available===0?'full':''}"><div class="seat-line"><i style="width:${pct}%"></i></div>${c.registered}/${c.capacity}</div></td><td><button class="register-btn ${reg?'registered':''}" data-id="${c.id}" ${reg?'':c.available===0?'disabled':''}>${reg?'Đã chọn':'Đăng ký'}</button></td></tr>`}).join('')||'<tr><td colspan="6" style="text-align:center;color:#98a2b3;height:120px">Không tìm thấy học phần</td></tr>';

  const credits=registrations.reduce((sum,r)=>sum+(r.credits||0),0);
  $('#creditCount').textContent=`${registrations.length} học phần`;$('#creditTotal').textContent=`${credits} tín chỉ`;$('#selectedCount').textContent=registrations.length;$('#footerCredits').textContent=`${credits} TC`;
  $('#selectedList').innerHTML=registrations.length?registrations.map(r=>`<div class="selected-item"><div class="selected-item-top"><div><strong>${r.courseCode} — ${r.courseName}</strong><small>${r.schedule} · ${r.credits} tín chỉ</small></div><button class="remove" data-remove="${r.courseId}" title="Hủy đăng ký">×</button></div></div>`).join(''):'<div class="empty">Chưa có học phần nào được chọn<br>Chọn học phần từ danh sách bên trái</div>';
  $('#confirmBtn').disabled=!registrations.length;
}

function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=`toast show ${error?'error':''}`;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.className='toast',2600)}

$('#courses').addEventListener('click',async e=>{const btn=e.target.closest('[data-id]');if(!btn)return;const c=courses.find(x=>x.id===btn.dataset.id);const reg=registrations.some(r=>r.courseId===c.id);if(reg){await remove(c.id);return}try{await api('/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId,courseId:c.id})});toast(`Đã đăng ký ${c.name}`);await load()}catch(err){toast(err.message,true)}});
async function remove(courseId){try{await api(`/api/registrations/${courseId}?studentId=${studentId}`,{method:'DELETE'});toast('Đã hủy đăng ký học phần');await load()}catch(err){toast(err.message,true)}}
$('#selectedList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b)remove(b.dataset.remove)});
$('#search').addEventListener('input',render);$('#filter').addEventListener('change',render);
$('#confirmBtn').addEventListener('click',()=>toast('Đăng ký học phần đã được xác nhận thành công'));
socket.on('courses-updated',c=>{courses=c;render()});socket.on('registration-updated',()=>load());socket.on('registration-cancelled',()=>load());

let remaining=2*3600+18*60+45;setInterval(()=>{remaining=Math.max(0,remaining-1);const h=String(Math.floor(remaining/3600)).padStart(2,'0'),m=String(Math.floor(remaining%3600/60)).padStart(2,'0'),s=String(remaining%60).padStart(2,'0');$('#countdown').textContent=`${h} : ${m} : ${s}`},1000);
load();
