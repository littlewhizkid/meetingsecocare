import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dayRangeUTC } from '@/utils/dateUtils';
import { validateBookingInput, isOverlapViolation, BookingIntervalInput } from '@/lib/bookingValidation';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const date = searchParams.get('date');   // display day (office tz civil date)
  const mine = searchParams.get('mine');
  const createdAfter = searchParams.get('createdAfter');

  const where: Record<string, unknown> = {};
  if (roomId) where.roomId = roomId;
  if (mine === 'true') where.userId = session.user.id;

  if (date) {
    // bookings intersecting the display day (office tz)
    const { start, end } = dayRangeUTC(date);
    where.startAt = { lt: end };
    where.endAt = { gt: start };
  }

  if (createdAfter) {
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    where.createdAt = { gt: new Date(createdAfter) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: createdAfter
      ? [{ createdAt: 'desc' }]
      : [{ startAt: 'asc' }, { endAt: 'asc' }],
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: BookingIntervalInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validated = await validateBookingInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const room = await prisma.room.findUniqueOrThrow({
    where: { id: body.roomId },
    select: { name: true },
  });

  try {
    const booking = await prisma.booking.create({
      data: {
        roomId: body.roomId,
        roomName: room.name,
        startAt: validated.startAt,
        endAt: validated.endAt,
        allDay: body.allDay,
        meetingTitle: validated.meetingTitle,
        bookerName: session.user.name ?? '',
        userId: session.user.id,
      },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (isOverlapViolation(error)) {
      return NextResponse.json(
        { error: 'This time conflicts with an existing booking for this room' },
        { status: 409 }
      );
    }
    throw error;
  }
}