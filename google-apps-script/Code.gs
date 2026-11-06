/** DaFragu English — database Google Sheets. Eseguire setup() una volta. */
const DATABASE_ID = '120y5xnqs3F258GdUba-mTcsTF18yQd2466mCppg6EN8';
const KINDS = ['answer','complete','assessment','favorite','practice','goal','profile','challenge','challenge-reply'];
const PUBLIC_KINDS = ['profile','challenge','challenge-reply'];
const TZ = 'Europe/Rome';
const HEADERS = {Utenti:['Profilo','Nome','Attivo','Creato il','PinHash'],Eventi:['ID','Profilo','Tipo','Dati JSON','Data e ora'],Config:['Chiave','Valore']};
function setup() {
 const properties=PropertiesService.getScriptProperties();
 properties.setProperty('DATABASE_ID',DATABASE_ID);
 if(!properties.getProperty('WORKSPACE_CODE_HASH')){
  const code=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  properties.setProperty('WORKSPACE_CODE_HASH',hash_(code));
  properties.setProperty('WORKSPACE_CODE',code);
 }
 const db=database_();
 Object.keys(HEADERS).forEach(name=>{let sh=db.getSheetByName(name);if(!sh)sh=db.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(HEADERS[name]);sh.setFrozenRows(1)});
 const users=db.getSheetByName('Utenti');
 if(users.getLastRow()<2)users.getRange(2,1,2,5).setValues([['Davide','Davide',true,new Date().toISOString(),''],['Francesca','Francesca',true,new Date().toISOString(),'']]);
 showConnection();
}
function onOpen(){SpreadsheetApp.getUi().createMenu('DaFragu English').addItem('Mostra collegamento','showConnection').addToUi()}
function showConnection(){
 const code=PropertiesService.getScriptProperties().getProperty('WORKSPACE_CODE');
 if(!code)throw new Error('Eseguire setup() prima di continuare.');
 const url=ScriptApp.getService().getUrl()||'';
 const html='<html><body style="font:15px system-ui;background:#14202c;color:#dce4e8;padding:24px"><h2>Collega il vostro spazio</h2><p>In DaFragu English apri Preferenze → Collegamento dati.</p><p>Indirizzo Web App (dopo la pubblicazione):</p><input style="width:100%" readonly value="'+escape_(url)+'"><p>Codice dello spazio condiviso:</p><input style="width:100%" type="password" id="code" readonly value="'+escape_(code)+'"><button onclick="document.getElementById(\'code\').type=\'text\'">Mostra codice</button><p>Chi possiede il codice può usare tutti i profili dello spazio. Condividilo solo con le persone che vuoi far partecipare.</p><p>Se l’indirizzo è vuoto o termina con /dev, usa il link /exec restituito da Esegui il deployment → Nuovo deployment → App web.</p></body></html>';
 SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(560).setHeight(430),'DaFragu English');
}
function database_(){const id=PropertiesService.getScriptProperties().getProperty('DATABASE_ID');if(!id)throw new Error('Database non configurato: eseguire setup().');return SpreadsheetApp.openById(id)}
function hash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('')}
function same_(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
function validName_(name){return typeof name==='string'&&/^[\p{L}][\p{L}\p{N} ._'’-]{0,39}$/u.test(name)&&name===name.trim()}
function validEvent_(e){return e&&typeof e.id==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(e.id)&&validName_(e.profile)&&KINDS.indexOf(e.kind)>=0&&e.data&&typeof e.data==='object'&&!Array.isArray(e.data)&&JSON.stringify(e.data).length<=4000&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)}
function doGet(){return json_({ok:true,application:'DaFragu English',schema:1,message:'Il database richiede il codice dello spazio e una richiesta POST.'})}
function doPost(request){
 let lock;
 try {
  const text=request&&request.postData&&request.postData.contents;
  if(!text||text.length>200000)return json_({ok:false,error:'Richiesta troppo grande o vuota.'});
  const body=JSON.parse(text),expected=PropertiesService.getScriptProperties().getProperty('WORKSPACE_CODE_HASH');
  if(!expected||typeof body.token!=='string'||body.token.length>200||!same_(hash_(body.token),expected))return json_({ok:false,error:'Codice dello spazio non valido.'});
  const db=database_();
  if(body.action==='read'){
   const sh=db.getSheetByName('Eventi');
   const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getValues():[];
   const {rows:users}=users_(db);
   const active=new Set(users.filter(r=>r[0]&&isActive_(r)).map(r=>String(r[0])));
   const hidden=users.filter(r=>r[0]&&!isActive_(r)).map(r=>String(r[0]));
   const locked=users.filter(r=>r[0]&&isActive_(r)&&r[4]).map(r=>String(r[0]));
   const pins=body.pins&&typeof body.pins==='object'?body.pins:{};
   const open=new Set();locked.forEach(n=>{if(typeof pins[n]==='string'&&checkPin_(users,n,pins[n]))open.add(n)});
   const all=rows.filter(r=>r[0]).map(r=>({id:String(r[0]),profile:String(r[1]),kind:String(r[2]),data:JSON.parse(String(r[3])),at:r[4] instanceof Date?r[4].toISOString():String(r[4])})).filter(e=>active.has(e.profile));
   const events=all.filter(e=>locked.indexOf(e.profile)<0||open.has(e.profile)||PUBLIC_KINDS.indexOf(e.kind)>=0);
   users.filter(r=>r[0]&&isActive_(r)).forEach(r=>{if(validName_(String(r[0])))events.push({id:'sheet-profile-'+hash_(String(r[0])).slice(0,32),profile:String(r[0]),kind:'profile',data:{name:String(r[1]||r[0])},at:'1970-01-01T00:00:00.000Z'})});
   return json_({ok:true,events,locked,hidden,unlocked:Array.from(open),summaries:summaries_(all)});
  }
  if(body.action==='verify'||body.action==='setpin'||body.action==='hide'){
   if(!validName_(body.profile))return json_({ok:false,error:'Profilo non valido.'});
   lock=LockService.getScriptLock();lock.waitLock(15000);
   const {us,rows}=users_(db);
   const idx=rows.findIndex(r=>String(r[0])===body.profile&&isActive_(r));
   if(idx<0)return json_({ok:false,error:'Profilo non trovato.'});
   const has=!!rows[idx][4];
   if(body.action==='verify'){
    if(has&&throttled_(body.profile))return json_({ok:false,code:'blocked',error:'Troppi tentativi. Riprova tra 10 minuti.'});
    return json_({ok:true,protected:has,valid:checkPin_(rows,body.profile,body.pin)});
   }
   if(body.action==='setpin'){
    if(!validPin_(body.pin))return json_({ok:false,error:'Il PIN deve avere 4 cifre.'});
    if(has&&!checkPin_(rows,body.profile,body.oldPin))return json_({ok:false,code:'pin',error:throttled_(body.profile)?'Troppi tentativi. Riprova tra 10 minuti.':'PIN attuale non corretto.'});
    us.getRange(idx+2,5,1,1).setValues([[pinHash_(body.profile,body.pin)]]);
    SpreadsheetApp.flush();
    return json_({ok:true});
   }
   if(rows.filter(r=>r[0]&&isActive_(r)).length<=1)return json_({ok:false,error:'Deve restare almeno un profilo.'});
   if(!checkPin_(rows,body.profile,body.pin))return json_({ok:false,code:'pin',error:throttled_(body.profile)?'Troppi tentativi. Riprova tra 10 minuti.':'PIN non corretto.'});
   us.getRange(idx+2,3,1,1).setValues([[false]]);
   SpreadsheetApp.flush();
   return json_({ok:true});
  }
  if(body.action!=='append'||!Array.isArray(body.events)||body.events.length<1||body.events.length>100||!body.events.every(validEvent_))return json_({ok:false,error:'Dati non validi.'});
  lock=LockService.getScriptLock();lock.waitLock(15000);
  const {rows:userRows}=users_(db),us=db.getSheetByName('Utenti');
  const names=new Map(userRows.filter(r=>r[0]).map(r=>[String(r[0]).toLowerCase(),String(r[0])]));
  const hiddenNames=new Set(userRows.filter(r=>r[0]&&!isActive_(r)).map(r=>String(r[0])));
  const added=[];
  body.events.filter(e=>e.kind==='profile').forEach(e=>{const key=e.profile.toLowerCase();if(names.has(key)&&names.get(key)!==e.profile)throw new Error('Esiste già un profilo con questo nome.');if(!names.has(key)){names.set(key,e.profile);added.push([e.profile,e.profile,true,e.at,''])}});
  if(names.size>50)return json_({ok:false,error:'Lo spazio contiene già 50 profili.'});
  if(body.events.some(e=>!names.has(e.profile.toLowerCase())||names.get(e.profile.toLowerCase())!==e.profile))return json_({ok:false,error:'Profilo non registrato. Aggiungilo prima di salvare i progressi.'});
  if(body.events.some(e=>hiddenNames.has(e.profile)))return json_({ok:false,code:'hidden',error:'Questo profilo è stato eliminato.'});
  const wpins=body.pins&&typeof body.pins==='object'?body.pins:{};
  const blocked=body.events.find(e=>!added.some(x=>x[0]===e.profile)&&!checkPin_(userRows,e.profile,wpins[e.profile]));
  if(blocked)return json_({ok:false,code:'pin',profile:blocked.profile,error:'PIN non valido per '+blocked.profile+'.'});
  const sh=db.getSheetByName('Eventi');
  const ids=new Set(sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0])):[]);
  const rows=[];body.events.forEach(e=>{if(!ids.has(e.id)){ids.add(e.id);rows.push([e.id,e.profile,e.kind,JSON.stringify(e.data),e.at])}});
  if(added.length)us.getRange(us.getLastRow()+1,1,added.length,5).setValues(added);
  if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,5).setValues(rows);
  SpreadsheetApp.flush();
  return json_({ok:true,saved:rows.length});
 }catch(e){return json_({ok:false,error:e instanceof SyntaxError?'Formato dei dati non valido.':'Operazione non completata. Riprova: i progressi restano sul dispositivo.'})}
 finally{if(lock)lock.releaseLock()}
}
function props_(){return PropertiesService.getScriptProperties()}
function users_(db){
 const us=db.getSheetByName('Utenti');
 if(!us.getRange(1,5,1,1).getValues()[0][0])us.getRange(1,5,1,1).setValues([['PinHash']]);
 const n=us.getLastRow();
 return {us,rows:n>1?us.getRange(2,1,n-1,5).getValues():[]};
}
function isActive_(r){return r[2]!==false&&String(r[2]).toLowerCase()!=='false'}
function validPin_(p){return typeof p==='string'&&/^[0-9]{4}$/.test(p)}
function pinHash_(name,pin){return hash_((props_().getProperty('WORKSPACE_CODE')||'')+'|'+name.toLowerCase()+'|'+pin)}
function failKey_(name){return 'PINFAIL_'+name.toLowerCase()}
function throttled_(name){const raw=props_().getProperty(failKey_(name));if(!raw)return false;try{const o=JSON.parse(raw);return !!o.until&&Date.now()<o.until}catch(e){return false}}
function recordFail_(name){let o={n:0,until:0};try{o=JSON.parse(props_().getProperty(failKey_(name))||'{}')}catch(e){}const n=(o.n||0)+1;props_().setProperty(failKey_(name),JSON.stringify(n>=5?{n:0,until:Date.now()+600000}:{n:n,until:0}))}
function clearFail_(name){if(props_().getProperty(failKey_(name)))props_().setProperty(failKey_(name),'')}
// true se il profilo non ha PIN oppure il PIN è corretto. Dopo 5 errori il profilo si blocca 10 minuti.
function checkPin_(rows,name,pin){
 const r=rows.find(x=>String(x[0])===name);
 if(!r)return false;
 const h=String(r[4]||'');
 if(!h)return true;
 if(throttled_(name))return false;
 if(validPin_(pin)&&same_(pinHash_(name,pin),h)){clearFail_(name);return true}
 recordFail_(name);return false;
}
function summaries_(events){
 const out={},lessons={};
 events.forEach(e=>{
  if(['answer','complete','practice'].indexOf(e.kind)<0)return;
  const s=out[e.profile]||(out[e.profile]={lessons:0,answers:0,correct:0,days:{},byDay:{}});
  const d=Utilities.formatDate(new Date(e.at),TZ,'yyyy-MM-dd');
  s.days[d]=1;
  if(e.kind==='complete'){(lessons[e.profile]||(lessons[e.profile]={}))[e.data.lesson]=1}
  if(e.kind==='answer'){
   if(!e.data.review){s.answers++;if(e.data.correct)s.correct++}
   if(e.data.correct)s.byDay[d]=(s.byDay[d]||0)+1;
  }
 });
 Object.keys(out).forEach(k=>{out[k].lessons=Object.keys(lessons[k]||{}).length;out[k].days=Object.keys(out[k].days).sort()});
 return out;
}
function escape_(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
