'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/yard/login'); router.refresh(); };
  return <button onClick={logout} className="text-sm font-semibold text-ink-muted hover:text-yard-700">Sign out</button>;
}