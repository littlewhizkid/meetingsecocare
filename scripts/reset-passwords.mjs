import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'ecocare2026';
  const hashed = await bcrypt.hash(newPassword, 12);

  const result = await prisma.user.updateMany({
    data: { password: hashed },
  });

  console.log(`✅ Reset ${result.count} user passwords to "${newPassword}"`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
