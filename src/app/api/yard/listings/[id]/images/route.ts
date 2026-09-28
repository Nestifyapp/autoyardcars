import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { FieldValue } from 'firebase-admin/firestore';
import { assertTenantPermission } from '@/lib/auth/permissions';
import { adminDb, adminStorage, col, requireActor } from '@/lib/firebase/admin';
import { getDealerVehicle } from '@/lib/repositories/vehicles';
import type { VehicleImage } from '@/lib/domain/types';

const MAX_IMAGES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function errorResponse(error: unknown) {
  const cause = error as Error & { status?: number };
  return NextResponse.json({ error: cause.message ?? 'Photo operation failed.' }, { status: cause.status ?? 500 });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const uploadedPaths: string[] = [];
  try {
    const actor = await requireActor();
    const vehicle = await getDealerVehicle(actor, params.id);
    assertTenantPermission(actor, vehicle.dealershipId, 'inventory:write');

    const formData = await request.formData();
    const files = formData.getAll('files').filter((file): file is File => file instanceof File && file.size > 0);
    if (!files.length) return NextResponse.json({ error: 'Choose at least one image.' }, { status: 400 });
    if (files.length > 8 || vehicle.images.length + files.length > MAX_IMAGES) {
      return NextResponse.json({ error: `A vehicle can have up to ${MAX_IMAGES} photos.` }, { status: 400 });
    }
    if (files.some(file => !ALLOWED_TYPES.has(file.type))) {
      return NextResponse.json({ error: 'Use a JPEG, PNG, WebP, or AVIF image.' }, { status: 400 });
    }
    if (files.some(file => file.size > MAX_FILE_BYTES)) {
      return NextResponse.json({ error: 'Each image must be 10 MB or smaller.' }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    if (!bucket.name) throw new Error('Firebase Storage is not configured for this project.');
    const optimizedFiles: { data: Buffer; width: number; height: number }[] = [];
    for (const file of files) {
      try {
        const result = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 }).rotate().webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
        optimizedFiles.push({ data: result.data, width: result.info.width, height: result.info.height });
      } catch {
        return NextResponse.json({ error: 'One of those files is not a readable image.' }, { status: 400 });
      }
    }

    const newImages: VehicleImage[] = [];

    for (const [index, optimized] of optimizedFiles.entries()) {
      const id = randomUUID();
      const path = `dealerships/${vehicle.dealershipId}/vehicles/${vehicle.id}/${id}.webp`;
      const token = randomUUID();
      await bucket.file(path).save(optimized.data, {
        metadata: {
          contentType: 'image/webp',
          cacheControl: 'public,max-age=31536000,immutable',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      uploadedPaths.push(path);
      newImages.push({
        id,
        path,
        url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
        width: optimized.width,
        height: optimized.height,
        order: vehicle.images.length + index,
        alt: `${vehicle.title} photo ${vehicle.images.length + index + 1}`,
      });
    }

    const images = [...vehicle.images, ...newImages];
    const coverImage = vehicle.coverImage ?? newImages[0];
    await adminDb.collection(col.vehicles).doc(vehicle.id).update({ images, coverImage, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ images, coverImage });
  } catch (error) {
    await Promise.all(uploadedPaths.map(path => adminStorage.bucket().file(path).delete({ ignoreNotFound: true }).catch(() => undefined)));
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor();
    const vehicle = await getDealerVehicle(actor, params.id);
    assertTenantPermission(actor, vehicle.dealershipId, 'inventory:write');
    const { imageId } = await request.json() as { imageId?: string };
    const coverImage = vehicle.images.find(image => image.id === imageId);
    if (!coverImage) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
    await adminDb.collection(col.vehicles).doc(vehicle.id).update({ coverImage, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ coverImage });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireActor();
    const vehicle = await getDealerVehicle(actor, params.id);
    assertTenantPermission(actor, vehicle.dealershipId, 'inventory:write');
    const { imageId } = await request.json() as { imageId?: string };
    const removed = vehicle.images.find(image => image.id === imageId);
    if (!removed) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
    const images = vehicle.images.filter(image => image.id !== removed.id).map((image, order) => ({ ...image, order }));
    const coverImage = vehicle.coverImage?.id === removed.id ? images[0] ?? FieldValue.delete() : vehicle.coverImage;
    await adminDb.collection(col.vehicles).doc(vehicle.id).update({ images, coverImage, updatedAt: FieldValue.serverTimestamp() });
    if (removed.path.startsWith(`dealerships/${vehicle.dealershipId}/vehicles/${vehicle.id}/`)) {
      await adminStorage.bucket().file(removed.path).delete({ ignoreNotFound: true });
    }
    return NextResponse.json({ images, coverImage: images.length ? (vehicle.coverImage?.id === removed.id ? images[0] : vehicle.coverImage) : null });
  } catch (error) {
    return errorResponse(error);
  }
}