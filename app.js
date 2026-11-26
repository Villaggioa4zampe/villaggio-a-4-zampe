const $ = s => document.querySelector(s);
const todayISO = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const addDays = (s,n) => { const d=new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const fmt = s => new Date(s+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let boxes=JSON.parse(localStorage.getItem('v4z_boxes')||'null');
let bookings=JSON.parse(localStorage.getItem('v4z_bookings')||'[]');
if(!boxes){boxes=Array.from({length:48},(_,i)=>({id:String(i+1),name:`Box ${i+1}`,capacity:1}));save();}
let month=new Date(); let deferredPrompt=null;
function save(){localStorage.setItem('v4z_boxes',JSON.stringify(boxes));localStorage.setItem('v4z_bookings',JSON.stringify(bookings));window.dispatchEvent(new Event('v4z-save'));}
const isActive = b => !['checked-out','cancelled'].includes(b.status);
const occupiesDay = (b, day) => isActive(b) && b.start <= day && (!b.end || b.end > day);
function dogsOn(day) {
  return bookings.filter(b => occupiesDay(b, day)).reduce((n, b) => n + Number(b.count), 0);
}
function boxDogs(boxId, day) {
  return bookings.filter(b => b.boxId === boxId && occupiesDay(b, day)).reduce((n, b) => n + Number(b.count), 0);
}
function peakBoxOccupancy(boxId, start, end, excludeId) {
  const otherBookings = bookings.filter(b => b.id !== excludeId && b.boxId === boxId && isActive(b));
  const days = new Set([start]);
  // Occupancy can only increase on an arrival date.
  for (const booking of otherBookings) {
    if (booking.start > start && (!end || booking.start < end)) days.add(booking.start);
  }
  let peak = 0;
  for (const day of days) {
    const occupied = otherBookings.filter(b => occupiesDay(b, day)).reduce((n, b) => n + Number(b.count), 0);
    peak = Math.max(peak, occupied);
  }
  return peak;
}
function showToast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400);}
function setPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));render();}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>setPage(t.dataset.page)));
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(a&&a.dataset.action==='new-booking')openBooking();const c=e.target.closest('[data-close]');if(c)$('#'+c.dataset.close).close();});
function render(){renderHome();renderBookings();renderBoxes();renderCalendar();}
function renderHome(){const today=todayISO();$('#dogsPresent').textContent=dogsOn(today);$('#arrivalsToday').textContent=bookings.filter(b=>b.start===today&&isActive(b)).reduce((n,b)=>n+Number(b.count),0);$('#departuresToday').textContent=bookings.filter(b=>b.end===today&&b.status!=='cancelled').reduce((n,b)=>n+Number(b.count),0);$('#boxCount').textContent=boxes.length;const next=bookings.filter(b=>(!b.end||b.end>=today)&&isActive(b)).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,5);$('#upcoming').innerHTML=next.length?next.map(cardHTML).join(''):'<div class="empty-state">Nessun soggiorno in programma. Aggiungi la prima prenotazione.</div>';}
function cardHTML(b){const paid=Number(b.paid||0),total=Number(b.total||0);const status=b.status==='cancelled'?'Annullato':b.status==='checked-in'?'Presente':b.status==='checked-out'?'Concluso':'Prenotato';return `<article class="booking-card"><div><h3>${esc(b.dog)} ${b.count>1?`<span class="muted">× ${b.count}</span>`:''}</h3><p>${b.type==='adoption'?'Associazione ':''}${esc(b.owner)} · ${esc(boxName(b.boxId))}<br>${fmt(b.start)} – ${b.end?fmt(b.end):'Partenza da definire'}</p></div><div class="card-right"><span class="tag ${paid<total?'orange':''}">${b.type==='adoption'?'In adozione · ':''}${status}</span><p class="amount">€ ${(total-paid).toFixed(2)} ${b.status==='cancelled'?'saldo storico':'da saldare'}</p><div class="card-actions"><button class="text-button" data-edit="${esc(b.id)}">Apri</button>${b.phone&&b.status!=='cancelled'?`<a class="text-button" target="_blank" rel="noopener" href="${waLink(b)}">WhatsApp</a>`:''}</div></div></article>`;}
function waLink(b){const phone=String(b.phone||'').replace(/[^0-9]/g,'');const msg=`Conferma soggiorno presso Villaggio a 4 zampe\n${b.dog} (${b.count} cane/i)\nArrivo: ${fmt(b.start)}\nPartenza: ${b.end?fmt(b.end):'da definire'}\nBox: ${boxName(b.boxId)}`;return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;}
function boxName(id){return boxes.find(x=>x.id===id)?.name||'Box rimosso';}
function renderBookings(){const q=($('#bookingSearch')?.value||'').toLowerCase();const type=$('#bookingFilter').value,list=bookings.filter(b=>(!type||b.type===type)&&(b.dog+' '+b.owner).toLowerCase().includes(q)).sort((a,b)=>b.start.localeCompare(a.start));$('#bookingList').innerHTML=list.length?list.map(cardHTML).join(''):'<div class="empty-state">Nessuna prenotazione trovata.</div>';}
$('#bookingSearch').addEventListener('input',renderBookings);
$('#bookingFilter').addEventListener('change',renderBookings);
function updateBookingFields() {
  const adoption = $('#bookingType').value === 'adoption';
  const closed = $('#bookingStatus').value === 'checked-out';
  $('#ownerLabel').textContent = adoption ? 'Associazione' : 'Proprietario';
  $('#ownerName').placeholder = adoption ? 'Nome dell’associazione' : 'Nome e cognome';
  $('#endDate').required = !adoption || closed;
  $('#endLabel').textContent = adoption && !closed ? 'Partenza (facoltativa)' : 'Partenza';
}
$('#bookingType').addEventListener('change', () => {
  if ($('#bookingType').value === 'adoption' && !$('#bookingId').value &&
      $('#endDate').value === $('#endDate').dataset.suggested) {
    $('#endDate').value = '';
  }
  updateBookingFields();
});
$('#bookingStatus').addEventListener('change', updateBookingFields);
function renderBoxes(){const day=todayISO();$('#boxGrid').innerHTML=boxes.map(b=>{const used=boxDogs(b.id,day);return `<button class="box-card" data-box="${esc(b.id)}"><strong>${esc(b.name)}</strong><small class="box-occupancy">${used} / ${b.capacity} cani ora</small><small>Modifica capienza ✎</small></button>`}).join('');document.querySelectorAll('[data-box]').forEach(x=>x.onclick=()=>openBox(x.dataset.box));}
function renderCalendar(){const y=month.getFullYear(),m=month.getMonth();$('#monthLabel').textContent=month.toLocaleDateString('it-IT',{month:'long',year:'numeric'});const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();const names=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];let html=names.map(n=>`<div class="weekday">${n}</div>`).join('');for(let i=0;i<offset;i++)html+='<div class="day empty"></div>';for(let d=1;d<=days;d++){const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,count=dogsOn(iso);html+=`<div class="day ${iso===todayISO()?'today':''}">${d}${count?`<span class="count">${count} 🐾</span>`:''}</div>`;}$('#calendarGrid').innerHTML=html;}
$('#prevMonth').onclick=()=>{month.setMonth(month.getMonth()-1);renderCalendar();};$('#nextMonth').onclick=()=>{month.setMonth(month.getMonth()+1);renderCalendar();};
function populateBoxes(selected){$('#boxSelect').innerHTML=boxes.map(b=>`<option value="${esc(b.id)}" ${b.id===selected?'selected':''}>${esc(b.name)} · cap. ${b.capacity}</option>`).join('');}
function openBooking(id){const b=bookings.find(x=>x.id===id);$('#bookingForm').reset();$('#bookingId').value=b?.id||'';$('#bookingDialogTitle').textContent=b?'Modifica soggiorno':'Nuova prenotazione';$('#dogName').value=b?.dog||'';$('#dogCountInput').value=b?.count||1;$('#ownerName').value=b?.owner||'';$('#phone').value=b?.phone||'';$('#totalAmount').value=b?.total??0;$('#paidAmount').value=b?.paid??0;$('#startDate').value=b?.start||todayISO();$('#endDate').dataset.suggested=addDays(todayISO(),1);$('#endDate').value=b?.end??$('#endDate').dataset.suggested;$('#bookingType').value=b?.type||'';$('#bookingStatus').value=b?.status||'booked';updateBookingFields();$('#notes').value=b?.notes||'';$('#formError').textContent='';populateBoxes(b?.boxId||boxes[0]?.id);$('#deleteBooking').classList.toggle('hidden',!b);$('#bookingDialog').showModal();}
$('#bookingForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#bookingId').value||crypto.randomUUID(),start=$('#startDate').value,end=$('#endDate').value,count=Number($('#dogCountInput').value),boxId=$('#boxSelect').value,box=boxes.find(x=>x.id===boxId);if(end && end<=start){$('#formError').textContent='La partenza deve essere successiva all’arrivo.';return;}if(!box){$('#formError').textContent='Seleziona un box.';return;}const max=peakBoxOccupancy(boxId,start,end,id)+count;if(isActive({status:$('#bookingStatus').value})&&max>Number(box.capacity)){$('#formError').textContent=`Il box ${box.name} non ha capienza sufficiente. Capienza: ${box.capacity} cani.`;return;}const old=bookings.find(x=>x.id===id);const obj={id,type:$('#bookingType').value,dog:$('#dogName').value.trim(),count,boxId,owner:$('#ownerName').value.trim(),phone:$('#phone').value.trim(),total:Number($('#totalAmount').value||0),paid:Number($('#paidAmount').value||0),start,end,status:$('#bookingStatus').value,notes:$('#notes').value.trim()};if(old)Object.assign(old,obj);else bookings.push(obj);save();$('#bookingDialog').close();render();showToast('Prenotazione salvata');});
$('#deleteBooking').onclick=()=>{const id=$('#bookingId').value,b=bookings.find(x=>x.id===id);if(!b||!confirm('Eliminare definitivamente la prenotazione di '+b.dog+'?'))return;bookings=bookings.filter(x=>x.id!==id);save();$('#bookingDialog').close();render();showToast('Prenotazione eliminata');};
function openBox(id){const b=boxes.find(x=>x.id===id);$('#boxId').value=id;$('#boxName').value=b.name;$('#boxCapacity').value=b.capacity;$('#boxDialog').showModal();}
$('#boxForm').addEventListener('submit',e=>{e.preventDefault();const b=boxes.find(x=>x.id===$('#boxId').value);b.name=$('#boxName').value.trim();b.capacity=Math.max(1,Number($('#boxCapacity').value));save();$('#boxDialog').close();render();showToast('Box aggiornato');});
document.addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)openBooking(b.dataset.edit);});
function init(){render();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden');});
$('#installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden');}else showToast('Su iPhone: Condividi → Aggiungi alla schermata Home');};
init();