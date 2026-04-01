import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function main() {
  const adminPass = await bcrypt.hash('admin1234', 12);
  const userPass = await bcrypt.hash('user1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecocare.id' },
    update: {},
    create: { email: 'admin@ecocare.id', name: 'Admin EcoCare', password: adminPass, role: 'ADMIN' },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'budi@ecocare.id' },
    update: {},
    create: { email: 'budi@ecocare.id', name: 'Budi Santoso', password: userPass, role: 'USER' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'sari@ecocare.id' },
    update: {},
    create: { email: 'sari@ecocare.id', name: 'Sari Dewi', password: userPass, role: 'USER' },
  });

  const today = getTodayStr();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  await prisma.booking.deleteMany({});

  await prisma.booking.createMany({
    data: [
      { roomId: 'board-room', roomName: 'Board Room', date: today, startTime: '09:00', endTime: '11:00', bookerName: 'Budi Santoso', meetingTitle: 'Weekly Leadership Sync', userId: admin.id },
      { roomId: 'small-meeting-room', roomName: 'Small Meeting Room', date: today, startTime: '10:00', endTime: '11:00', bookerName: 'Sari Dewi', meetingTitle: 'Product Review Q4', userId: user2.id },
      { roomId: 'podcast-room', roomName: 'Podcast Room', date: today, startTime: '14:00', endTime: '16:00', bookerName: 'Budi Santoso', meetingTitle: 'EcoCare Podcast Episode 12', userId: user1.id },
      { roomId: 'board-room', roomName: 'Board Room', date: tomorrow, startTime: '09:00', endTime: '12:00', bookerName: 'Admin EcoCare', meetingTitle: 'Budget Planning Half Day', userId: admin.id },
      { roomId: 'small-meeting-room', roomName: 'Small Meeting Room', date: tomorrow, startTime: '13:00', endTime: '14:30', bookerName: 'Sari Dewi', meetingTitle: 'Design Sprint Kickoff', userId: user2.id },
      { roomId: 'board-room', roomName: 'Board Room', date: dayAfter, startTime: '08:00', endTime: '17:00', bookerName: 'Budi Santoso', meetingTitle: 'Annual Strategy Day', userId: user1.id },
    ],
  });

  console.log('Seed completed. Test credentials:');
  console.log('  Admin: admin@ecocare.id / admin1234');
  console.log('  User:  budi@ecocare.id  / user1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
