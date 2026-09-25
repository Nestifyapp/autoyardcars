import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const SESSION_MAX_AGE = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json() as { idToken?: string };
    if (!idToken) return NextResponse.json({ error: 'Firebase ID token is required.' }, { status: 400 });
    await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE });
    const response = NextResponse.json({ ok: true });
    response.cookies.set('__session', sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: SESSION_MAX_AGE / 1000, path: '/' });
    return response;
  } catch (error) {
    const code = (error as { code?: string }).code;
    console.error('[auth/session] Firebase session exchange failed:', code ?? error);
    const message = code === 'auth/id-token-expired'
      ? 'Your sign-in expired. Please sign in again.'
      : code === 'auth/id-token-revoked'
        ? 'Your sign-in was revoked. Please sign in again.'
        : 'The server could not verify this Firebase project. Check App Hosting Firebase Admin credentials.';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}