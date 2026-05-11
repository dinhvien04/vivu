/* eslint-disable no-console */
/**
 * Đẩy toàn bộ Place (status=published) lên MeiliSearch.
 *
 *   pnpm --filter @vivu/api reindex:meili
 *
 * Đọc env MEILI_HOST / MEILI_API_KEY / MEILI_INDEX_PLACES (mặc định "places").
 * Chạy 1 lần sau khi `docker compose up meilisearch` lần đầu, hoặc khi document
 * schema thay đổi. Trong runtime, admin-places tự đồng bộ create/update/delete
 * qua SearchIndexService — script này chỉ để backfill.
 */
import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

async function main() {
  const host = process.env.MEILI_HOST;
  const apiKey = process.env.MEILI_API_KEY;
  const indexName = process.env.MEILI_INDEX_PLACES ?? 'places';

  if (!host) {
    console.error('MEILI_HOST is unset; aborting.');
    process.exit(2);
  }

  const client = new MeiliSearch({ host, apiKey });
  const index = client.index(indexName);

  try {
    await client.createIndex(indexName, { primaryKey: 'id' });
  } catch {
    /* exists */
  }
  await index.updateSettings({
    searchableAttributes: ['titleVi', 'titleEn', 'address'],
    filterableAttributes: ['status', 'regionSlug'],
    sortableAttributes: ['updatedAt'],
  });

  const prisma = new PrismaClient();
  try {
    const places = await prisma.place.findMany({
      where: { status: 'published' },
      include: { region: true },
    });
    await index.deleteAllDocuments();
    if (places.length === 0) {
      console.log('No published places to index.');
      return;
    }
    const docs = places.map((p) => ({
      id: p.id,
      slug: p.slug,
      titleVi: p.titleVi,
      titleEn: p.titleEn,
      address: p.address,
      heroImageUrl: p.heroImageUrl,
      regionSlug: p.region?.slug ?? null,
      status: p.status,
      updatedAt: p.updatedAt.getTime(),
    }));
    const task = await index.addDocuments(docs, { primaryKey: 'id' });
    console.log(`Queued ${docs.length} documents (task uid=${task.taskUid}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
