import { getDb } from '../../../db';
import { events } from '../../../db/schema';
export const dynamic = 'force-dynamic';
const kinds = ['answer','complete','assessment','favorite','practice','goal','profile','challenge','challenge-reply','pin','hide'];
export async function GET() {
 try { const rows = await getDb().select().from(events).all(); return Response.json({events:rows.map(r=>({...r,data:JSON.parse(r.data)}))},{headers:{'Cache-Control':'no-store'}}); }
 catch { return Response.json({error:'Salvataggio online temporaneamente non disponibile.'},{status:503}); }
}
export async function POST(request:Request) {
 const origin = request.headers.get('origin');
 if (origin && new URL(request.url).host !== new URL(origin).host) return Response.json({error:'Origine non consentita'},{status:403});
 try {
 const body = await request.text(); if(body.length>200000) return Response.json({error:'Dati troppo grandi'},{status:413});
 const list = JSON.parse(body).events;
 if(!Array.isArray(list)||!list.length||list.length>100) return Response.json({error:'Dati non validi'},{status:400});
 for(const e of list) {
 if(typeof e.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(e.id)||typeof e.profile!=='string'||!/^[\p{L}][\p{L}\p{N} ._'’-]{0,39}$/u.test(e.profile)||!kinds.includes(e.kind)||typeof e.data!=='object'||e.data===null||JSON.stringify(e.data).length>4000||typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at))) return Response.json({error:'Dati non validi'},{status:400});
 }
 const db=getDb();
 const statements = list.map(e=>db.insert(events).values({...e,data:JSON.stringify(e.data)}).onConflictDoNothing());
 await db.batch([statements[0],...statements.slice(1)]);
 return Response.json({ok:true});
 } catch { return Response.json({error:'Salvataggio non riuscito. I progressi restano sul dispositivo.'},{status:503}); }
}
