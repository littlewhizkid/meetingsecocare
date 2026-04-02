import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed rooms with exact IDs matching existing booking data
  const rooms = [
    { id: 'board-room', name: 'Board Room', description: 'Main conference room with projector & video conferencing', capacity: '12 people', icon: '🏛️', order: 1 },
    { id: 'small-meeting-room', name: 'Small Meeting Room', description: 'Intimate discussion space with whiteboard', capacity: '6 people', icon: '💼', order: 2 },
    { id: 'podcast-room', name: 'Podcast Room', description: 'Soundproofed recording studio', capacity: '10 people', icon: '🎙️', order: 3 },
    { id: 'interview-room', name: 'Interview Room', description: 'Private space for interviews and 1-on-1s', capacity: '4 people', icon: '🤝', order: 4 },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({ where: { id: room.id }, update: room, create: room });
  }
  console.log('Rooms seeded.');

  // Also keep existing user seeds
  const adminPass = await bcrypt.hash('admin1234', 12);
  const userPass = await bcrypt.hash('user1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@ecocare.id' },
    update: {},
    create: { email: 'admin@ecocare.id', name: 'Admin EcoCare', password: adminPass, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'budi@ecocare.id' },
    update: {},
    create: { email: 'budi@ecocare.id', name: 'Budi Santoso', password: userPass, role: 'USER' },
  });
  console.log('Seed done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
