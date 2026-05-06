/* eslint-disable no-console */
/**
 * Promote a user to `admin` role.
 *
 *   pnpm --filter @vivu/api promote:admin -- ten@example.com
 *
 * Useful while we don't have a UI for role management. The user must already
 * exist (have registered via /dang-ky).
 */
import { PrismaClient, Role } from '@prisma/client';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: promote:admin -- ten@example.com');
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user with email ${email}. Register first at /dang-ky.`);
      process.exit(1);
    }
    if (user.role === Role.admin) {
      console.log(`${email} is already admin.`);
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.admin },
    });
    console.log(`Promoted ${email} to admin.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
