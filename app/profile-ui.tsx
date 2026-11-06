'use client';
import {useState} from 'react';
import {Lock,Trophy,ArrowRight,Users,Check} from 'lucide-react';
import {type Challenge,type Stats,scoreIn,streakOf,addDays,dayOf} from './stats';

export function PinInput({id,label,value,onChange,autoFocus}:{id:string,label:string,value:string,onChange:(v:string)=>void,autoFocus?:boolean}){
 return <div className="pin-field"><label className="field-label" htmlFor={id}>{label}</label><input id={id} className="answer-input pin-input" type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={4} autoFocus={autoFocus} value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,'').slice(0,4))}/></div>;
}

export function LockScreen({profile,profiles,mode,onUnlock,onCreate,onSwitch,onRetry,errorDetail}:{profile:string,profiles:string[],mode:'wait'|'offline'|'enter'|'create',onUnlock:(pin:string)=>Promise<string>,onCreate:(pin:string)=>Promise<string>,onSwitch:(p:string)=>void,onRetry:()=>void,errorDetail?:string}){
 const [pin,setPin]=useState(''),[again,setAgain]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');
  if(pin.length!==4){setError('Il PIN ha 4 cifre.');return}
  if(mode==='create'&&pin!==again){setError('I due PIN non coincidono.');return}
  setBusy(true);const msg=await (mode==='create'?onCreate(pin):onUnlock(pin));setBusy(false);
  if(msg){setError(msg);setPin('');setAgain('')}
 }
 return <div className="lock-screen"><section className="lock-card" role="dialog" aria-modal="true" aria-label="Accesso al profilo">
  <span className="lock-icon"><Lock size={28}/></span>
  <span className="eyebrow">DAFRAGU ENGLISH</span>
  {mode==='wait'&&<><h1>Un momento…</h1><p>Controllo i profili.</p></>}
  {mode==='offline'&&<><h1>Serve la connessione</h1><p>Non riesco a controllare il PIN di {profile}.</p>{errorDetail&&<p className="error-text small" role="alert">{errorDetail}</p>}<button className="primary" onClick={onRetry}>Riprova<ArrowRight size={18}/></button></>}
  {(mode==='enter'||mode==='create')&&<form onSubmit={submit}>
   <h1>{mode==='enter'?`Ciao, ${profile}.`:`Scegli il PIN di ${profile}`}</h1>
   <p>{mode==='enter'?'Inserisci il tuo PIN a 4 cifre.':'Scegli 4 cifre che ricordi. Servono ogni volta che apri il profilo, così nessun altro ci entra.'}</p>
   <PinInput id="pin" label="PIN" value={pin} onChange={setPin} autoFocus/>
   {mode==='create'&&<PinInput id="pin2" label="Ripeti il PIN" value={again} onChange={setAgain}/>}
   {error&&<p className="error-text small" role="alert">{error}</p>}
   <button className="primary" type="submit" disabled={busy||pin.length!==4||(mode==='create'&&again.length!==4)}>{mode==='enter'?'Entra':'Salva il PIN'}<ArrowRight size={18}/></button>
   {mode==='enter'&&<p className="small muted">PIN dimenticato? Chi gestisce il foglio Google può azzerarlo dalla colonna PinHash.</p>}
  </form>}
  {profiles.length>1&&<div className="lock-switch"><span className="small muted">Non sei {profile}?</span><div className="profile-switch">{profiles.filter(p=>p!==profile).map(p=><button key={p} onClick={()=>onSwitch(p)}>{p[0]} · {p}</button>)}</div></div>}
 </section></div>;
}

export function CompareTable({rows}:{rows:{name:string,stats:Stats,me:boolean}[]}){
 return <section className="panel compare"><h3>Tutti a confronto</h3><p className="small muted">Numeri dei profili dello spazio, calcolati sui progressi salvati.</p>
  <div className="compare-scroll"><table className="compare-table"><thead><tr><th>Profilo</th><th>Lezioni</th><th>Precisione</th><th>Giorni</th><th>Serie</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.name} className={r.me?'me':''}><th scope="row">{r.name}{r.me&&<small> (tu)</small>}</th><td>{r.stats.lessons} / 12</td><td>{r.stats.answers?Math.round(100*r.stats.correct/r.stats.answers)+'%':'—'}</td><td>{r.stats.days.length}</td><td>{streakOf(r.stats.days)}</td></tr>)}
  </tbody></table></div></section>;
}

