import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  const { name, description, capacity, icon, order } = body;
  if (name !== undefined && !name.trim()) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });

  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(capacity !== undefined && { capacity: capacity.trim() }),
      ...(icon !== undefined && { icon: icon.trim() }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });
  return NextResponse.json(room);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  if (!force) {
    const today = new Date().toISOString().split('T')[0];
    const futureBooking = await prisma.booking.findFirst({
      where: { roomId: params.id, date: { gte: today } },
    });
    if (futureBooking) {
      const count = await prisma.booking.count({ where: { roomId: params.id, date: { gte: today } } });
      return NextResponse.json({ error: 'Room has future bookings', count }, { status: 409 });
    }
  }

  await prisma.room.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
