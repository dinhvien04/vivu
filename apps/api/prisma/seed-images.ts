/* eslint-disable no-console */
/**
 * Seed cover images for places by fetching public domain photos from
 * Wikipedia (en + vi) and uploading them to Cloudinary under
 * `vivu/places/<slug>`.
 *
 * Usage:
 *   pnpm --filter @vivu/api seed:images
 *
 * Requires `DATABASE_URL` and `CLOUDINARY_URL`.
 */
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// slug → ordered list of candidate Wikipedia article titles.
// We try en.wikipedia.org first (richer page images), then vi.wikipedia.org.
const WIKI_CANDIDATES: Record<string, { en?: string[]; vi?: string[] }> = {
  'vinh-ha-long': { en: ['Hạ_Long_Bay'], vi: ['Vịnh_Hạ_Long'] },
  sapa: { en: ['Sa_Pa'], vi: ['Sa_Pa'] },
  'ha-giang': { en: ['Hà_Giang_province'], vi: ['Hà_Giang'] },
  'ninh-binh-trang-an': { en: ['Tràng_An_Scenic_Landscape_Complex'], vi: ['Tràng_An'] },
  'mai-chau': { en: ['Mai_Châu_District'], vi: ['Mai_Châu'] },
  'ho-ba-be': { en: ['Ba_Bể_Lake'], vi: ['Hồ_Ba_Bể'] },
  'mu-cang-chai': { en: ['Mù_Cang_Chải_District'], vi: ['Mù_Cang_Chải'] },
  'ho-guom-ha-noi': { en: ['Hoàn_Kiếm_Lake'], vi: ['Hồ_Hoàn_Kiếm'] },
  'cat-ba': { en: ['Cát_Bà_Island'], vi: ['Cát_Bà'] },
  'moc-chau': { en: ['Mộc_Châu_District'], vi: ['Mộc_Châu'] },
  'pho-co-hoi-an': { en: ['Hội_An'], vi: ['Hội_An'] },
  'co-do-hue': { en: ['Imperial_City,_Huế'], vi: ['Quần_thể_di_tích_Cố_đô_Huế'] },
  'phong-nha-ke-bang': {
    en: ['Phong_Nha-Kẻ_Bàng_National_Park'],
    vi: ['Vườn_quốc_gia_Phong_Nha_-_Kẻ_Bàng'],
  },
  'da-nang-ba-na': { en: ['Bà_Nà_Hills'], vi: ['Bà_Nà'] },
  'nha-trang': { en: ['Nha_Trang'], vi: ['Nha_Trang'] },
  'quy-nhon': { en: ['Quy_Nhơn'], vi: ['Quy_Nhơn'] },
  'phu-yen': { en: ['Phú_Yên_province'], vi: ['Phú_Yên'] },
  'my-son': { en: ['Mỹ_Sơn'], vi: ['Thánh_địa_Mỹ_Sơn'] },
  'ly-son': { en: ['Lý_Sơn_District'], vi: ['Đảo_Lý_Sơn'] },
  'da-lat': { en: ['Đà_Lạt'], vi: ['Đà_Lạt'] },
  'buon-ma-thuot': { en: ['Buôn_Ma_Thuột'], vi: ['Buôn_Ma_Thuột'] },
  'pleiku-bien-ho': {
    en: ['Tơ_Nưng_Lake', 'Pleiku', 'Gia_Lai_Province'],
    vi: ['Biển_Hồ', 'Pleiku'],
  },
  'kon-tum-nha-tho-go': {
    en: ['Kon_Tum_Wooden_Cathedral'],
    vi: ['Nhà_thờ_gỗ_Kon_Tum'],
  },
  'ho-tuyen-lam': { en: ['Tuyền_Lâm_Lake'], vi: ['Hồ_Tuyền_Lâm'] },
  'sai-gon-ben-thanh': { en: ['Bến_Thành_Market'], vi: ['Chợ_Bến_Thành'] },
  'phu-quoc': { en: ['Phú_Quốc'], vi: ['Phú_Quốc'] },
  'mui-ne': { en: ['Mũi_Né'], vi: ['Mũi_Né'] },
  'con-dao': { en: ['Côn_Đảo'], vi: ['Côn_Đảo'] },
  'mekong-ben-tre': { en: ['Bến_Tre_province'], vi: ['Bến_Tre'] },
  'chau-doc-ba-chua-xu': { en: ['Châu_Đốc'], vi: ['Châu_Đốc'] },
  'vung-tau': { en: ['Vũng_Tàu'], vi: ['Vũng_Tàu'] },
  'can-tho-cho-noi': { en: ['Cái_Răng_Floating_Market'], vi: ['Chợ_nổi_Cái_Răng'] },
  'tay-ninh-nui-ba-den': { en: ['Bà_Đen_Mountain'], vi: ['Núi_Bà_Đen'] },
  'rach-gia-hon-son': {
    en: ['Hòn_Sơn', 'Lại_Sơn', 'Kiên_Hải_District'],
    vi: ['Hòn_Sơn', 'Lại_Sơn,_Kiên_Hải', 'Rạch_Giá'],
  },
};

