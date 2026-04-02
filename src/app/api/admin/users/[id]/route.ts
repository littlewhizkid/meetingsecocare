import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

const USER_SELECT = { id: true, name: true, email: true, role: true, mustChangePassword: true, createdAt: true };

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  const { name, email, role, mustChangePassword, password } = body;

  if (email !== undefined) {
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim(), NOT: { id: params.id } } });
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.toLowerCase().trim();
  if (role !== undefined) updateData.role = role;
  if (mustChangePassword !== undefined) updateData.mustChangePassword = mustChangePassword;
  if (password) updateData.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({ where: { id: params.id }, data: updateData, select: USER_SELECT });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const session = (guard as { session: { user: { id: string } } }).session;
  if (session?.user?.id === params.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  if (!force) {
    const today = new Date().toISOString().split('T')[0];
    const futureBooking = await prisma.booking.findFirst({ where: { userId: params.id, date: { gte: today } } });
    if (futureBooking) {
      const count = await prisma.booking.count({ where: { userId: params.id, date: { gte: today } } });
      return NextResponse.json({ error: 'User has future bookings', count }, { status: 409 });
    }
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
