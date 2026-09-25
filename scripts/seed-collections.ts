import { FieldValue } from 'firebase-admin/firestore';
import net from 'node:net';
import { adminDb, col } from '../src/lib/firebase/admin';
import { SEED_COLLECTIONS } from '../src/lib/domain/seed-collections';

async function assertFirestoreTarget() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    console.log(`Seeding ${SEED_COLLECTIONS.length} collections into Firebase project ${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'configured project'}...`);
    return;
  }

  const [host, portText] = emulatorHost.split(':');
  const port = Number(portText);
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const fail = () => { socket.destroy(); reject(new Error(`Firestore emulator is not running at ${emulatorHost}. Start it with "npm run emulators", then run "npm run seed:collections" again.`)); };
    socket.setTimeout(1500, fail);
    socket.once('connect', () => { socket.end(); resolve(); });
    socket.once('error', fail);
  });
  console.log(`Seeding ${SEED_COLLECTIONS.length} collections into Firestore emulator ${emulatorHost}...`);
}

async function run() {
  await assertFirestoreTarget();
  const now = FieldValue.serverTimestamp();
  const batch = adminDb.batch();
  for (const collection of SEED_COLLECTIONS) {
    batch.set(adminDb.collection(col.collections).doc(collection.slug), {
      id: collection.slug, ...collection, mode: 'rule', manualVehicleIds: [], active: true,
      seo: { title: `${collection.name} for sale in Kenya`, description: collection.description },
      createdAt: now, updatedAt: now,
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${SEED_COLLECTIONS.length} marketplace collections only.`);
}

run().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });