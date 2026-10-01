import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import Module,{createRequire} from 'node:module';
const root=process.cwd(),dir=mkdtempSync(join(tmpdir(),'xb-api-')),require=createRequire(import.meta.url);
const db=new DatabaseSync(':memory:');
db.exec(readFileSync('drizzle/0000_tranquil_kat_farrell.sql','utf8'));
db.exec(readFileSync('drizzle/0002_community.sql','utf8'));
const binding={
 prepare(sql){
  return {bind(...args){
   const stmt=db.prepare(sql);
   return {async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){return stmt.run(...args)}};
  }};
 },
 async batch(statements){db.exec('BEGIN');try{const r=await Promise.all(statements.map(x=>x.run()));db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
};
let user=null;const originalLoad=Module._load;const zod=require('zod');
try{
writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({extends:join(root,'tsconfig.json'),compilerOptions:{types:[join(root,'node_modules/@types/node'),join(root,'node_modules/@cloudflare/workers-types')],baseUrl:root,noEmit:false,module:'commonjs',moduleResolution:'node',jsx:'react-jsx',rootDir:root,outDir:join(dir,'compiled'),incremental:false,isolatedModules:false},include:[join(root,'app/api/study/route.ts'),join(root,'app/api/community/route.ts'),join(root,'cloudflare-env.d.ts')],exclude:[join(root,'node_modules')]}));
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p',join(dir,'tsconfig.json')],{stdio:'inherit'});
Module._load=function(name,parent,...rest){if(name==='cloudflare:workers')return {env:{DB:binding}};if(name==='../../auth')return {getStudyUser:async()=>user};if(name==='@/lib/database')return {database:()=>binding};if(name.startsWith('@/lib/'))return originalLoad.call(this,join(dir,'compiled/lib',name.slice(6)+'.js'),parent,...rest);if(name==='zod')return zod;return originalLoad.call(this,name,parent,...rest)};
// Resolve zod before the interception path to avoid recursive loading.
const api=require(join(dir,'compiled/app/api/study/route.js'));
const post=body=>api.POST(new Request('https://test.local/api/study',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://test.local'},body:JSON.stringify(body)}));
assert.equal((await api.GET()).status,401);assert.equal((await post({action:'profile'})).status,401);
user={userId:'test-a',email:'a@example.test'};
assert.equal((await post({action:'profile',name:'A',target:'ENEM',minutes:60})).status,400);
assert.equal((await post({action:'profile',name:'Teste',target:'ENEM',minutes:60})).status,200);
let body=await (await api.GET()).json();assert.equal(body.profile.name,'Teste');assert.equal(body.history.length,0);
const draft={id:'attempt-test-123',examId:'practice',ids:['m1','m2'],answers:{m1:'B'},started:Date.now(),index:1};
assert.equal((await post({action:'draft',draft})).status,200);body=await (await api.GET()).json();assert.equal(body.draft.answers.m1,'B');
assert.equal((await post({action:'profile',name:'Teste',target:'ITA',minutes:60})).status,409);
const attempt={action:'submit',id:draft.id,examId:'practice',ids:draft.ids,answers:{m1:'B',m2:'A'},seconds:45};
let response=await post(attempt);assert.equal(response.status,200);assert.equal((await response.json()).result.score,50);
assert.equal((await post(attempt)).status,200);body=await (await api.GET()).json();assert.equal(body.history.length,1);assert.equal(body.draft,null);
user={userId:'test-b',email:'b@example.test'};body=await (await api.GET()).json();assert.equal(body.profile,null);assert.equal(body.history.length,0);assert.equal(body.draft,null);
const community=require(join(dir,'compiled/app/api/community/route.js'));
const {summarize,dayKey}=require(join(dir,'compiled/lib/achievements.js'));
const cp=(body,origin='https://test.local')=>community.POST(new Request('https://test.local/api/community',{method:'POST',headers:{origin},body:JSON.stringify(body)}));
user=null;assert.equal((await community.GET()).status,401);assert.equal((await cp({action:'heartbeat'})).status,401);
user={userId:'test-a'};assert.equal((await cp({action:'heartbeat'},'https://evil.test')).status,403);
let a=await (await community.GET()).json();assert.equal(a.summary.badges.find(b=>b.id==='first').unlocked,true);const aCode=a.code;
assert.equal((await cp({action:'request',code:aCode})).status,400);
user={userId:'test-b'};await post({action:'profile',name:'Beta',target:'ENEM',minutes:60});let b=await (await community.GET()).json();assert.equal(b.summary.metrics.attempts,0);const bCode=b.code;
user={userId:'test-a'};assert.equal((await cp({action:'request',code:bCode})).status,200);assert.equal((await cp({action:'request',code:bCode})).status,409);assert.equal((await cp({action:'accept',friendId:'test-b'})).status,404);
a=await (await community.GET()).json();assert.equal(a.friends[0].summary,null);
user={userId:'intruder'};await post({action:'profile',name:'Other',target:'ENEM',minutes:60});await community.GET();assert.equal((await cp({action:'accept',friendId:'test-a'})).status,404);await cp({action:'remove',friendId:'test-a'});assert.equal((await (await community.GET()).json()).friends.length,0);
user={userId:'test-b'};assert.equal((await cp({action:'accept',friendId:'test-a'})).status,200);b=await (await community.GET()).json();assert.equal(b.friends[0].summary.badges.some(b=>b.id==='first'),true);assert.equal(b.friends[0].recent.length,0);
user={userId:'test-a'};await cp({action:'settings',shareActivity:true});
user={userId:'test-b'};b=await (await community.GET()).json();assert.equal(b.friends[0].recent.length,1);assert.ok(!JSON.stringify(b.friends).includes('selected'));assert.ok(!JSON.stringify(b.friends).includes('test-a@example'));
user={userId:'test-a'};await cp({action:'settings',shareActivity:false});
user={userId:'test-b'};assert.equal((await (await community.GET()).json()).friends[0].recent.length,0);
await cp({action:'remove',friendId:'test-a'});assert.equal((await (await community.GET()).json()).friends.length,0);
// Heartbeats use server time: duplicate tabs and idle gaps cannot inflate hours.
user={userId:'test-a'};await cp({action:'heartbeat'});await cp({action:'heartbeat'});let t=db.prepare('SELECT SUM(seconds) n FROM study_days WHERE user_id=?').get('test-a').n||0;assert.equal(t,0);
db.prepare('UPDATE study_presence SET last_ping=? WHERE user_id=?').run(Math.floor(Date.now()/1000)-30,'test-a');await cp({action:'heartbeat'});t=db.prepare('SELECT SUM(seconds) n FROM study_days WHERE user_id=?').get('test-a').n;assert.equal(t,30);
await cp({action:'heartbeat'});assert.equal(db.prepare('SELECT SUM(seconds) n FROM study_days WHERE user_id=?').get('test-a').n,30);
db.prepare('UPDATE study_presence SET last_ping=? WHERE user_id=?').run(Math.floor(Date.now()/1000)-300,'test-a');await cp({action:'heartbeat'});assert.equal(db.prepare('SELECT SUM(seconds) n FROM study_days WHERE user_id=?').get('test-a').n,30);
const now=new Date('2026-10-01T02:30:00Z');assert.equal(dayKey(now),'2026-09-30');
const days=['2026-09-27','2026-09-28','2026-09-29'].map(day=>({day,seconds:3600}));let summary=summarize([],days,now);assert.equal(summary.currentStreak,3);assert.equal(summary.badges.find(b=>b.id==='wizard').unlocked,true);summary=summarize([],days,new Date('2026-10-02T12:00:00Z'));assert.equal(summary.currentStreak,0);assert.equal(summary.bestStreak,3);
const {officialExams}=require(join(dir,'compiled/lib/exams.js'));const {grade}=require(join(dir,'compiled/lib/grading.js'));const enem=officialExams.find(e=>e.target==='ENEM');const answers=Object.fromEntries(enem.key.map((v,i)=>[enem.id+'-'+(enem.start+i),v==='*'?'A':v]));const result=grade(enem.id,'ENEM',answers);summary=summarize([{exam_id:enem.id,created_at:now.toISOString(),result}],[],now);assert.equal(summary.badges.find(b=>b.id==='officialPerfect').unlocked,true);assert.equal(summary.badges.find(b=>b.id==='enemPerfect').unlocked,false);
const dayOne={...enem,id:'test-enem-day-one',start:1};officialExams.push(dayOne);
const dayOneAnswers=Object.fromEntries(dayOne.key.map((v,i)=>[dayOne.id+'-'+(i+1),v==='*'?'A':v]));
const completed=[{exam_id:enem.id,created_at:now.toISOString(),result},{exam_id:dayOne.id,created_at:now.toISOString(),result:grade(dayOne.id,'ENEM',dayOneAnswers)}];
assert.equal(summarize(completed,[],now).badges.find(b=>b.id==='enemPerfect').unlocked,true);
dayOne.appliedYear--;assert.equal(summarize(completed,[],now).badges.find(b=>b.id==='enemPerfect').unlocked,false);officialExams.pop();
console.log('PASS: community auth, origin, private defaults, bilateral consent, third-party access denial, unfriend revocation, server-time tracking, duplicate tabs, midnight streaks and ENEM coverage.');

}finally{Module._load=originalLoad;db.close();rmSync(dir,{recursive:true,force:true})}