const USER_AGENT = 'VivuTravelBot/1.0 (https://vivu.app; admin@vivu.app)';

interface PageImage {
  source: string;
  width: number;
  height: number;
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        original?: PageImage;
        thumbnail?: PageImage;
      }
    >;
  };
}

async function fetchPageImage(host: string, title: string): Promise<PageImage | null> {
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set('action', 'query');
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('piprop', 'original|thumbnail');
  url.searchParams.set('pithumbsize', '2400');
  url.searchParams.set('redirects', '1');
  url.searchParams.set('format', 'json');
  url.searchParams.set('titles', title);

  const res = await fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = (await res.json()) as WikiQueryResponse;
  const pages = data.query?.pages;
  if (!pages) return null;
  // Prefer Wikimedia's thumbnail (bounded by pithumbsize=2400) over the
  // original — full-size originals are sometimes >10MB which exceeds our
  // Cloudinary plan's upload limit.
  for (const p of Object.values(pages)) {
    if (p?.thumbnail) return p.thumbnail;
    if (p?.original) return p.original;
  }
  return null;
}

async function findImage(slug: string): Promise<PageImage | null> {
  const cand = WIKI_CANDIDATES[slug];
  if (!cand) return null;
  for (const t of cand.en ?? []) {
    const img = await fetchPageImage('en.wikipedia.org', t);
    if (img) return img;
  }
  for (const t of cand.vi ?? []) {
    const img = await fetchPageImage('vi.wikipedia.org', t);
    if (img) return img;
  }
  return null;
}

async function downloadBuffer(url: string, retries = 3): Promise<Buffer> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    }
    if (res.status === 429) {
      // Wikimedia rate-limit — back off.
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      continue;
    }
    throw new Error(`Download ${url} → ${res.status}`);
  }
  throw new Error(`Download ${url} failed after ${retries} attempts (rate limited)`);
}

async function uploadBuffer(buf: Buffer, publicId: string) {
  return new Promise<{ public_id: string; secure_url: string; width: number; height: number }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 2400, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' },
          ],
        },
        (err, res) => {
          if (err || !res) return reject(err ?? new Error('upload failed'));
          resolve({
            public_id: res.public_id,
            secure_url: res.secure_url,
            width: res.width,
            height: res.height,
          });
        },
      );
      stream.end(buf);
    },
  );
}

async function main() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error('CLOUDINARY_URL is required.');
  cloudinary.config({ secure: true });

  const places = await prisma.place.findMany();
  console.log(
    `▶︎ Processing ${places.length} places (mapped: ${Object.keys(WIKI_CANDIDATES).length})`,
  );

  let okCount = 0;
  let skipCount = 0;

  for (const place of places) {
    try {
      const img = await findImage(place.slug);
      if (!img) {
        console.log(`  - skip ${place.slug}: no Wikipedia image found`);
        skipCount++;
        continue;
      }

      // Download then upload buffer (more reliable than telling Cloudinary to
      // fetch the URL itself, which Wikimedia rate-limits).
      const buf = await downloadBuffer(img.source);
      const publicId = `vivu/places/${place.slug}`;
      const upload = await uploadBuffer(buf, publicId);

      const heroUrl = cloudinary.url(upload.public_id, {
        secure: true,
        transformation: [
          { width: 1600, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
        ],
      });

      await prisma.$transaction([
        prisma.place.update({
          where: { id: place.id },
          data: { heroImageUrl: heroUrl },
        }),
        prisma.photo.deleteMany({ where: { placeId: place.id, publicId: upload.public_id } }),
        prisma.photo.create({
          data: {
            placeId: place.id,
            url: heroUrl,
            publicId: upload.public_id,
            width: upload.width,
            height: upload.height,
            alt: place.titleVi,
            position: 0,
            isCover: true,
          },
        }),
      ]);

      console.log(`  ✓ ${place.slug} → ${upload.public_id} (${upload.width}x${upload.height})`);
      okCount++;

      // Be polite to Wikimedia.
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      console.warn(`  ✗ ${place.slug}: ${(e as Error).message}`);
      skipCount++;
    }
  }

  console.log(`▶︎ Done. uploaded=${okCount}, skipped=${skipCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
