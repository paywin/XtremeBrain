import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT,createLocalJWKSet,exportJWK} from 'jose';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
const path=new URL('../lib/.access-token-test.mjs',import.meta.url);
try{
 writeFileSync(path,ts.transpileModule(readFileSync(new URL('../lib/access-token.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {verifyAccessToken,accessConfig}=await import(path.href);
 const pair=await generateKeyPair('RS256');const publicKey=await exportJWK(pair.publicKey);publicKey.kid='key-1';
 const keys=createLocalJWKSet({keys:[publicKey]});
 const config={ACCESS_TEAM_DOMAIN:'xb-test.cloudflareaccess.com',ACCESS_AUD:'a'.repeat(64)};
 const sign=(claims={},key=pair.privateKey)=>new SignJWT({type:'app',email:'a@example.test',...claims}).setProtectedHeader({alg:'RS256',kid:'key-1'}).setIssuer('https://xb-test.cloudflareaccess.com').setAudience(config.ACCESS_AUD).setSubject('user-a').setIssuedAt().setExpirationTime('1h').sign(key);
 const valid=await sign();assert.equal((await verifyAccessToken(valid,config,keys)).userId,'user-a');
 assert.equal(await verifyAccessToken(null,config,keys),null);
 assert.equal(await verifyAccessToken(valid,{},keys),null);
 assert.equal(await verifyAccessToken(valid,{...config,ACCESS_AUD:'b'.repeat(64)},keys),null);
 assert.equal(await verifyAccessToken(valid,{...config,ACCESS_TEAM_DOMAIN:'other.cloudflareaccess.com'},keys),null);
 assert.equal(await verifyAccessToken(await sign({type:'org'}),config,keys),null);
 assert.equal(await verifyAccessToken(await sign({email:null}),config,keys),null);
 const forged=await sign({},(await generateKeyPair('RS256')).privateKey);assert.equal(await verifyAccessToken(forged,config,keys),null);
 const expired=await new SignJWT({type:'app',email:'a@example.test'}).setProtectedHeader({alg:'RS256',kid:'key-1'}).setIssuer('https://xb-test.cloudflareaccess.com').setAudience(config.ACCESS_AUD).setSubject('user-a').setIssuedAt(1).setExpirationTime(2).sign(pair.privateKey);assert.equal(await verifyAccessToken(expired,config,keys),null);
 assert.equal(accessConfig({...config,ACCESS_TEAM_DOMAIN:'evil.test/cloudflareaccess.com'}),null);
 console.log('PASS: signed identity, expiration, audience, issuer, signature, token type and fail-closed configuration.');
}finally{try{unlinkSync(path)}catch{}}
