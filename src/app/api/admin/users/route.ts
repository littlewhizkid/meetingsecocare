import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

const USER_SELECT = { id: true, name: true, email: true, role: true, mustChangePassword: true, createdAt: true };

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }
  if (!['USER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Role must be USER or ADMIN' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword, role, mustChangePassword: true },
    select: USER_SELECT,
  });
  return NextResponse.json(user, { status: 201 });
}
