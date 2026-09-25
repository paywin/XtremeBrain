/** Offline, reviewed import. Never guesses answer keys or topic tags. */
import {readFileSync,writeFileSync} from 'node:fs';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/import-exam.mjs /absolute/path/exam.json');process.exit(1)}
const exam=JSON.parse(readFileSync(file,'utf8'));
for(const field of ['id','target','title','pdf','source','keyUrl'])if(typeof exam[field]!=='string'||!exam[field].trim())throw new Error(`Missing ${field}`);
if(!/^[a-z0-9-]+$/.test(exam.id))throw new Error('Invalid id');
for(const field of ['pdf','source','keyUrl'])if(new URL(exam[field]).protocol!=='https:')throw new Error(`Use HTTPS: ${field}`);
for(const field of ['year','appliedYear','start','minutes'])if(!Number.isInteger(exam[field])||exam[field]<1)throw new Error(`Invalid ${field}`);
if(!Array.isArray(exam.key)||!exam.key.length||exam.key.length>200||exam.key.some(x=>!['A','B','C','D','E','*'].includes(x)))throw new Error('Invalid answer key');
if(!Array.isArray(exam.subjects)||exam.subjects.length!==exam.key.length||exam.subjects.some(x=>typeof x!=='string'||!x))throw new Error('A subject is required per question');
if(exam.topics&&(!Array.isArray(exam.topics)||exam.topics.length!==exam.key.length))throw new Error('Topics must match answer-key length');
const path=new URL('../lib/additional-exams.json',import.meta.url),rows=JSON.parse(readFileSync(path,'utf8'));
if(rows.some(x=>x.id===exam.id))throw new Error('This id already exists in additional-exams.json');
rows.push(exam);writeFileSync(path,JSON.stringify(rows,null,2)+'\n');console.log(`Imported ${exam.id}. Review sources and run npm test before publishing.`);
