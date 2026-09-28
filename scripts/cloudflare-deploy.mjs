import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync('wrangler.json','utf8'));
const bootstrap=process.argv.includes('--bootstrap');
if(config.d1_databases[0].database_id==='00000000-0000-4000-8000-000000000000')throw new Error('Execute npm run cf:setup para criar o banco na sua conta.');
if(!bootstrap&&(!/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(config.vars.ACCESS_TEAM_DOMAIN||'')||!/^[a-f0-9]{64}$/.test(config.vars.ACCESS_AUD||'')))throw new Error('Configure Cloudflare Access antes do lançamento. Consulte docs/CLOUDFLARE.md.');
function run(file,args){const r=spawnSync(process.execPath,[file,...args],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1)}
run('node_modules/typescript/bin/tsc',['--noEmit']);
run('node_modules/vinext/dist/cli.js',['build']);
run('node_modules/wrangler/bin/wrangler.js',['d1','migrations','apply','DB','--remote','--config','wrangler.json']);
run('node_modules/wrangler/bin/wrangler.js',['deploy','--config','dist/server/wrangler.json']);
console.log(bootstrap?'Endereço criado; os estudos permanecem bloqueados até configurar o Access. Consulte docs/CLOUDFLARE.md.':'Publicação concluída. Teste uma conta permitida e uma não permitida antes de compartilhar.');
