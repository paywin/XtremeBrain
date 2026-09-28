import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync('wrangler.json','utf8'));
const placeholder='00000000-0000-4000-8000-000000000000';
function run(args,capture=false){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{stdio:capture?['inherit','pipe','inherit']:'inherit',encoding:'utf8'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);return r.stdout||''}
// Explicit login is handled by `npm run cf:login`; credentials stay in Wrangler.
if(config.d1_databases[0].database_id===placeholder){
 const raw=run(['d1','create','xtremebrain','--update-config=false'],true);
 const id=raw.match(/database_id["']?\s*[:=]\s*["']([a-f0-9-]{36})["']/)?.[1];
 if(!/^[a-f0-9-]{36}$/.test(id||''))throw new Error('A Cloudflare não retornou o identificador esperado do banco.');
 config.d1_databases[0].database_id=id;writeFileSync('wrangler.json',JSON.stringify(config,null,2)+'\n');
 console.log('Banco novo configurado. Nenhum dado de teste foi importado.');
}else console.log('Usando o banco já configurado; nenhum dado será apagado.');
console.log('Próximo passo: npm run cf:deploy -- --bootstrap');
