/**
 * EcoCare User Import Script
 * Usage: npm run users:import -- --file users.csv
 *
 * CSV format (with header row):
 *   name,email,password,role
 *   Budi Santoso,budi@gmail.com,secretpass123,USER
 *   Admin EcoCare,admin@gmail.com,adminpass456,ADMIN
 *
 * role is optional — defaults to USER
 * Existing users (by email) will have their details updated.
 * Passwords are always re-hashed on import.
 */

import { config } from 'dotenv';
import path from 'path';

// Load .env.local from project root
config({ path: path.resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

interface UserRow {
  name: string;
  email: string;
  password: string;
  role: string;
}

function parseCSV(filePath: string): UserRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row.');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name');
  const emailIdx = headers.indexOf('email');
  const passwordIdx = headers.indexOf('password');
  const roleIdx = headers.indexOf('role');

  if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
    throw new Error('CSV must have columns: name, email, password (role is optional)');
  }

  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map(c => c.trim());
    const name = cols[nameIdx];
    const email = cols[emailIdx];
    const password = cols[passwordIdx];
    const role = roleIdx !== -1 ? (cols[roleIdx] || 'USER').toUpperCase() : 'USER';

    if (!name || !email || !password) {
      throw new Error(`Row ${i + 2}: name, email, and password are required.`);
    }
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new Error(`Row ${i + 2}: role must be USER or ADMIN.`);
    }

    return { name, email: email.toLowerCase(), password, role };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf('--file');
  const csvPath = fileFlag !== -1 ? args[fileFlag + 1] : 'users.csv';

  const resolvedPath = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    console.error('Usage: npm run users:import -- --file path/to/users.csv');
    process.exit(1);
  }

  console.log(`Importing users from: ${resolvedPath}`);
  const rows = parseCSV(resolvedPath);
  console.log(`Found ${rows.length} user(s) to import.\n`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const hashedPassword = await bcrypt.hash(row.password, 12);
      const existing = await prisma.user.findUnique({ where: { email: row.email } });

      if (existing) {
        await prisma.user.update({
          where: { email: row.email },
          data: { name: row.name, password: hashedPassword, role: row.role, mustChangePassword: true },
        });
        console.log(`  ✓ Updated: ${row.email} (${row.role}) — will be prompted to change password`);
        updated++;
      } else {
        await prisma.user.create({
          data: { name: row.name, email: row.email, password: hashedPassword, role: row.role, mustChangePassword: true },
        });
        console.log(`  ✓ Created: ${row.email} (${row.role}) — will be prompted to change password`);
        created++;
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${row.email} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
