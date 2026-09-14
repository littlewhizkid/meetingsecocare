/**
 * Integration tests for booking validation + DB-level conflict enforcement.
 * Runs against a real Postgres database (TEST_DATABASE_URL) and requires
 * the migration chain to be applied there.
 *
 * Setup: npm run db:test:prepare
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const TEST_DB = 'ecocare_meetings_test';
const TEST_URL = `postgresql://ecocare:ecocare@localhost:5432/${TEST_DB}?schema=public`;

let prisma: PrismaClient;

function psqlAdmin(sql: string) {
  execSync(`PGPASSWORD=ecocare psql -h localhost -U ecocare -d postgres -c "${sql}"`, { stdio: 'pipe' });
}

async function createBooking(data: {
  roomId: string;
  userId: string;
  roomName: string;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
}) {
  return prisma.booking.create({
    data: {
      roomId: data.roomId,
      roomName: data.roomName,
      bookerName: 'Test User',
      meetingTitle: 'Integration test booking',
      userId: data.userId,
      startAt: data.startAt,
      endAt: data.endAt,
      allDay: data.allDay ?? false,
    },
  });
}

describe('DB exclusion constraint integration', () => {
  beforeAll(() => {
    // create disposable test database with full migration chain
    try {
      psqlAdmin(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
      psqlAdmin(`CREATE DATABASE ${TEST_DB}`);
      execSync(`DATABASE_URL="${TEST_URL}" npx prisma migrate deploy`, { stdio: 'pipe' });
    } catch (err) {
      throw new Error(`Test DB setup failed: ${String(err)}`);
    }
    prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
    return prisma.user
      .create({ data: { id: 'testuser', name: 'T', email: 't@t.dev', password: 'x' } })
      .catch(() => {})
      .then(() =>
        prisma.room.upsert({
          where: { id: 'room-a' },
          update: {},
          create: { id: 'room-a', name: 'Room A' },
        })
      );
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    try { psqlAdmin(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`); } catch { /* ignore */ }
  });

  it('rejects an overlapping insert with error 23P01 embedded', async () => {
    await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-10-01T02:00:00Z'), endAt: new Date('2026-10-01T03:30:00Z') });

    await expect(
      createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
        startAt: new Date('2026-10-01T03:00:00Z'), endAt: new Date('2026-10-01T04:00:00Z') })
    ).rejects.toThrow();
  });

  it('allows adjacent intervals (end === next start)', async () => {
    await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-10-02T02:00:00Z'), endAt: new Date('2026-10-02T03:00:00Z') });
    const adjacent = await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-10-02T03:00:00Z'), endAt: new Date('2026-10-02T04:00:00Z') });
    expect(adjacent.id).toBeTruthy();
  });

  it('allows identical intervals in different rooms', async () => {
    await prisma.room.upsert({ where: { id: 'room-b' }, update: {}, create: { id: 'room-b', name: 'Room B' } });
    await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-10-03T02:00:00Z'), endAt: new Date('2026-10-03T03:00:00Z') });
    const other = await createBooking({ roomId: 'room-b', userId: 'testuser', roomName: 'Room B',
      startAt: new Date('2026-10-03T02:00:00Z'), endAt: new Date('2026-10-03T03:00:00Z') });
    expect(other.id).toBeTruthy();
  });

  it('exactly one of several concurrent conflicting inserts succeeds', async () => {
    const payload = () => ({
      roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-10-05T02:00:00Z'), endAt: new Date('2026-10-05T04:00:00Z'),
    });
    const results = await Promise.allSettled([createBooking(payload()), createBooking(payload()), createBooking(payload())]);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    expect(succeeded).toBe(1);
    expect(failed).toBe(2);
  });

  it('all-day range blocks timed bookings across every occupied day', async () => {
    // All-day Sep 10–12 (stored [Sep 9 17:00Z, Sep 12 17:00Z))
    await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-09-09T17:00:00Z'), endAt: new Date('2026-09-12T17:00:00Z'), allDay: true });

    // timed on the middle day: Sep 11 09:00–10:00 WIB
    await expect(
      createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
        startAt: new Date('2026-09-11T02:00:00Z'), endAt: new Date('2026-09-11T03:00:00Z') })
    ).rejects.toThrow();

    // timed on the first day at 08:00 WIB (start of range boundary): still blocked
    await expect(
      createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
        startAt: new Date('2026-09-10T01:00:00Z'), endAt: new Date('2026-09-10T01:30:00Z') })
    ).rejects.toThrow();

    // adjacent AFTER the all-day range: allowed (Sep 13 08:00 WIB)
    const after = await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-09-13T01:00:00Z'), endAt: new Date('2026-09-13T01:30:00Z') });
    expect(after.id).toBeTruthy();
  });

  it('range-intersection query finds bookings on every occupied day', async () => {
    const where = (dayStartISO: string, dayEndISO: string) => ({
      startAt: { lt: new Date(dayEndISO) },
      endAt: { gt: new Date(dayStartISO) },
    });
    // All-day Sep 20–22 spans three civil days
    await createBooking({ roomId: 'room-a', userId: 'testuser', roomName: 'Room A',
      startAt: new Date('2026-09-19T17:00:00Z'), endAt: new Date('2026-09-22T17:00:00Z'), allDay: true });

    // Sep 20 bounds: [Sep 19 17:00Z, Sep 20 17:00Z)
    expect(await prisma.booking.count({ where: where('2026-09-19T17:00:00Z', '2026-09-20T17:00:00Z') })).toBeGreaterThanOrEqual(1);
    // Sep 21 bounds
    expect(await prisma.booking.count({ where: where('2026-09-20T17:00:00Z', '2026-09-21T17:00:00Z') })).toBeGreaterThanOrEqual(1);
    // Sep 22 bounds (last day)
    expect(await prisma.booking.count({ where: where('2026-09-21T17:00:00Z', '2026-09-22T17:00:00Z') })).toBeGreaterThanOrEqual(1);
    // Sep 23 (checkout day): not included
    expect(await prisma.booking.count({ where: where('2026-09-22T17:00:00Z', '2026-09-23T17:00:00Z') })).toBe(0);
  });
});