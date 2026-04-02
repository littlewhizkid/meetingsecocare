import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { password, mustChangePassword } = await req.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: params.id },
    data: { password: hashed, mustChangePassword: mustChangePassword ?? true },
  });

  return NextResponse.json({ success: true });
}
