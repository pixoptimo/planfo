import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { UserStore } from '../apps/server/src/storage/userStore.js';
import { hashPassword } from '../apps/server/src/auth/password.js';
import type { User } from '@cms/schemas';

async function resetAdmin(): Promise<void> {
  console.log('\n\x1b[36m⚡ Planfo CMS — Resetting Admin Credentials\x1b[0m');

  await initializeStorage();

  const passwordHash = await hashPassword('admin123');
  const now = new Date().toISOString();

  let admin = await UserStore.findByEmail('admin');
  if (admin) {
    admin.passwordHash = passwordHash;
    admin.active = true;
    admin.role = 'admin';
    admin.updatedAt = now;
    await UserStore.saveUser(admin);
  } else {
    admin = {
      id: 'usr_admin_default',
      email: 'admin@example.com',
      name: 'admin',
      passwordHash,
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now
    };
    await UserStore.saveUser(admin);
  }

  console.log('\n\x1b[32m✔ Admin credentials reset successfully!\x1b[0m');
  console.log(`\x1b[1m  Username:\x1b[0m admin (or ${admin.email})`);
  console.log(`\x1b[1m  Password:\x1b[0m admin123`);
  console.log(`\x1b[1m  Dashboard:\x1b[0m http://localhost:3000/admin\n`);
}

resetAdmin().catch((err) => {
  console.error('\x1b[31m❌ Failed to reset admin credentials:\x1b[0m', err);
  process.exit(1);
});