export function ChallengeCard({c,me,statsFor,onReply}:{c:Challenge,me:string,statsFor:(p:string)=>Stats,onReply:(c:Challenge,accept:boolean)=>void}){
 const other=c.from===me?c.to:c.from,today=dayOf(new Date().toISOString());
 if(c.status==='pending'){
  return c.to===me
   ?<div className="challenge incoming"><Trophy size={22}/><div><b>{c.from} ti sfida</b><p>Una settimana: vince chi dà più risposte corrette. Parte quando accetti.</p></div><div className="button-row"><button className="primary" onClick={()=>onReply(c,true)}><Check size={17}/>Accetta</button><button className="secondary" onClick={()=>onReply(c,false)}>Rifiuta</button></div></div>
   :<div className="challenge"><Trophy size={22}/><div><b>Sfida a {c.to}</b><p>In attesa che accetti.</p></div><button className="secondary" onClick={()=>onReply(c,false)}>Annulla</button></div>;
 }
 if(c.status==='declined')return null;
 const a=scoreIn(statsFor(me).byDay,c.start!,c.end!),b=scoreIn(statsFor(other).byDay,c.start!,c.end!);
 const left=Math.max(0,Math.round((new Date(c.end!+'T12:00:00').getTime()-new Date(today+'T12:00:00').getTime())/86400000));
 const result=c.status==='done'?(a===b?'Pareggio.':a>b?'Hai vinto tu.':`Ha vinto ${other}.`):(left===0?'Ultimo giorno.':`${left} ${left===1?'giorno':'giorni'} alla fine.`);
 return <div className={'challenge '+c.status}><Trophy size={22}/><div><b>{me} contro {other}</b><p>{c.start} → {c.end} · risposte corrette</p></div><div className="score"><span className={a>=b?'lead':''}>{a}</span><small>–</small><span className={b>=a?'lead':''}>{b}</span></div><p className="result">{result}</p></div>;
}

export function ChallengePanel({me,profiles,challenges,statsFor,onSend,onReply}:{me:string,profiles:string[],challenges:Challenge[],statsFor:(p:string)=>Stats,onSend:(to:string)=>void,onReply:(c:Challenge,accept:boolean)=>void}){
 const others=profiles.filter(p=>p!==me),[to,setTo]=useState('');
 const target=others.includes(to)?to:others[0]||'';
 const mineAll=challenges.filter(c=>c.from===me||c.to===me),shown=mineAll.filter(c=>c.status!=='declined').slice(0,6);
 const busy=mineAll.some(c=>(c.status==='pending'||c.status==='active')&&(c.from===target||c.to===target));
 return <section className="panel challenges"><h3><Users size={18}/> Sfide</h3>
  {others.length?<form className="challenge-form" onSubmit={e=>{e.preventDefault();if(target&&!busy)onSend(target)}}>
   <label className="field-label" htmlFor="challenge-to">Sfida un altro profilo</label>
   <select id="challenge-to" value={target} onChange={e=>setTo(e.target.value)}>{others.map(p=><option key={p} value={p}>{p}</option>)}</select>
   <button className="secondary" type="submit" disabled={!target||busy}><Trophy size={17}/>{busy?'Sfida già in corso':'Invia la sfida'}</button>
  </form>:<p className="small muted">Servono almeno due profili per sfidarsi.</p>}
  {shown.length?<div className="challenge-list">{shown.map(c=><ChallengeCard key={c.cid} c={c} me={me} statsFor={statsFor} onReply={onReply}/>)}</div>:<p className="small muted">Nessuna sfida per ora. La sfida dura 7 giorni dal momento in cui l’altra persona accetta.</p>}
 </section>;
}
