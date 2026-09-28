import {readFileSync,writeFileSync} from 'node:fs';
const [team,aud]=process.argv.slice(2);
if(!/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(team||'')||!/^[a-f0-9]{64}$/.test(aud||''))throw new Error('Uso: npm run cf:configure -- equipe.cloudflareaccess.com AUD_DA_APLICACAO (64 caracteres hexadecimais). Esses identificadores não são senhas.');
const config=JSON.parse(readFileSync('wrangler.json','utf8'));
config.vars={...config.vars,ACCESS_TEAM_DOMAIN:team,ACCESS_AUD:aud};
writeFileSync('wrangler.json',JSON.stringify(config,null,2)+'\n');
console.log('Identificadores do Access configurados. Execute npm run cf:deploy.');
