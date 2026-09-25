import { NextResponse } from 'next/server';
import { requireActor } from '@/lib/firebase/admin';
import { deleteDealerVehicle, getDealerVehicle, updateDealerVehicle } from '@/lib/repositories/vehicles';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try { return NextResponse.json(await getDealerVehicle(await requireActor(), params.id)); }
  catch (error) { const e = error as Error & { status?: number }; return NextResponse.json({ error: e.message }, { status: e.status ?? 500 }); }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try { return NextResponse.json(await updateDealerVehicle(await requireActor(), params.id, await request.json())); }
  catch (error) { const e = error as Error & { status?: number }; return NextResponse.json({ error: e.message }, { status: e.status ?? 500 }); }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try { await deleteDealerVehicle(await requireActor(), params.id); return new NextResponse(null, { status: 204 }); }
  catch (error) { const e = error as Error & { status?: number }; return NextResponse.json({ error: e.message }, { status: e.status ?? 500 }); }
}