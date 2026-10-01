import { getStudyUser } from '../../auth';
import { database } from '@/lib/database';
import { readSummaries,syncOwnBadges } from '@/lib/community';
import { dayKey } from '@/lib/achievements';
import { officialExams } from '@/lib/exams';
import { z } from 'zod';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function ensureSocial(id:string){await database().prepare('INSERT OR IGNORE INTO social_profiles(user_id,friend_code) VALUES(?,?)').bind(id,crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()).run()}
export async function GET(){
 const user=await getStudyUser();if(!user)return json({error:'Entre para ver suas conquistas e amigos.'},401);
 try{
 const db=database();await ensureSocial(user.userId);
 const own=await db.prepare('SELECT friend_code,share_activity FROM social_profiles WHERE user_id=?').bind(user.userId).first<{friend_code:string;share_activity:number}>();
 const summary=await syncOwnBadges(user.userId);
 const connections=await db.prepare('SELECT f.user_a,f.user_b,f.requester,f.status,p.name,p.target,s.share_activity FROM friendships f JOIN profiles p ON p.user_id=CASE WHEN f.user_a=? THEN f.user_b ELSE f.user_a END JOIN social_profiles s ON s.user_id=p.user_id WHERE (f.user_a=? OR f.user_b=?) ORDER BY f.created_at DESC LIMIT 100').bind(user.userId,user.userId,user.userId).all<{user_a:string;user_b:string;requester:string;status:string;name:string;target:string;share_activity:number}>();
 const acceptedIds=connections.results.filter(r=>r.status==='accepted').map(r=>r.user_a===user.userId?r.user_b:r.user_a);
 const summaries=await readSummaries(acceptedIds);
 const friends=connections.results.map(row=>{
 const id=row.user_a===user.userId?row.user_b:row.user_a;
 const base={id,name:row.name,target:row.target,status:row.status,incoming:row.requester!==user.userId};
 if(row.status!=='accepted')return {...base,summary:null,recent:[],sharing:false};
 const {summary,attempts}=summaries.get(id)!;
 return {...base,summary:{currentStreak:summary.currentStreak,bestStreak:summary.bestStreak,badges:summary.badges.filter(b=>b.unlocked)},sharing:!!row.share_activity,recent:row.share_activity?attempts.slice(-5).reverse().map(a=>({at:a.created_at,title:officialExams.find(e=>e.id===a.exam_id)?.title||(a.exam_id==='diagnostic'?'Diagnóstico inicial':'Treino personalizado'),subjects:[...new Set(a.result.items.filter(i=>!!i.selected).map(i=>i.subject))]})):[]};
 });return json({summary,code:own!.friend_code,shareActivity:!!own!.share_activity,friends});
 }catch(e){console.error('Community load failed',e);return json({error:'Não foi possível carregar conquistas e amigos. Tente novamente.'},503)}
}
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('heartbeat')}),z.object({action:z.literal('settings'),shareActivity:z.boolean()}),
 z.object({action:z.literal('request'),code:z.string().trim().toUpperCase().regex(/^[A-F0-9]{12}$/)}),
 z.object({action:z.enum(['accept','remove']),friendId:z.string().min(1).max(200)})]);
export async function POST(request:Request){
 const user=await getStudyUser();if(!user)return json({error:'Entre na sua conta.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
 try{
 const raw=await request.text();if(raw.length>2048)return json({error:'Dados muito grandes.'},413);const p=schema.parse(JSON.parse(raw));const db=database();
 const profile=await db.prepare('SELECT name FROM profiles WHERE user_id=?').bind(user.userId).first();if(!profile)return json({error:'Complete seu perfil de estudos primeiro.'},400);
 if(p.action==='heartbeat'){
 const now=Math.floor(Date.now()/1000),day=dayKey(new Date());
 // Batch is transactional: tabs share one clock; rapid duplicates add no time.
 await db.batch([
 db.prepare('INSERT INTO study_days(user_id,day,seconds) SELECT ?,?,MIN(30,?-last_ping) FROM study_presence WHERE user_id=? AND ?-last_ping BETWEEN 10 AND 45 ON CONFLICT(user_id,day) DO UPDATE SET seconds=seconds+excluded.seconds').bind(user.userId,day,now,user.userId,now),
 db.prepare('INSERT INTO study_presence(user_id,last_ping) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET last_ping=excluded.last_ping WHERE excluded.last_ping-last_ping>=10').bind(user.userId,now)]);
 return json({ok:true});
 }
 await ensureSocial(user.userId);
 if(p.action==='settings'){await db.prepare('UPDATE social_profiles SET share_activity=? WHERE user_id=?').bind(p.shareActivity?1:0,user.userId).run();return json({ok:true})}
 if(p.action==='request'){
 const other=await db.prepare('SELECT s.user_id FROM social_profiles s JOIN profiles p ON p.user_id=s.user_id WHERE s.friend_code=?').bind(p.code).first<{user_id:string}>();
 if(!other||other.user_id===user.userId)return json({error:'Confira o código de amizade.'},400);
 const [a,b]=[user.userId,other.user_id].sort();
 const inserted=await db.prepare("INSERT OR IGNORE INTO friendships(user_a,user_b,requester,status,created_at) SELECT ?,?,?,'pending',? WHERE (SELECT COUNT(*) FROM friendships WHERE user_a=? OR user_b=?)<50 AND (SELECT COUNT(*) FROM friendships WHERE user_a=? OR user_b=?)<50 RETURNING user_a").bind(a,b,user.userId,new Date().toISOString(),user.userId,user.userId,other.user_id,other.user_id).first();
 if(!inserted)return json({error:'Já existe um convite ou amizade, ou uma das contas chegou ao limite de 50 conexões.'},409);
 return json({ok:true});
 }
 const [a,b]=[user.userId,p.friendId].sort();
 if(p.action==='accept'){
 const changed=await db.prepare("UPDATE friendships SET status='accepted' WHERE user_a=? AND user_b=? AND requester<>? AND status='pending' RETURNING user_a").bind(a,b,user.userId).first();if(!changed)return json({error:'Convite não encontrado.'},404);
 }else await db.prepare('DELETE FROM friendships WHERE user_a=? AND user_b=?').bind(a,b).run();
 return json({ok:true});
 }catch(e){if(e instanceof z.ZodError||e instanceof SyntaxError)return json({error:'Confira os dados enviados.'},400);console.error('Community save failed',e);return json({error:'Não foi possível salvar. Tente novamente.'},503)}
}
