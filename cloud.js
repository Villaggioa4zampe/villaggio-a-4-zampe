(()=>{
const clientId='560086379694-tlq9lurdnn199et5792pt4d14n3lmh0k.apps.googleusercontent.com';
const scope='https://www.googleapis.com/auth/drive.file';
const name='villaggio-a-4-zampe-backup.json';
const base='https://www.googleapis.com/drive/v3/files';
let token='', expires=0, client, busy=false, pending=false, timer, ready=false, remote=null;
const receiptKey = 'v4z_cloud_receipt';
const pendingKey = 'v4z_cloud_pending';
const sameBackup = (a, b) => a === b || (!!a && !!b && !!a.modifiedTime &&
  a.id === b.id && a.modifiedTime === b.modifiedTime);
function rememberBackup(file) {
  remote = file;
  localStorage.setItem(receiptKey, JSON.stringify(file));
}
const el=id=>document.getElementById(id);
const status=t=>el('cloudStatus').textContent=t;
const active=()=>!!token&&Date.now()<expires;
function controls(){el('cloudConnect').disabled=!client||busy;for(const id of ['cloudSave','cloudRestore','cloudDisconnect'])el(id).disabled=!active()||busy;el('cloudLast').textContent='Ultimo backup su questo dispositivo: '+(localStorage.getItem('v4z_cloud_last')||'mai');}
async function req(url,options={}){if(!active())throw Error('Autorizzazione scaduta: ricollega Google Drive.');const r=await fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok){if(r.status===401){token='';ready=false;}throw Error('Google Drive: errore '+r.status);}return r.json();}
async function locate(){const q=new URLSearchParams({q:"name = '"+name+"' and trashed = false",fields:'nextPageToken,files(id,modifiedTime)',pageSize:'100',orderBy:'modifiedTime desc'});const r=await req(base+'?'+q);if(r.files.length>1||r.nextPageToken)throw Error('Trovati più backup: verifica i file in Drive prima di continuare.');return r.files[0]||null;}
async function run(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){status(e.message||'Errore di collegamento');}finally{busy=false;controls();const reschedule=pending;pending=false;if(reschedule&&ready&&active())schedule();}}
function snapshot(){return {version:1,savedAt:new Date().toISOString(),boxes,bookings};}
async function upload() {
  await run(async () => {
    status('Salvataggio in corso…');
    const file = await locate();
    if (!sameBackup(file, remote)) {
      remote = file;
      ready = false;
      status('Il backup su Drive è cambiato. Scegli se ripristinarlo o sostituirlo.');
      return;
    }
    const id = file?.id;
    const data = JSON.stringify(snapshot());
    const boundary = 'v4z_' + crypto.randomUUID();
    const form = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(id ? {} : {name, mimeType:'application/json'}) +
      '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' +
      data + '\r\n--' + boundary + '--\r\n';
    const endpoint = 'https://www.googleapis.com/upload/drive/v3/files' +
      (id ? '/' + encodeURIComponent(id) : '') + '?uploadType=multipart&fields=id,modifiedTime';
    const saved = await req(endpoint, {
      method: id ? 'PATCH' : 'POST',
      body: form,
      headers: {'Content-Type': 'multipart/related; boundary=' + boundary}
    });
    rememberBackup(saved);
    ready = true;
    if (!pending) localStorage.removeItem(pendingKey);
    localStorage.setItem('v4z_cloud_last', new Date().toLocaleString('it-IT'));
    status('Backup salvato su Google Drive.');
  });
}
function schedule(){clearTimeout(timer);if(!active()){if(token&&!active()){status('Sessione scaduta: dati salvati solo sul dispositivo.');controls();}return;}if(busy){pending=true;return;}if(ready)timer=setTimeout(upload,1200);}
window.addEventListener('v4z-save', () => {
  localStorage.setItem(pendingKey, '1');
  schedule();
});
window.addEventListener('online', () => {
  if (localStorage.getItem(pendingKey)) schedule();
});
el('cloudConnect').onclick=()=>client.requestAccessToken({prompt:''});
el('cloudSave').onclick=()=>{
  if (!ready && !confirm('Vuoi sostituire il backup remoto con i dati di questo dispositivo?')) return;
  clearTimeout(timer);
  upload();
};
el('cloudRestore').onclick=()=>run(async()=>{const file=await locate();if(!file)throw Error('Nessun backup trovato.');const d=await req(base+'/'+encodeURIComponent(file.id)+'?alt=media');if(d.version!==1||!Array.isArray(d.boxes)||d.boxes.length!==48||!Array.isArray(d.bookings)||!d.boxes.every(b=>typeof b.id==='string'&&typeof b.name==='string'&&Number.isInteger(b.capacity)&&b.capacity>0)||!d.bookings.every(b=>typeof b.id==='string'&&typeof b.dog==='string'&&typeof b.owner==='string'&&typeof b.start==='string'&&typeof b.end==='string'&&Number.isFinite(b.count)&&b.count>0&&d.boxes.some(x=>x.id===b.boxId)))throw Error('Backup non valido. Nessun dato modificato.');if(!confirm('Sostituire i dati locali con '+d.bookings.length+' prenotazioni dal backup?'))return;clearTimeout(timer);pending=false;localStorage.setItem('v4z_before_restore',JSON.stringify(snapshot()));ready=false;boxes=d.boxes;bookings=d.bookings;save();pending=false;render();rememberBackup(file);localStorage.removeItem(pendingKey);ready=true;status('Backup ripristinato. Copia precedente conservata localmente.');});
el('cloudDisconnect').onclick=()=>{clearTimeout(timer);pending=false;ready=false;const old=token;token='';if(old)google.accounts.oauth2.revoke(old,()=>{});status('Scollegato. I dati locali sono conservati.');controls();};
const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.onload=()=>{client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope,callback:r=>{if(r.error){status('Autorizzazione non riuscita: '+r.error);return;}token=r.access_token;expires=Date.now()+Number(r.expires_in)*1000-30000;ready=false;run(async()=>{remote = await locate();
const known = JSON.parse(localStorage.getItem(receiptKey) || 'null');
ready = !remote || sameBackup(remote, known);
if (!ready) {
  status('Backup trovato. Scegli Ripristina oppure Salva backup per sostituirlo.');
  return;
}
status('Backup automatico attivo.');
if (!remote || localStorage.getItem(pendingKey)) pending = true;});},error_callback:()=>status('Accesso interrotto. Riprova in Safari.')});controls();};script.onerror=()=>status('Google non raggiungibile. I dati restano locali.');document.head.append(script);controls();
})();
