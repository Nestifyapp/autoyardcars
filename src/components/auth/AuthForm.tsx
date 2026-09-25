'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const credentials = mode === 'signup' ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password);
      if (mode === 'signup' && name.trim()) await updateProfile(credentials.user, { displayName: name.trim() });
      const idToken = await credentials.user.getIdToken(true);
      const response = await fetch('/api/auth/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }) });
      if (!response.ok) throw new Error('Could not start your secure session.');
      router.push(mode === 'signup' ? '/yard/onboarding' : '/yard/listings'); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Authentication failed.'); setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-white p-6 shadow-sm">{mode === 'signup' && <label className="block text-sm font-semibold">Your name<input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label>}<label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label><label className="block text-sm font-semibold">Password<input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-yard-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Please wait...' : mode === 'signup' ? 'Create yard account' : 'Sign in'}</button></form>;
}