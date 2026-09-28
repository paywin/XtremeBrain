import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
export type StudyUser = { userId: string; email: string; fullName: string | null; displayName: string };
export type AccessConfig = { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string };
let keySource: {issuer: string; keys: JWTVerifyGetKey} | undefined;
export function accessConfig(config: AccessConfig) {
  const domain = config.ACCESS_TEAM_DOMAIN?.trim();
  const audience = config.ACCESS_AUD?.trim();
  if (!domain || !/^[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(domain) || !audience || !/^[a-f0-9]{64}$/.test(audience)) return null;
  return { issuer: `https://${domain}`, audience };
}
export async function verifyAccessToken(token: string | null, config: AccessConfig, testKeys?: JWTVerifyGetKey): Promise<StudyUser | null> {
  const settings = accessConfig(config);
  if (!settings || !token || token.length > 16384) return null;
  try {
    if (!testKeys && keySource?.issuer !== settings.issuer) keySource = {issuer: settings.issuer, keys: createRemoteJWKSet(new URL(`${settings.issuer}/cdn-cgi/access/certs`), {timeoutDuration: 5000, cooldownDuration: 30000})};
    const {payload} = await jwtVerify(token, testKeys || keySource!.keys, {
      issuer: settings.issuer, audience: settings.audience, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'], clockTolerance: 5,
    });
    if (payload.type !== 'app' || typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !payload.email.includes('@')) return null;
    return {userId: payload.sub, email: payload.email, fullName: null, displayName: payload.email};
  } catch { return null; }
}
