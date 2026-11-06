type Connection={url:string,code:string};
const KEY='df-english-sheets-v1';
const OLD_ENDPOINT='https://script.google.com/macros/s/AKfycbzAJLUfaqi0hoUOUHM-8aQdIRhQo3VuTn51Z5T2iSNEu_JJw0fMWjX5S0CjVSU8TfobWg/exec',NEW_ENDPOINT='https://script.google.com/macros/s/AKfycbzvjaP0FrQafGeerVq-4SYeCa0758ubhmd5diRvFsDmXUMleOtAZjMKl_NwdAyvIKmnJg/exec';
export function getConnection():Connection{if(typeof window==='undefined')return {url:'',code:''};try{const c=JSON.parse(localStorage.getItem(KEY)||'{"url":"","code":""}');if(c.url===OLD_ENDPOINT){c.url=NEW_ENDPOINT;try{localStorage.setItem(KEY,JSON.stringify(c))}catch{}}return c}catch{return {url:'',code:''}}}
function isStatic(){return typeof document!=='undefined'&&document.querySelector('meta[name="df-host"]')?.getAttribute('content')==='github'}
export function backendName(){return getConnection().url?'Google Sheets':isStatic()?'Solo questo dispositivo · Google Sheets da collegare':'Database Sites'}
export function disconnectSheets(){localStorage.removeItem(KEY)}
export const isSheets=()=>!!getConnection().url;
// PIN sbloccati in questa sessione: restano solo finché l’app è aperta.
const PINS='df-pins-v1';
function loadPins():Record<string,string>{if(typeof window==='undefined')return {};try{return JSON.parse(sessionStorage.getItem(PINS)||'{}')}catch{return {}}}
export const unlockedPin=(p:string):string|undefined=>loadPins()[p];
export function rememberPin(p:string,pin:string){try{sessionStorage.setItem(PINS,JSON.stringify({...loadPins(),[p]:pin}))}catch{}}
export function forgetPin(p:string){try{const x=loadPins();delete x[p];sessionStorage.setItem(PINS,JSON.stringify(x))}catch{}}
async function sheetsRequest(c:Connection,action:string,events?:unknown[],extra:Record<string,unknown>={}){if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(c.url))throw new Error('Usa l’indirizzo /exec della Web App Google Apps Script.');const response=await fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow',body:JSON.stringify({action,token:c.code,events,pins:loadPins(),...extra}),signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('Google non ha risposto. Controlla indirizzo e pubblicazione della Web App.');let data:any;try{data=await response.json()}catch{throw new Error('La Web App non restituisce dati. Controlla accesso e pubblicazione.')}if(!data.ok){const err:any=new Error(data.error||'Google Sheets non disponibile.');err.code=data.code;err.profile=data.profile;throw err}return data}
export async function connectSheets(url:string,code:string){const connection={url,code};await sheetsRequest(connection,'read');localStorage.setItem(KEY,JSON.stringify(connection))}
export async function readEvents(){const c=getConnection();if(c.url)return sheetsRequest(c,'read');if(isStatic())throw new Error('Collega Google Sheets da Preferenze → Collegamento dati.');const r=await fetch('/api/events',{cache:'no-store'});if(!r.ok)throw new Error('Database Sites temporaneamente non disponibile.');return r.json()}
export async function writeEvents(events:unknown[]){const c=getConnection();if(c.url)return sheetsRequest(c,'append',events);if(isStatic())throw new Error('Collega Google Sheets per sincronizzare i progressi.');const r=await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events})});if(!r.ok)throw new Error('Salvataggio online non riuscito. I dati restano sul dispositivo.');return r.json()}

export async function sheetsVerifyPin(profile:string,pin:string):Promise<boolean>{const r=await sheetsRequest(getConnection(),'verify',undefined,{profile,pin});return !!r.valid}
export async function sheetsSetPin(profile:string,pin:string,oldPin?:string){await sheetsRequest(getConnection(),'setpin',undefined,{profile,pin,oldPin})}
export async function sheetsHide(profile:string,pin:string){await sheetsRequest(getConnection(),'hide',undefined,{profile,pin})}
