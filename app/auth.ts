import {headers} from 'next/headers';
import {env} from 'cloudflare:workers';
import {verifyAccessToken,accessConfig} from '@/lib/access-token';
export async function getStudyUser(){
  const h=await headers();
  return verifyAccessToken(h.get('cf-access-jwt-assertion'), env);
}
export function authenticationConfigured(){return !!accessConfig(env)}
export const signInPath='/';
export const signOutPath='/cdn-cgi/access/logout';
