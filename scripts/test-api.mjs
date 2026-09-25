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
writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({extends:join(root,'tsconfig.json'),compilerOptions:{types:[join(root,'node_modules/@types/node'),join(root,'node_modules/@cloudflare/workers-types')],baseUrl:root,noEmit:false,module:'commonjs',moduleResolution:'node',jsx:'react-jsx',rootDir:root,outDir:join(dir,'compiled'),incremental:false,isolatedModules:false},include:[join(root,'app/api/study/route.ts'),join(root,'cloudflare-env.d.ts')],exclude:[join(root,'node_modules')]}));
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p',join(dir,'tsconfig.json')],{stdio:'inherit'});
Module._load=function(name,parent,...rest){if(name.endsWith('chatgpt-auth'))return {getChatGPTUser:async()=>user};if(name==='@/lib/database')return {database:()=>binding};if(name.startsWith('@/lib/'))return originalLoad.call(this,join(dir,'compiled/lib',name.slice(6)+'.js'),parent,...rest);if(name==='zod')return zod;return originalLoad.call(this,name,parent,...rest)};
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
console.log('PASS: API authentication, profile validation, persistence, draft resume, target locking, grading, idempotency and user isolation.');
}finally{Module._load=originalLoad;db.close();rmSync(dir,{recursive:true,force:true})}
