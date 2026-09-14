import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateBookingInput, isOverlapViolation, BookingIntervalInput } from '@/lib/bookingValidation';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        roomId: body.roomId,
        roomName: room.name,
        startAt: validated.startAt,
        endAt: validated.endAt,
        allDay: body.allDay,
        meetingTitle: validated.meetingTitle,
        bookerName: session.user.name ?? '',
      },
    });
    return NextResponse.json(updated);
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