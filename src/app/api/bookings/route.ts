import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timeToMinutes } from '@/utils/dateUtils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const date = searchParams.get('date');
  const mine = searchParams.get('mine');
  const createdAfter = searchParams.get('createdAfter');

  const session = await getServerSession(authOptions);

  const where: Record<string, unknown> = {};
  if (roomId) where.roomId = roomId;
  if (date) where.date = date;
  if (mine === 'true') {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    where.userId = session.user.id;
  }
  if (createdAfter) {
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    where.createdAt = { gt: new Date(createdAfter) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: createdAfter
      ? [{ createdAt: 'desc' }]
      : [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { roomId, roomName, date, startTime, endTime, bookerName, meetingTitle } = body;

  // Validate required fields
  if (!roomId || !roomName || !date || !startTime || !endTime || !bookerName || !meetingTitle) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate time range
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (endMins <= startMins) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
  }
  if (startMins < timeToMinutes('08:00') || endMins > timeToMinutes('17:00')) {
    return NextResponse.json({ error: 'Bookings must be within 8:00 AM – 5:00 PM' }, { status: 400 });
  }

  // Check for overlaps
  const overlapping = await prisma.booking.findFirst({
    where: {
      roomId,
      date,
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (overlapping) {
    return NextResponse.json(
      { error: `This time slot overlaps with an existing booking: "${overlapping.meetingTitle}"` },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      roomId,
      roomName,
      date,
      startTime,
      endTime,
      bookerName,
      meetingTitle,
      userId: session.user.id,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
