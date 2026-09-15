/**
 * Import SQLite prod.db data into the POST-INTERVAL Postgres schema.
 * (Used when the interval migration has already been applied to an empty DB.)
 *
 * Converts legacy `date` + `startTime`/`endTime` (Asia/Jakarta wall clock)
 * directly to startAt/endAt UTC, and epoch-ms createdAt to timestamps.
 *
 * Run on the server:
 *   SQLITE_EXPORT_DIR=/tmp \
 *   DATABASE_URL="postgresql://..." \
 *   node scripts/import-sqlite-into-interval.mjs
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const dir = process.env.SQLITE_EXPORT_DIR ?? '/tmp';

const read = (name) => JSON.parse(fs.readFileSync(`${dir}/${name}.json`, 'utf8'));
const esc = (v) => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

/** WIB (UTC+7) civil datetime -> UTC ISO */
function wibToUtc(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h, min) - 7 * 3600 * 1000;
  return new Date(utcMs).toISOString();
}

const epochToDate = (v) => new Date(Number(v)).toISOString();

async function main() {
  const users = read('users');
  const rooms = read('rooms');
  const bookings = read('bookings');
  console.log(`SQLite exports: ${users.length} users, ${rooms.length} rooms, ${bookings.length} bookings`);

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id, name: r.name,
        description: r.description ?? '', capacity: r.capacity ?? '',
        icon: r.icon ?? '🏢', order: Number(r.order ?? 0),
        createdAt: epochToDate(r.createdAt),
      },
    });
  }
  console.log(`Imported ${rooms.length} rooms`);

  let u = 0;
  for (const x of users) {
    await prisma.user.upsert({
      where: { id: x.id },
      update: {},
      create: {
        id: x.id, name: x.name, email: String(x.email).toLowerCase(),
        password: x.password, role: x.role ?? 'USER',
        mustChangePassword: Boolean(x.mustChangePassword),
        createdAt: epochToDate(x.createdAt),
      },
    });
    u++;
  }
  console.log(`Imported ${u} users`);

  let b = 0;
  for (const x of bookings) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Booking" (id, "roomId", "roomName", "startAt", "endAt", "allDay",
        "bookerName", "meetingTitle", "userId", "createdAt")
       VALUES (${esc(x.id)}, ${esc(x.roomId)}, ${esc(x.roomName)},
        ${esc(wibToUtc(x.date, x.startTime))}, ${esc(wibToUtc(x.date, x.endTime))}, false,
        ${esc(x.bookerName)}, ${esc(x.meetingTitle)}, ${esc(x.userId)}, ${esc(epochToDate(x.createdAt))})
       ON CONFLICT (id) DO NOTHING`
    );
    b++;
  }
  console.log(`Imported ${b} bookings`);

  const [cu, cr, cb] = [
    await prisma.user.count(),
    await prisma.room.count(),
    Number((await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Booking"`))[0].n),
  ];
  console.log(`Postgres now: ${cu} users, ${cr} rooms, ${cb} bookings`);
  if (cu !== users.length || cr !== rooms.length || cb !== bookings.length) {
    throw new Error('COUNT MISMATCH — investigate before going live');
  }
  console.log('OK: counts match SQLite source.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());