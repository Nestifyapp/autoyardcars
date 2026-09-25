import { NextResponse } from 'next/server';
import { requireActor } from '@/lib/firebase/admin';
import { createDealerVehicle, listDealerVehicles } from '@/lib/repositories/vehicles';

export async function GET() {
  try { return NextResponse.json(await listDealerVehicles(await requireActor())); }
  catch (error) { const e = error as Error & { status?: number }; return NextResponse.json({ error: e.message }, { status: e.status ?? 500 }); }
}

export async function POST(request: Request) {
  try { return NextResponse.json(await createDealerVehicle(await requireActor(), await request.json()), { status: 201 }); }
  catch (error) { const e = error as Error & { status?: number }; return NextResponse.json({ error: e.message }, { status: e.status ?? 500 }); }
}