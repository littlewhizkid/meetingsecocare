/**
 * One-time migration: SQLite prod.db -> PostgreSQL (baseline schema).
 *
 * Run AFTER `prisma migrate deploy` has applied ONLY the baseline migration
 * (20260914000000_postgres_baseline). The interval migration
 * (20260914120000_interval_booking_model) must run AFTER this import so it can
 * backfill startAt/endAt from the legacy columns.
 *
 * Uses raw SQL for the Booking rows because the current generated Prisma
 * client targets the post-interval schema (no legacy date/startTime/endTime
 * fields).
 *
 * Safe to re-run: rows are upserted by id.
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';

const prisma = new PrismaClient();

interface SqliteRow { [col: string]: string | number | null }

function sqlite(dbPath: string, sql: string): SqliteRow[] {
  const out = execSync(`sqlite3 -json "${dbPath}" "${sql.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
  return out ? (JSON.parse(out) as SqliteRow[]) : [];
}

/** SQLite Prisma stores DateTime as epoch-milliseconds integers */
function epochMsToDate(v: string | number | null): Date {
  if (v === null) return new Date();
  return new Date(Number(v));
}

const ISO = (d: Date) => d.toISOString();

function esc(v: string | number | null): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const dbPath = process.env.SQLITE_DB ?? 'prisma/prod.db';
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found: ${dbPath}`);
  }

  const users = sqlite(dbPath, 'SELECT * FROM "User"');
  const rooms = sqlite(dbPath, 'SELECT * FROM "Room"');
  const bookings = sqlite(dbPath, 'SELECT * FROM "Booking"');
  console.log(`SQLite: ${users.length} users, ${rooms.length} rooms, ${bookings.length} bookings`);

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        name: String(r.name),
        description: String(r.description ?? ''),
        capacity: String(r.capacity ?? ''),
        icon: String(r.icon ?? '🏢'),
        order: Number(r.order ?? 0),
        createdAt: epochMsToDate(r.createdAt),
      },
    });
  }
  console.log(`Imported ${rooms.length} rooms`);

  let userCount = 0;
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: String(u.id) },
      update: {},
      create: {
        id: String(u.id),
        name: String(u.name),
        email: String(u.email).toLowerCase(),
        password: String(u.password),
        role: String(u.role ?? 'USER'),
        mustChangePassword: Boolean(u.mustChangePassword),
        createdAt: epochMsToDate(u.createdAt),
      },
    });
    userCount++;
  }
  console.log(`Imported ${userCount} users`);

  let bookingCount = 0;
  for (const b of bookings) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Booking" (id, "roomId", "roomName", "date", "startTime", "endTime",
        "bookerName", "meetingTitle", "userId", "createdAt")
       VALUES (${esc(String(b.id))}, ${esc(String(b.roomId))}, ${esc(String(b.roomName))},
        ${esc(String(b.date))}, ${esc(String(b.startTime))}, ${esc(String(b.endTime))},
        ${esc(String(b.bookerName))}, ${esc(String(b.meetingTitle))}, ${esc(String(b.userId))},
        ${esc(ISO(epochMsToDate(b.createdAt)))})
       ON CONFLICT (id) DO NOTHING`
    );
    bookingCount++;
  }
  console.log(`Imported ${bookingCount} bookings (legacy date/startTime/endTime format)`);

  const [u, r] = await Promise.all([
    prisma.user.count(),
    prisma.room.count(),
  ]);
  const b = Number(
    (await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Booking"`))[0].n
  );
  console.log(`Postgres now: ${u} users, ${r} rooms, ${b} bookings`);
  if (u !== users.length || r !== rooms.length || b !== bookingCount) {
    throw new Error('COUNT MISMATCH — do not proceed!');
  }
  console.log('OK: counts match SQLite source.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());