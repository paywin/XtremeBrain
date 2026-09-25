import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=mkdtempSync(join(tmpdir(),'xtremebrain-test-'));
try{
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','lib/grading.ts','lib/catalog.ts','lib/exams.ts','--outDir',folder,'--module','commonjs','--target','es2022','--esModuleInterop','--resolveJsonModule','--skipLibCheck'],{stdio:'inherit'});
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);const {grade}=require(join(folder,'grading.js'));const {officialExams}=require(join(folder,'exams.js'));const {diagnostic}=require(join(folder,'catalog.js'));
for(const e of officialExams){assert.equal(e.key.length,e.subjects.length,e.id);assert(e.key.every(k=>'ABCDE*'.includes(k)),e.id);const answers=Object.fromEntries(e.key.map((a,i)=>[`${e.id}-${i+e.start}`,a==='*'?'':a]));const result=grade(e.id,e.target,answers);assert.equal(result.score,100,e.id);assert.equal(result.total,e.key.filter(k=>k!=='*').length);assert.equal(grade(e.id,e.target,{}).score,0);}
assert.equal(grade('ita-2025','ITA',{}).annulled,2);assert.equal(grade('ita-2026','ITA',{}).annulled,1);assert.equal(grade('enem-2025','ENEM',{}).annulled,3);assert.equal(grade('practice','ENEM',{m1:'B',m2:'A'},['m1','m2']).score,50);assert.equal(grade('practice','ENEM',{},['m1']).items[0].selected,'');
for(const target of ['ITA','ENEM','Administrativo','SSA 1']){const q=diagnostic(target);assert(q.length>=8&&q.length<=12);const correct=Object.fromEntries(q.map(q=>[q.id,'ABCDE'[q.answer]]));assert.equal(grade('diagnostic',target,correct).score,100);}
assert.throws(()=>grade('missing','ENEM',{}));
console.log(`PASS: ${officialExams.length} official answer keys, annulments, blanks, partial grading, four diagnostic tracks.`);
}finally{rmSync(folder,{recursive:true,force:true})}
