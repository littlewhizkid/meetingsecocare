/*
  Interval booking model migration.

  1. Adds startAt/endAt/allDay to Booking.
  2. Backfills startAt/endAt from the legacy `date` + `startTime`/`endTime`
     columns, interpreted as wall-clock times in Asia/Jakarta (WIB, UTC+7,
     no DST) and stored as UTC.
  3. Drops the legacy columns.
  4. Adds an exclusion constraint making overlapping bookings for the same
     room impossible at the database level (half-open intervals).
  5. Adds indexes for range/room/user/notification queries.

  Prerequisite: baseline migration 20260914000000_postgres_baseline.
  Run inside a maintenance window against production (see runbook).
*/

-- Step 1: new columns (nullable during backfill)
ALTER TABLE "Booking" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "endAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: backfill.
-- Legacy values are `YYYY-MM-DD` / `HH:MM` wall-clock strings in Asia/Jakarta
-- (UTC+7, no DST). Convert to UTC by subtracting the fixed +7 offset.
UPDATE "Booking" SET
  "startAt" = (CAST("date" || ' ' || "startTime" || ':00' AS timestamp) - INTERVAL '7 hours'),
  "endAt"   = (CAST("date" || ' ' || "endTime"   || ':00' AS timestamp) - INTERVAL '7 hours');

-- Step 3: make required, then drop legacy columns
ALTER TABLE "Booking" ALTER COLUMN "startAt" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "endAt" SET NOT NULL;
ALTER TABLE "Booking" DROP COLUMN "date";
ALTER TABLE "Booking" DROP COLUMN "startTime";
ALTER TABLE "Booking" DROP COLUMN "endTime";

-- Step 4: database-level overlap prevention.
-- Requires btree_gist: enable it (present in standard Postgres distributions).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- All rows are half-open intervals [startAt, endAt); enforce end > start too.
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_interval_check" CHECK ("endAt" > "startAt");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap" EXCLUDE USING gist (
  "roomId" WITH =,
  tstzrange("startAt" AT TIME ZONE 'UTC', "endAt" AT TIME ZONE 'UTC', '[)')
  WITH &&
);

-- Step 5: indexes
CREATE INDEX "Booking_roomId_startAt_idx" ON "Booking"("roomId", "startAt");
CREATE INDEX "Booking_roomId_endAt_idx" ON "Booking"("roomId", "endAt");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");