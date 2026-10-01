import { database } from './database';
import { summarize,type StudyAttempt,type StudyDay } from './achievements';
// IDs here are supplied only by the authenticated owner or accepted-friend query.
export async function readSummaries(userIds:string[]){
 const result=new Map<string,{summary:Omit<ReturnType<typeof summarize>,'badges'>&{badges:(ReturnType<typeof summarize>['badges'][number]&{earnedAt:string|null})[]};attempts:StudyAttempt[]}>();
 if(!userIds.length)return result;
 const db=database(),slots=userIds.map(()=>'?').join(',');
 const [attemptRows,days,earned]=await Promise.all([
 db.prepare(`SELECT user_id,exam_id,created_at,result FROM attempts WHERE user_id IN (${slots}) ORDER BY created_at ASC`).bind(...userIds).all<{user_id:string;exam_id:string;created_at:string;result:string}>(),
 db.prepare(`SELECT user_id,day,seconds FROM study_days WHERE user_id IN (${slots})`).bind(...userIds).all<StudyDay&{user_id:string}>(),
 db.prepare(`SELECT user_id,badge_id,earned_at FROM earned_badges WHERE user_id IN (${slots})`).bind(...userIds).all<{user_id:string;badge_id:string;earned_at:string}>()]);
 for(const id of userIds){
 const attempts:StudyAttempt[]=attemptRows.results.filter(a=>a.user_id===id).map(a=>({exam_id:a.exam_id,created_at:a.created_at,result:JSON.parse(a.result)}));
 const awards=earned.results.filter(e=>e.user_id===id),summary=summarize(attempts,days.results.filter(d=>d.user_id===id));
 result.set(id,{summary:{...summary,badges:summary.badges.map(b=>({...b,unlocked:b.unlocked||awards.some(e=>e.badge_id===b.id),earnedAt:awards.find(e=>e.badge_id===b.id)?.earned_at||null}))},attempts});
 }
 return result;
}
export async function readSummary(userId:string){return (await readSummaries([userId])).get(userId)!}
export async function syncOwnBadges(userId:string){const {summary}=await readSummary(userId);const fresh=summary.badges.filter(b=>b.unlocked&&!b.earnedAt);if(fresh.length)await database().batch(fresh.map(b=>database().prepare('INSERT OR IGNORE INTO earned_badges(user_id,badge_id,earned_at) VALUES(?,?,?)').bind(userId,b.id,new Date().toISOString())));return summary}
