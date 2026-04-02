import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rooms = await prisma.room.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  const { name, description, capacity, icon } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const maxOrder = await prisma.room.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;

  const room = await prisma.room.create({
    data: { name: name.trim(), description: description?.trim() ?? '', capacity: capacity?.trim() ?? '', icon: icon?.trim() ?? '🏢', order },
  });
  return NextResponse.json(room, { status: 201 });
}
