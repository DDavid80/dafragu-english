'use client';
import {useEffect,useMemo,useState} from 'react';
import {Bell,BellRing,Check,Clock,MessageCircle,Trash2} from 'lucide-react';

export type NotificationPrefs={enabled:boolean,daily:boolean,challenges:boolean,time:string,browser:boolean};
type Item={id:string,title:string,body:string,kind:'daily'|'challenge',at:number};
const defaultPrefs:NotificationPrefs={enabled:true,daily:true,challenges:true,time:'20:30',browser:false};
const messages=[
 'Dieci minuti di inglese? Una frase alla volta, senza fretta. 🇬🇧',
 'Oggi bastano poche parole. Il resto lo farà la pratica! 😊',
 'Hey! Un piccolo allenamento in inglese ci sta? 🌍',
 'Una pausa inglese prima di chiudere la giornata? 🎧',
 'Oggi l’inglese chiama: rispondi con dieci minuti! 😄',
 'Cinque frasi oggi valgono più di zero domani. ✨',
 'Ready? Un ripasso veloce e sei a posto per oggi. 💬'
];
function readJSON<T>(key:string,fallback:T):T{try{const data=localStorage.getItem(key);return data?JSON.parse(data) as T:fallback}catch{return fallback}}
function localDay(d:Date){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
export function useEnglishNotifications(profile:string,challenges:Array<{cid:string,from:string}>){
 const store='df-english-notify-v1:'+profile;
 const [prefs,setPrefs]=useState<NotificationPrefs>(defaultPrefs);
 const [read,setRead]=useState<string[]>([]);
 const [tick,setTick]=useState(0);
 const [initialized,setInitialized]=useState(false);
 useEffect(()=>{
  setInitialized(false);
  const saved=readJSON<Partial<NotificationPrefs>>(store+':prefs',{});
  setPrefs({...defaultPrefs,...saved});
  setRead(readJSON<string[]>(store+':read',[]));
  setInitialized(true);
 },[store]);
 useEffect(()=>{if(initialized)try{localStorage.setItem(store+':prefs',JSON.stringify(prefs))}catch{}},[prefs,store,initialized]);
 useEffect(()=>{if(initialized)try{localStorage.setItem(store+':read',JSON.stringify(read.slice(-150)))}catch{}},[read,store,initialized]);
 useEffect(()=>{const id=window.setInterval(()=>setTick(x=>x+1),60000);return()=>window.clearInterval(id)},[]);
 const items=useMemo(()=>{
  const result:Item[]=[];
  if(!initialized||!prefs.enabled)return result;
  const now=new Date();const today=localDay(now);
  const [hh,mm]=prefs.time.split(':').map(Number);
  const reminder=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hh||0,mm||0);
  if(prefs.daily&&now.getTime()>=reminder.getTime()){
   const day=Math.floor(reminder.getTime()/86400000);
   result.push({id:'daily:'+today,title:'Il tuo inglese ti aspetta',body:messages[Math.abs(day)%messages.length],kind:'daily',at:reminder.getTime()});
  }
  if(prefs.challenges)for(const c of challenges){
   result.push({id:'challenge:'+c.cid,title:'Hai una nuova sfida!',body:c.from+' ti ha invitato a una sfida di inglese.',kind:'challenge',at:now.getTime()});
  }
  return result;
 },[profile,prefs,initialized,tick,challenges.map(c=>c.cid+':'+c.from).join('|')]);
 const unread=items.filter(x=>!read.includes(x.id));
 function markRead(id:string){setRead(r=>r.includes(id)?r:[...r,id])}
 function markAll(){setRead(r=>Array.from(new Set([...r,...items.map(i=>i.id)])))}
 function updatePrefs(next:Partial<NotificationPrefs>){setPrefs(p=>({...p,...next}))}
 async function requestBrowser(){
  if(!('Notification' in window)){return 'Le notifiche di sistema non sono disponibili in questo browser.'}
  const answer=await Notification.requestPermission();
  updatePrefs({browser:answer==='granted'});
  return answer==='granted'?'Permesso concesso: avvisi di sistema quando l’app è in uso.':'Permesso non concesso.';
 }
 useEffect(()=>{
  if(!initialized||!prefs.browser||typeof Notification==='undefined'||Notification.permission!=='granted')return;
  for(const n of unread){
   const key=store+':shown:'+n.id;
   try{
    if(sessionStorage.getItem(key))continue;
    sessionStorage.setItem(key,'1');
    if(n.kind==='daily'&&Date.now()-n.at>5*60000)continue;
    new Notification(n.title,{body:n.body,tag:n.id});
   }catch{}
  }
 },[initialized,prefs.browser,unread.map(n=>n.id).join('|'),store]);
 return {prefs,items,unread,markRead,markAll,updatePrefs,requestBrowser};
}
export type EnglishNotify=ReturnType<typeof useEnglishNotifications>;
export function NotificationBell({data,onOpen}:{data:EnglishNotify,onOpen:()=>void}){
 return <button type="button" className="top-settings-button notify-bell" title="Notifiche" aria-label={'Notifiche: '+data.unread.length+' non lette'} onClick={onOpen}><Bell size={21}/>{data.unread.length>0&&<span className="notify-count">{Math.min(data.unread.length,9)}</span>}</button>;
}
export function NotificationInbox({data,onChallenge}:{data:EnglishNotify,onChallenge:()=>void}){
 return <section className="panel notification-inbox"><div className="notification-heading"><div><h2><BellRing size={22}/> Notifiche</h2><p className="small muted">Messaggi per il tuo profilo su questo dispositivo.</p></div>{data.unread.length>0&&<button className="secondary" onClick={data.markAll}><Check size={16}/> Segna lette</button>}</div>
 {data.items.length===0?<p className="small muted">Nessun nuovo promemoria o sfida.</p>:data.items.map(n=><div key={n.id} className={'notification-entry '+(!data.unread.some(u=>u.id===n.id)?'read':'')}>
 <span className="notification-kind">{n.kind==='daily'?<Clock size={19}/>:<MessageCircle size={19}/>}</span><div><b>{n.title}</b><p>{n.body}</p></div>
 <button className="text-button" onClick={()=>{data.markRead(n.id);if(n.kind==='challenge')onChallenge()}}>{n.kind==='challenge'?'Apri':'Letto'}</button>
 </div>)}
 </section>;
}
export function NotificationSettings({data}:{data:EnglishNotify}){
 const [status,setStatus]=useState('');
 return <section className="notification-settings"><h3><Bell size={19}/> Notifiche e promemoria</h3>
 <p className="small muted">Le impostazioni valgono per questo profilo su questo dispositivo.</p>
 <label className="toggle-row"><span><b>Notifiche nell’app</b><small>Promemoria e avvisi quando apri DaFragu English.</small></span><input type="checkbox" checked={data.prefs.enabled} onChange={e=>data.updatePrefs({enabled:e.target.checked})}/></label>
 <label className="toggle-row"><span><b>Promemoria giornaliero</b><small>Un messaggio diverso per dedicare qualche minuto all’inglese.</small></span><input type="checkbox" disabled={!data.prefs.enabled} checked={data.prefs.daily} onChange={e=>data.updatePrefs({daily:e.target.checked})}/></label>
 <label className="field-label" htmlFor="reminder-time">Orario preferito</label>
 <input id="reminder-time" className="answer-input" type="time" disabled={!data.prefs.enabled||!data.prefs.daily} value={data.prefs.time} onChange={e=>data.updatePrefs({time:e.target.value})}/>
 <label className="toggle-row"><span><b>Avvisi per le sfide</b><small>Un avviso quando un altro profilo ti sfida.</small></span><input type="checkbox" disabled={!data.prefs.enabled} checked={data.prefs.challenges} onChange={e=>data.updatePrefs({challenges:e.target.checked})}/></label>
 <div className="divider"/>
 <h3>Avvisi di sistema</h3>
 <p className="small muted">Puoi autorizzare gli avvisi del browser mentre l’app è in uso. Per notifiche con l’app chiusa serve un servizio Web Push da configurare separatamente.</p>
 <button className="secondary" type="button" onClick={async()=>setStatus(await data.requestBrowser())} disabled={!data.prefs.enabled}>Attiva avvisi di sistema</button>
 {status&&<p className="small" role="status">{status}</p>}
 </section>;
}
