import readline from 'node:readline';
import path from 'node:path';
import dotenv from 'dotenv';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { UserStore } from '../apps/server/src/storage/userStore.js';
import { hashPassword } from '../apps/server/src/auth/password.js';
import type { User } from '@cms/schemas';

dotenv.config();

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main(): Promise<void> {
  console.log('==============================================');
  console.log('   🛠️  Static CMS - Initial Admin User Setup  ');
  console.log('==============================================\n');

  await initializeStorage();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const email = (await ask(rl, 'Enter Admin Email (e.g. admin@example.com): ')).trim();
    if (!email || !email.includes('@')) {
      console.error('❌ Error: A valid email address is required.');
      process.exit(1);
    }

    const password = (await ask(rl, 'Enter Admin Password (min 8 characters): ')).trim();
    if (!password || password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long.');
      process.exit(1);
    }

    const name = (await ask(rl, 'Enter Admin Name (optional, default: Admin): ')).trim() || 'Admin';

    const existing = await UserStore.findByEmail(email);
    if (existing) {
      console.log(`⚠️ User with email "${email}" already exists. Updating password & promoting to admin...`);
      existing.passwordHash = await hashPassword(password);
      existing.role = 'admin';
      existing.name = name;
      existing.active = true;
      existing.updatedAt = new Date().toISOString();
      await UserStore.saveUser(existing);
    } else {
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      const adminUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email,
        name,
        passwordHash,
        role: 'admin',
        active: true,
        createdAt: now,
        updatedAt: now
      };
      await UserStore.saveUser(adminUser);
    }

    console.log('\n✅ Admin account created successfully with Argon2id hashing!');
    console.log(`📧 Email: ${email}`);
    console.log('🔑 Role: admin\n');
    console.log('You can now log in at the CMS admin dashboard.');
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('❌ Failed to create admin user:', err);
  process.exit(1);
});
