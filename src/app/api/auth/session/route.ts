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
  } catch {
    return NextResponse.json({ error: 'Could not create a secure session.' }, { status: 401 });
  }
}