/** DaFragu English — database Google Sheets. Eseguire setup() una volta. */
const DATABASE_ID = '120y5xnqs3F258GdUba-mTcsTF18yQd2466mCppg6EN8';
const KINDS = ['answer','complete','assessment','favorite','practice','goal','profile','notification-read','notification-settings'];
const HEADERS = {Utenti:['Profilo','Nome','Attivo','Creato il'],Eventi:['ID','Profilo','Tipo','Dati JSON','Data e ora'],Config:['Chiave','Valore']};
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
 if(users.getLastRow()<2)users.getRange(2,1,2,4).setValues([['Davide','Davide',true,new Date().toISOString()],['Francesca','Francesca',true,new Date().toISOString()]]);
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
   const events=rows.filter(r=>r[0]).map(r=>({id:String(r[0]),profile:String(r[1]),kind:String(r[2]),data:JSON.parse(String(r[3])),at:r[4] instanceof Date?r[4].toISOString():String(r[4])}));
   const us=db.getSheetByName('Utenti');
   const users=us.getLastRow()>1?us.getRange(2,1,us.getLastRow()-1,4).getValues():[];
   users.filter(r=>r[0]&&r[2]!==false&&String(r[2]).toLowerCase()!=='false').forEach(r=>{if(validName_(String(r[0])))events.push({id:'sheet-profile-'+hash_(String(r[0])).slice(0,32),profile:String(r[0]),kind:'profile',data:{name:String(r[1]||r[0])},at:'1970-01-01T00:00:00.000Z'})});
   return json_({ok:true,events});
  }
  if(body.action!=='append'||!Array.isArray(body.events)||body.events.length<1||body.events.length>100||!body.events.every(validEvent_))return json_({ok:false,error:'Dati non validi.'});
  lock=LockService.getScriptLock();lock.waitLock(15000);
  const us=db.getSheetByName('Utenti');
  const userRows=us.getLastRow()>1?us.getRange(2,1,us.getLastRow()-1,4).getValues():[];
  const names=new Map(userRows.filter(r=>r[0]).map(r=>[String(r[0]).toLowerCase(),String(r[0])]));
  const added=[];
  body.events.filter(e=>e.kind==='profile').forEach(e=>{const key=e.profile.toLowerCase();if(names.has(key)&&names.get(key)!==e.profile)throw new Error('Esiste già un profilo con questo nome.');if(!names.has(key)){names.set(key,e.profile);added.push([e.profile,e.profile,true,e.at])}});
  if(names.size>50)return json_({ok:false,error:'Lo spazio contiene già 50 profili.'});
  if(body.events.some(e=>!names.has(e.profile.toLowerCase())||names.get(e.profile.toLowerCase())!==e.profile))return json_({ok:false,error:'Profilo non registrato. Aggiungilo prima di salvare i progressi.'});
  const sh=db.getSheetByName('Eventi');
  const ids=new Set(sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0])):[]);
  const rows=[];body.events.forEach(e=>{if(!ids.has(e.id)){ids.add(e.id);rows.push([e.id,e.profile,e.kind,JSON.stringify(e.data),e.at])}});
  if(added.length)us.getRange(us.getLastRow()+1,1,added.length,4).setValues(added);
  if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,5).setValues(rows);
  SpreadsheetApp.flush();
  return json_({ok:true,saved:rows.length});
 }catch(e){return json_({ok:false,error:e instanceof SyntaxError?'Formato dei dati non valido.':'Operazione non completata. Riprova: i progressi restano sul dispositivo.'})}
 finally{if(lock)lock.releaseLock()}
}
function escape_(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
