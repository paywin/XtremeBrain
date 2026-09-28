import {NextResponse} from 'next/server';
export function middleware(){
 const response=NextResponse.next();
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('X-Frame-Options','SAMEORIGIN');
 return response;
}
export const config={matcher:['/','/api/:path*']};
