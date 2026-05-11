/**
 * Helper dùng chung cho integration test:
 * - `getPrisma()`: trả PrismaClient kết nối DB test (singleton, share across suites).
 * - `truncateAll()`: TRUNCATE toàn bộ bảng phụ thuộc (CASCADE) để cô lập test.
 *
 * Đảm bảo: gọi `truncateAll()` ở `beforeEach` trong từng test file, hoặc dùng
 * `afterEach` từ `cleanup.ts` (auto-truncate).
 */
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// Tên bảng đúng theo `schema.sql` (sinh từ schema.prisma — vd Photo, không
// phải PlacePhoto). TRUNCATE CASCADE nên thứ tự không quan trọng nhưng để
// tham chiếu rõ ràng.
const USER_TABLES = [
  'AuditLog',
  'Answer',
  'Question',
  'ReviewLike',
  'Review',
  'Favorite',
  'CollectionItem',
  'Collection',
  'PlaceCategory',
  'Photo',
  'Place',
  'Category',
  'Region',
  'PasswordResetToken',
  'RefreshToken',
  'User',
];

export async function truncateAll(): Promise<void> {
  const prisma = getPrisma();
  // Build single TRUNCATE for atomic reset + reset sequences.
  const list = USER_TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE;`);
}
