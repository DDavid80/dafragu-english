export type Ev={id:string,profile:string,kind:string,data:any,at:string};
export type Stats={lessons:number,answers:number,correct:number,days:string[],byDay:Record<string,number>};
export const dayOf=(s:string)=>new Date(s).toLocaleDateString('en-CA');
export const addDays=(iso:string,n:number)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA')};
// Stesse regole della versione calcolata dal database: serve per i profili sbloccati su questo dispositivo.
export function computeStats(events:Ev[]):Stats{
 const lessons=new Set<string>(),days=new Set<string>(),byDay:Record<string,number>={};let answers=0,correct=0;
 for(const e of events){
  if(!['answer','complete','practice'].includes(e.kind))continue;
  const d=dayOf(e.at);days.add(d);
  if(e.kind==='complete')lessons.add(e.data.lesson);
  if(e.kind==='answer'){
   if(!e.data.review){answers++;if(e.data.correct)correct++}
   if(e.data.correct)byDay[d]=(byDay[d]||0)+1;
  }
 }
 return {lessons:lessons.size,answers,correct,days:[...days].sort(),byDay};
}
export function streakOf(days:string[],today=dayOf(new Date().toISOString())){
 const set=new Set(days);let d=set.has(today)?today:addDays(today,-1),n=0;
 while(set.has(d)){n++;d=addDays(d,-1)}
 return n;
}
export const scoreIn=(byDay:Record<string,number>,start:string,end:string)=>Object.entries(byDay).reduce((t,[d,n])=>d>=start&&d<=end?t+n:t,0);
export type Challenge={cid:string,from:string,to:string,status:'pending'|'active'|'done'|'declined',start?:string,end?:string,sentAt:string};
export function challengesFrom(events:Ev[],today=dayOf(new Date().toISOString())):Challenge[]{
 const replies=events.filter(e=>e.kind==='challenge-reply');
 return events.filter(e=>e.kind==='challenge'&&typeof e.data?.cid==='string'&&typeof e.data?.to==='string').map(e=>{
  const mine=replies.filter(r=>r.data.cid===e.data.cid&&(r.profile===e.data.to||r.profile===e.profile)).sort((a,b)=>a.at.localeCompare(b.at));
  const declined=mine.find(r=>r.data.accept===false);
  const accepted=mine.find(r=>r.data.accept===true&&r.profile===e.data.to&&typeof r.data.start==='string'&&typeof r.data.end==='string');
  const base={cid:e.data.cid,from:e.profile,to:e.data.to,sentAt:e.at};
  if(declined&&(!accepted||declined.at>accepted.at))return {...base,status:'declined' as const};
  if(accepted)return {...base,status:today>accepted.data.end?'done' as const:'active' as const,start:accepted.data.start,end:accepted.data.end};
  return {...base,status:'pending' as const};
 }).sort((a,b)=>b.sentAt.localeCompare(a.sentAt));
}
export async function sha256Hex(text:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('')}
export const localPinHash=(profile:string,pin:string)=>sha256Hex('df-pin|'+profile.toLowerCase()+'|'+pin);
