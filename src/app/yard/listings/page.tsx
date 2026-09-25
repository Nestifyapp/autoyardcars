import Link from 'next/link';
import { requireActor } from '@/lib/firebase/admin';
import { listDealerVehicles } from '@/lib/repositories/vehicles';
import { formatKes } from '@/lib/brand';
import type { Vehicle } from '@/lib/domain/types';
import { ListingActions } from '@/components/yard/ListingActions';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function YardListingsPage({ searchParams }: { searchParams: { status?: string } }) {
  try {
    const vehicles = await listDealerVehicles(await requireActor());
    const active = vehicles.filter(vehicle => vehicle.status === 'active');
    const leads = vehicles.reduce((sum, vehicle) => sum + (vehicle.metrics?.leads ?? 0), 0);
    const views = vehicles.reduce((sum, vehicle) => sum + (vehicle.metrics?.detailViews ?? 0), 0);
    const filter = searchParams.status;
    const filtered = filter ? vehicles.filter(vehicle => vehicle.status === filter) : vehicles;
    return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-yard-600">Dealer workspace</p><h1 className="font-display text-3xl font-bold">Your listings</h1></div><div className="flex items-center gap-4"><LogoutButton /><Link href="/yard/listings/create" className="rounded-lg bg-yard-500 px-4 py-2.5 text-sm font-semibold text-white">Add vehicle</Link></div></div><div className="grid gap-3 sm:grid-cols-3"><Stat label="Total active" value={active.length} /><Stat label="Leads received" value={leads} /><Stat label="Total views" value={views} /></div><nav className="flex flex-wrap gap-2 text-sm"><FilterLink label="All" /><FilterLink label="Active" value="active" /><FilterLink label="Drafts" value="draft" /><FilterLink label="Sold" value="sold" /></nav><div className="overflow-x-auto rounded-card border border-line bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-line bg-surface text-xs uppercase text-ink-muted"><tr><th className="p-3">Vehicle</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Actions</th></tr></thead><tbody>{filtered.map(vehicle => <ListingRow key={vehicle.id} vehicle={vehicle} />)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-ink-muted">No listings in this view.</p>}</div></main>;
  } catch (error) { const message = (error as Error).message; return <main className="mx-auto max-w-xl px-4 py-16"><h1 className="font-display text-2xl font-bold">Dealer sign-in required</h1><p className="mt-2 text-ink-muted">{message}</p><div className="mt-5 flex gap-4 text-sm font-semibold"><Link href="/yard/login" className="text-yard-600 hover:underline">Sign in</Link><Link href="/yard/onboarding" className="text-yard-600 hover:underline">Set up a yard</Link></div></main>; }
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-card border border-line bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p><p className="mt-1 font-display text-2xl font-bold text-yard-700">{value.toLocaleString()}</p></div>; }
function FilterLink({ label, value }: { label: string; value?: string }) { return <Link href={value ? `/yard/listings?status=${value}` : '/yard/listings'} className="rounded-full border border-line px-3 py-1.5 capitalize text-ink-muted hover:border-yard-500 hover:text-yard-700">{label}</Link>; }
function ListingRow({ vehicle }: { vehicle: Vehicle }) { return <tr className="border-b border-line last:border-0"><td className="p-3 font-semibold">{vehicle.title}<div className="mt-1 flex flex-wrap gap-1">{(vehicle.groupings ?? []).slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-yard-50 px-2 py-0.5 text-[11px] text-yard-700">{tag.replaceAll('_', ' ')}</span>)}</div></td><td className="p-3">{formatKes(vehicle.price)}</td><td className="p-3 capitalize">{vehicle.status.replace('_', ' ')}</td><td className="p-3">{(vehicle.metrics?.detailViews ?? 0).toLocaleString()}</td><td className="p-3"><ListingActions vehicle={vehicle} /></td></tr>; }