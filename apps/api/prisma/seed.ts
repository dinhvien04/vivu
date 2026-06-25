/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Regions (3 miền + chi tiết tỉnh trọng yếu)
// ──────────────────────────────────────────────────────────────────────────────

const REGIONS = [
  { slug: 'mien-bac', nameVi: 'Miền Bắc', nameEn: 'Northern Vietnam' },
  { slug: 'mien-trung', nameVi: 'Miền Trung', nameEn: 'Central Vietnam' },
  { slug: 'mien-nam', nameVi: 'Miền Nam', nameEn: 'Southern Vietnam' },
  { slug: 'tay-nguyen', nameVi: 'Tây Nguyên', nameEn: 'Central Highlands' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Categories (chủ đề)
// ──────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'bien-dao', nameVi: 'Biển đảo', nameEn: 'Beach & Islands', icon: 'beach_access' },
  { slug: 'nui-rung', nameVi: 'Núi rừng', nameEn: 'Mountains & Forests', icon: 'forest' },
  { slug: 'di-san', nameVi: 'Di sản', nameEn: 'Heritage', icon: 'temple_buddhist' },
  { slug: 'pho-co', nameVi: 'Phố cổ', nameEn: 'Ancient Towns', icon: 'apartment' },
  { slug: 'thac-suoi', nameVi: 'Thác – suối', nameEn: 'Waterfalls & Streams', icon: 'water' },
  { slug: 'hang-dong', nameVi: 'Hang động', nameEn: 'Caves', icon: 'landscape' },
  { slug: 'van-hoa', nameVi: 'Văn hoá', nameEn: 'Culture', icon: 'museum' },
  { slug: 'am-thuc', nameVi: 'Ẩm thực', nameEn: 'Cuisine', icon: 'restaurant' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Places — top spots Việt Nam, mỗi miền ~10–12 chỗ
// ──────────────────────────────────────────────────────────────────────────────

interface SeedPlace {
  slug: string;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  descriptionVi: string;
  regionSlug: string;
  address: string;
  lat: number;
  lng: number;
  bestSeasons: string[];
  categorySlugs: string[];
}

const PLACES: SeedPlace[] = [
  // ─── Miền Bắc ───
  {
    slug: 'vinh-ha-long',
    titleVi: 'Vịnh Hạ Long',
    titleEn: 'Ha Long Bay',
    summaryVi: 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi.',
    descriptionVi:
      'Vịnh Hạ Long là kỳ quan thiên nhiên với gần 2.000 đảo đá vôi, hang động kỳ ảo và làng chài cổ. Du khách có thể đi du thuyền 2 ngày 1 đêm, chèo kayak, hoặc tắm biển ở Bãi Cháy.',
    regionSlug: 'mien-bac',
    address: 'TP. Hạ Long, Quảng Ninh',
    lat: 20.9101,
    lng: 107.1839,
    bestSeasons: ['spring', 'autumn'],
    categorySlugs: ['bien-dao', 'di-san'],
  },
  {
    slug: 'sapa',
    titleVi: 'Sa Pa',
    titleEn: 'Sa Pa',
    summaryVi: 'Thị trấn vùng cao với ruộng bậc thang và đỉnh Fansipan.',
    descriptionVi:
      'Sa Pa nổi tiếng với khí hậu mát mẻ, các bản làng dân tộc Mông – Dao, ruộng bậc thang Mường Hoa và đỉnh Fansipan – nóc nhà Đông Dương 3.143m.',
    regionSlug: 'mien-bac',
    address: 'Lào Cai',
    lat: 22.3364,
    lng: 103.844,
    bestSeasons: ['autumn', 'winter'],
    categorySlugs: ['nui-rung', 'van-hoa'],
  },
  {
    slug: 'ha-giang',
    titleVi: 'Hà Giang',
    titleEn: 'Ha Giang',
    summaryVi: 'Cao nguyên đá Đồng Văn, đèo Mã Pí Lèng – cung đường huyền thoại.',
    descriptionVi:
      'Hà Giang là điểm cực bắc Tổ quốc, nổi tiếng với cao nguyên đá Đồng Văn (UNESCO Geopark), đèo Mã Pí Lèng và mùa hoa tam giác mạch tháng 10–11.',
    regionSlug: 'mien-bac',
    address: 'Tỉnh Hà Giang',
    lat: 22.823,
    lng: 104.984,
    bestSeasons: ['autumn'],
    categorySlugs: ['nui-rung', 'di-san'],
  },
  {
    slug: 'ninh-binh-trang-an',
    titleVi: 'Tràng An – Ninh Bình',
    titleEn: 'Trang An – Ninh Binh',
    summaryVi: 'Quần thể danh thắng "Hạ Long trên cạn" với hang động và sông uốn lượn.',
    descriptionVi:
      'Tràng An là di sản hỗn hợp UNESCO duy nhất ở Đông Nam Á. Du khách chèo thuyền qua hệ thống hang xuyên thuỷ, ghé chùa Bái Đính, Tam Cốc và cố đô Hoa Lư.',
    regionSlug: 'mien-bac',
    address: 'Ninh Bình',
    lat: 20.2536,
    lng: 105.8961,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['di-san', 'hang-dong'],
  },
  {
    slug: 'mai-chau',
    titleVi: 'Mai Châu',
    titleEn: 'Mai Chau',
    summaryVi: 'Thung lũng yên bình của người Thái với nhà sàn và ruộng lúa.',
    descriptionVi:
      'Mai Châu nằm cách Hà Nội 140km, là thung lũng xanh với bản làng người Thái. Lý tưởng để đạp xe, ở homestay nhà sàn và xem múa xòe.',
    regionSlug: 'mien-bac',
    address: 'Hoà Bình',
    lat: 20.6588,
    lng: 105.0689,
    bestSeasons: ['spring', 'autumn'],
    categorySlugs: ['nui-rung', 'van-hoa'],
  },
  {
    slug: 'ho-ba-be',
    titleVi: 'Hồ Ba Bể',
    titleEn: 'Ba Be Lake',
    summaryVi: 'Hồ nước ngọt tự nhiên lớn nhất Việt Nam, giữa rừng quốc gia.',
    descriptionVi:
      'Hồ Ba Bể (Bắc Kạn) là hồ nước ngọt trên núi đá vôi, dài ~8km. Hoạt động chính: chèo thuyền độc mộc, ghé thác Đầu Đẳng, động Puông và bản Pác Ngòi.',
    regionSlug: 'mien-bac',
    address: 'Bắc Kạn',
    lat: 22.4,
    lng: 105.6217,
    bestSeasons: ['summer', 'autumn'],
    categorySlugs: ['nui-rung', 'thac-suoi'],
  },
  {
    slug: 'mu-cang-chai',
    titleVi: 'Mù Cang Chải',
    titleEn: 'Mu Cang Chai',
    summaryVi: 'Ruộng bậc thang vàng rực mùa lúa chín tháng 9 – 10.',
    descriptionVi:
      'Mù Cang Chải (Yên Bái) có ruộng bậc thang được công nhận di tích quốc gia. Đèo Khau Phạ – một trong "tứ đại đỉnh đèo" – là điểm bay dù lượn nổi tiếng.',
    regionSlug: 'mien-bac',
    address: 'Yên Bái',
    lat: 21.79,
    lng: 104.0,
    bestSeasons: ['autumn'],
    categorySlugs: ['nui-rung', 'van-hoa'],
  },
  {
    slug: 'ho-guom-ha-noi',
    titleVi: 'Hồ Hoàn Kiếm',
    titleEn: 'Hoan Kiem Lake',
    summaryVi: 'Trái tim Hà Nội với cầu Thê Húc đỏ và đền Ngọc Sơn.',
    descriptionVi:
      'Hồ Hoàn Kiếm là biểu tượng của Hà Nội, gắn với truyền thuyết vua Lê trả gươm Rùa thần. Cuối tuần phố đi bộ quanh hồ rất sôi động.',
    regionSlug: 'mien-bac',
    address: 'Quận Hoàn Kiếm, Hà Nội',
    lat: 21.0287,
    lng: 105.8525,
    bestSeasons: ['autumn'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'cat-ba',
    titleVi: 'Đảo Cát Bà',
    titleEn: 'Cat Ba Island',
    summaryVi: 'Hòn đảo lớn nhất Vịnh Lan Hạ với rừng quốc gia và bãi tắm.',
    descriptionVi:
      'Cát Bà là đảo lớn nhất trong vịnh Lan Hạ, có vườn quốc gia rộng 17.000ha. Hoạt động: leo núi, chèo kayak qua các bãi giấu, lặn ngắm san hô.',
    regionSlug: 'mien-bac',
    address: 'Hải Phòng',
    lat: 20.7235,
    lng: 107.0488,
    bestSeasons: ['summer'],
    categorySlugs: ['bien-dao', 'nui-rung'],
  },
  {
    slug: 'moc-chau',
    titleVi: 'Mộc Châu',
    titleEn: 'Moc Chau',
    summaryVi: 'Cao nguyên với đồi chè trái tim và mùa hoa mận tháng Giêng.',
    descriptionVi:
      'Mộc Châu nổi tiếng với đồng cỏ rộng, đồi chè trái tim, thác Dải Yếm. Mùa đẹp nhất là tháng 1 (hoa mận) và tháng 10 (hoa cải trắng).',
    regionSlug: 'mien-bac',
    address: 'Sơn La',
    lat: 20.8333,
    lng: 104.6333,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['nui-rung'],
  },

  // ─── Miền Trung ───
  {
    slug: 'pho-co-hoi-an',
    titleVi: 'Phố cổ Hội An',
    titleEn: 'Hoi An Ancient Town',
    summaryVi: 'Phố cổ ven sông với đèn lồng và kiến trúc giao thoa Đông – Tây.',
    descriptionVi:
      'Hội An là di sản UNESCO, từng là thương cảng sầm uất thế kỷ 16–17. Buổi tối phố lung linh đèn lồng, du khách thả hoa đăng trên sông Hoài.',
    regionSlug: 'mien-trung',
    address: 'Quảng Nam',
    lat: 15.8801,
    lng: 108.338,
    bestSeasons: ['spring', 'autumn'],
    categorySlugs: ['pho-co', 'di-san'],
  },
  {
    slug: 'co-do-hue',
    titleVi: 'Cố đô Huế',
    titleEn: 'Hue Imperial City',
    summaryVi: 'Kinh đô triều Nguyễn với hoàng thành và lăng tẩm vua chúa.',
    descriptionVi:
      'Huế là kinh đô của triều Nguyễn (1802–1945). Quần thể di tích cố đô gồm Hoàng thành, lăng Tự Đức, lăng Khải Định, chùa Thiên Mụ – di sản UNESCO.',
    regionSlug: 'mien-trung',
    address: 'Thừa Thiên Huế',
    lat: 16.4637,
    lng: 107.5909,
    bestSeasons: ['spring'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'phong-nha-ke-bang',
    titleVi: 'Phong Nha – Kẻ Bàng',
    titleEn: 'Phong Nha – Ke Bang',
    summaryVi: 'Vương quốc hang động với Sơn Đoòng – hang lớn nhất thế giới.',
    descriptionVi:
      'Vườn quốc gia Phong Nha – Kẻ Bàng (UNESCO) chứa hơn 300 hang động. Sơn Đoòng – hang động lớn nhất thế giới – có tour 4N3Đ giá khoảng 70 triệu/người.',
    regionSlug: 'mien-trung',
    address: 'Quảng Bình',
    lat: 17.5333,
    lng: 106.2833,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['hang-dong', 'di-san'],
  },
  {
    slug: 'da-nang-ba-na',
    titleVi: 'Bà Nà Hills',
    titleEn: 'Ba Na Hills',
    summaryVi: 'Khu nghỉ mát trên núi với Cầu Vàng nổi tiếng thế giới.',
    descriptionVi:
      'Bà Nà Hills (Đà Nẵng) là khu du lịch trên đỉnh Núi Chúa, có Cầu Vàng – cây cầu trên tay khổng lồ trở thành biểu tượng du lịch Việt Nam.',
    regionSlug: 'mien-trung',
    address: 'Đà Nẵng',
    lat: 15.9833,
    lng: 107.9961,
    bestSeasons: ['spring', 'autumn'],
    categorySlugs: ['nui-rung'],
  },
  {
    slug: 'nha-trang',
    titleVi: 'Nha Trang',
    titleEn: 'Nha Trang',
    summaryVi: 'Thành phố biển nắng vàng với 4 đảo và VinWonders.',
    descriptionVi:
      'Nha Trang có bãi biển dài 7km, vịnh Nha Trang là một trong 29 vịnh đẹp nhất thế giới. Tour 4 đảo, lặn biển, suối khoáng nóng I-resort là các hoạt động chính.',
    regionSlug: 'mien-trung',
    address: 'Khánh Hoà',
    lat: 12.2388,
    lng: 109.1967,
    bestSeasons: ['summer'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'quy-nhon',
    titleVi: 'Quy Nhơn',
    titleEn: 'Quy Nhon',
    summaryVi: 'Biển hoang sơ Eo Gió, Kỳ Co và tháp Chăm cổ.',
    descriptionVi:
      'Quy Nhơn (Bình Định) ít đông đúc hơn các điểm biển nổi tiếng. Bãi Kỳ Co được mệnh danh "Maldives Việt Nam", Eo Gió đón hoàng hôn đẹp nhất.',
    regionSlug: 'mien-trung',
    address: 'Bình Định',
    lat: 13.7765,
    lng: 109.2231,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao', 'van-hoa'],
  },
  {
    slug: 'phu-yen',
    titleVi: 'Phú Yên',
    titleEn: 'Phu Yen',
    summaryVi: 'Gành Đá Đĩa kỳ vĩ và bối cảnh phim "Tôi thấy hoa vàng trên cỏ xanh".',
    descriptionVi:
      'Phú Yên có Gành Đá Đĩa – di tích quốc gia với hàng trăm cột đá hình lục giác. Cảnh đẹp nguyên sơ là điểm trừ nhưng cũng là điểm cộng cho ai thích bình yên.',
    regionSlug: 'mien-trung',
    address: 'Phú Yên',
    lat: 13.0881,
    lng: 109.0928,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'my-son',
    titleVi: 'Thánh địa Mỹ Sơn',
    titleEn: 'My Son Sanctuary',
    summaryVi: 'Khu đền tháp Chăm cổ nhất Đông Nam Á – di sản UNESCO.',
    descriptionVi:
      'Mỹ Sơn nằm cách Hội An 40km, là quần thể đền tháp Chăm Pa thế kỷ 4–14. Có chương trình biểu diễn vũ điệu Apsara hàng ngày.',
    regionSlug: 'mien-trung',
    address: 'Quảng Nam',
    lat: 15.7639,
    lng: 108.1242,
    bestSeasons: ['spring', 'autumn'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'ly-son',
    titleVi: 'Đảo Lý Sơn',
    titleEn: 'Ly Son Island',
    summaryVi: '"Vương quốc tỏi" với núi lửa cổ và biển xanh ngọc.',
    descriptionVi:
      'Lý Sơn (Quảng Ngãi) là đảo núi lửa, nổi tiếng tỏi tía. Cổng Tò Vò, miệng núi lửa Thới Lới, hang Câu là các điểm phải đến.',
    regionSlug: 'mien-trung',
    address: 'Quảng Ngãi',
    lat: 15.3833,
    lng: 109.1167,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao'],
  },

  // ─── Tây Nguyên ───
  {
    slug: 'da-lat',
    titleVi: 'Đà Lạt',
    titleEn: 'Da Lat',
    summaryVi: 'Thành phố ngàn hoa, khí hậu mát mẻ quanh năm.',
    descriptionVi:
      'Đà Lạt nằm trên cao nguyên Lâm Viên 1.500m, khí hậu 17–22°C quanh năm. Hoạt động: cà phê chill, săn mây ở Cầu Đất, ngắm hoa anh đào tháng 1–2.',
    regionSlug: 'tay-nguyen',
    address: 'Lâm Đồng',
    lat: 11.9404,
    lng: 108.4583,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['nui-rung'],
  },
  {
    slug: 'buon-ma-thuot',
    titleVi: 'Buôn Ma Thuột',
    titleEn: 'Buon Ma Thuot',
    summaryVi: 'Thủ phủ cà phê Việt Nam và văn hoá cồng chiêng Tây Nguyên.',
    descriptionVi:
      'Buôn Ma Thuột (Đắk Lắk) là thủ phủ cà phê. Lễ hội cà phê 2 năm/lần thu hút hàng vạn du khách. Bản Đôn cưỡi voi, thác Dray Nur cũng nổi tiếng.',
    regionSlug: 'tay-nguyen',
    address: 'Đắk Lắk',
    lat: 12.6797,
    lng: 108.0376,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['van-hoa', 'thac-suoi'],
  },
  {
    slug: 'pleiku-bien-ho',
    titleVi: 'Biển Hồ Pleiku',
    titleEn: "T'Nung Lake (Pleiku)",
    summaryVi: '"Đôi mắt Pleiku" – hồ trên núi lửa cổ, mặt nước xanh thẳm.',
    descriptionVi:
      'Biển Hồ (T\'Nưng) là hồ nước ngọt nằm trên miệng núi lửa cổ, sâu 18m. Cảm hứng cho ca khúc "Đôi mắt Pleiku" của Nguyễn Cường.',
    regionSlug: 'tay-nguyen',
    address: 'Gia Lai',
    lat: 14.0583,
    lng: 108.0,
    bestSeasons: ['winter'],
    categorySlugs: ['nui-rung'],
  },
  {
    slug: 'kon-tum-nha-tho-go',
    titleVi: 'Nhà thờ gỗ Kon Tum',
    titleEn: 'Kon Tum Wooden Cathedral',
    summaryVi: 'Nhà thờ Pháp xây toàn gỗ cà chít từ năm 1913.',
    descriptionVi:
      'Nhà thờ gỗ Kon Tum xây bằng gỗ cà chít, kiến trúc Roma kết hợp nhà sàn Bahnar. Là biểu tượng tôn giáo – văn hoá của Tây Nguyên.',
    regionSlug: 'tay-nguyen',
    address: 'Kon Tum',
    lat: 14.3551,
    lng: 108.0102,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['van-hoa', 'di-san'],
  },
  {
    slug: 'ho-tuyen-lam',
    titleVi: 'Hồ Tuyền Lâm',
    titleEn: 'Tuyen Lam Lake',
    summaryVi: 'Hồ nhân tạo lớn nhất Đà Lạt giữa rừng thông xanh.',
    descriptionVi:
      'Hồ Tuyền Lâm rộng 320ha, là khu Quốc gia về Du lịch. Có thể chèo SUP, đạp vịt, glamping, cà phê view hồ Mê Linh.',
    regionSlug: 'tay-nguyen',
    address: 'Đà Lạt, Lâm Đồng',
    lat: 11.873,
    lng: 108.451,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['nui-rung'],
  },

  // ─── Miền Nam ───
  {
    slug: 'sai-gon-ben-thanh',
    titleVi: 'Chợ Bến Thành – Sài Gòn',
    titleEn: 'Ben Thanh Market – Saigon',
    summaryVi: 'Biểu tượng thương mại Sài Gòn từ năm 1914.',
    descriptionVi:
      'Chợ Bến Thành nằm ngay trung tâm Quận 1, bán đồ lưu niệm, đặc sản, ẩm thực Việt. Chợ đêm Bến Thành mở từ 19h đến 22h.',
    regionSlug: 'mien-nam',
    address: 'Quận 1, TP.HCM',
    lat: 10.7723,
    lng: 106.698,
    bestSeasons: ['winter'],
    categorySlugs: ['di-san', 'am-thuc'],
  },
  {
    slug: 'phu-quoc',
    titleVi: 'Đảo Phú Quốc',
    titleEn: 'Phu Quoc Island',
    summaryVi: 'Đảo ngọc Vịnh Thái Lan với bãi Sao trắng mịn và hồ tiêu.',
    descriptionVi:
      'Phú Quốc (Kiên Giang) là đảo lớn nhất Việt Nam. Hoạt động: cáp treo Hòn Thơm dài nhất thế giới, lặn ngắm san hô An Thới, chợ đêm Dinh Cậu.',
    regionSlug: 'mien-nam',
    address: 'Kiên Giang',
    lat: 10.227,
    lng: 103.964,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'mui-ne',
    titleVi: 'Mũi Né',
    titleEn: 'Mui Ne',
    summaryVi: 'Đồi cát bay đỏ và làng chài Hàm Tiến đầy thuyền thúng.',
    descriptionVi:
      'Mũi Né (Phan Thiết, Bình Thuận) có đồi cát bay đỏ, đồi cát trắng, suối Tiên đỏ rực và làng chài Hàm Tiến nhộn nhịp lúc 5h sáng.',
    regionSlug: 'mien-nam',
    address: 'Bình Thuận',
    lat: 10.9333,
    lng: 108.2833,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'con-dao',
    titleVi: 'Côn Đảo',
    titleEn: 'Con Dao',
    summaryVi: 'Quần đảo lịch sử với bãi biển hoang sơ nhất Việt Nam.',
    descriptionVi:
      'Côn Đảo (Bà Rịa – Vũng Tàu) có 16 đảo, từng là "địa ngục trần gian" nhà tù Pháp. Nay là khu bảo tồn rùa biển và lặn ngắm san hô số 1.',
    regionSlug: 'mien-nam',
    address: 'Bà Rịa – Vũng Tàu',
    lat: 8.6833,
    lng: 106.6,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao', 'di-san'],
  },
  {
    slug: 'mekong-ben-tre',
    titleVi: 'Bến Tre – Miền Tây',
    titleEn: 'Ben Tre – Mekong Delta',
    summaryVi: 'Xứ dừa Bến Tre – chợ nổi, vườn trái cây, đờn ca tài tử.',
    descriptionVi:
      'Bến Tre nổi tiếng với xứ dừa, kẹo dừa truyền thống, sông nước miền Tây. Tour 1 ngày từ Sài Gòn: chợ nổi Cái Bè, lò kẹo dừa, đi xuồng ba lá.',
    regionSlug: 'mien-nam',
    address: 'Bến Tre',
    lat: 10.2433,
    lng: 106.3756,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['van-hoa', 'am-thuc'],
  },
  {
    slug: 'chau-doc-ba-chua-xu',
    titleVi: 'Châu Đốc – Núi Sam',
    titleEn: 'Chau Doc – Sam Mountain',
    summaryVi: 'Miếu Bà Chúa Xứ Núi Sam – điểm hành hương lớn nhất Nam Bộ.',
    descriptionVi:
      'Châu Đốc (An Giang) có Miếu Bà Chúa Xứ Núi Sam, lễ hội Vía Bà tháng 4 âm lịch thu hút triệu lượt khách. Cũng có làng người Chăm Châu Giang.',
    regionSlug: 'mien-nam',
    address: 'An Giang',
    lat: 10.7,
    lng: 105.117,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'vung-tau',
    titleVi: 'Vũng Tàu',
    titleEn: 'Vung Tau',
    summaryVi: 'Thành phố biển gần Sài Gòn, tượng Chúa Kitô và Hải Đăng.',
    descriptionVi:
      'Vũng Tàu cách Sài Gòn 100km, có Tượng Chúa Kitô Vua cao 32m, ngọn hải đăng 100 tuổi, bãi Sau bãi Trước. Đặc sản: bánh khọt cô Ba Vũng Tàu.',
    regionSlug: 'mien-nam',
    address: 'Bà Rịa – Vũng Tàu',
    lat: 10.346,
    lng: 107.084,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['bien-dao', 'am-thuc'],
  },
  {
    slug: 'can-tho-cho-noi',
    titleVi: 'Chợ nổi Cái Răng – Cần Thơ',
    titleEn: 'Cai Rang Floating Market',
    summaryVi: 'Chợ nổi lớn nhất Đồng bằng Sông Cửu Long, họp từ 4h sáng.',
    descriptionVi:
      'Chợ nổi Cái Răng (Cần Thơ) hoạt động sôi động nhất từ 4h–6h sáng. Du khách thuê thuyền nhỏ len lỏi, ăn bún riêu trên ghe.',
    regionSlug: 'mien-nam',
    address: 'Cần Thơ',
    lat: 10.0341,
    lng: 105.8083,
    bestSeasons: ['winter'],
    categorySlugs: ['van-hoa', 'am-thuc'],
  },
  {
    slug: 'tay-ninh-nui-ba-den',
    titleVi: 'Núi Bà Đen – Tây Ninh',
    titleEn: 'Ba Den Mountain',
    summaryVi: '"Nóc nhà Nam Bộ" cao 996m, có cáp treo lập kỷ lục Guinness.',
    descriptionVi:
      'Núi Bà Đen là điểm cao nhất Nam Bộ. Có cáp treo Sun World Bà Đen Mountain – kỷ lục Guinness ga cáp treo lớn nhất thế giới (2020).',
    regionSlug: 'mien-nam',
    address: 'Tây Ninh',
    lat: 11.3744,
    lng: 106.171,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['nui-rung', 'van-hoa'],
  },
  {
    slug: 'rach-gia-hon-son',
    titleVi: 'Hòn Sơn – Rạch Giá',
    titleEn: 'Hon Son Island',
    summaryVi: 'Đảo nhỏ vịnh Thái Lan, biển trong vắt và hải sản tươi rói.',
    descriptionVi:
      'Hòn Sơn (Kiên Giang) là đảo nhỏ giữa Rạch Giá và Phú Quốc. 7 đỉnh núi, bãi Bàng và bãi Bấc đẹp nhất, chưa bị du lịch hoá.',
    regionSlug: 'mien-nam',
    address: 'Kiên Giang',
    lat: 9.7917,
    lng: 104.6444,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['bien-dao'],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Active local seed data is intentionally scoped to Gia Lai, including the
// former Binh Dinh area now used by the product.
const ACTIVE_PLACES: SeedPlace[] = [
  {
    slug: 'bien-ho',
    titleVi: 'Biển Hồ',
    titleEn: 'Bien Ho Lake',
    summaryVi: 'Hồ nước miệng núi lửa nổi bật giữa cao nguyên Pleiku.',
    descriptionVi:
      'Biển Hồ là một thắng cảnh quen thuộc của Pleiku, có mặt nước rộng, không khí mát và cảnh quan cao nguyên phù hợp để ngắm bình minh, chụp ảnh và kết hợp tham quan hàng thông trăm tuổi.',
    regionSlug: 'tay-nguyen',
    address: 'Pleiku, Gia Lai',
    lat: 14.0577,
    lng: 108.0086,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['thac-suoi', 'nui-rung'],
  },
  {
    slug: 'bien-ho-che',
    titleVi: 'Biển Hồ Chè',
    titleEn: 'Bien Ho Tea Hills',
    summaryVi: 'Đồi chè xanh gần Biển Hồ, hợp đi dạo và chụp ảnh buổi sáng.',
    descriptionVi:
      'Biển Hồ Chè là vùng đồi chè xanh mát gần Pleiku. Đây là điểm dừng nhẹ nhàng cho lịch trình nửa ngày, thường được kết hợp với Biển Hồ và hàng thông trăm tuổi.',
    regionSlug: 'tay-nguyen',
    address: 'Pleiku, Gia Lai',
    lat: 14.0595,
    lng: 108.0025,
    bestSeasons: ['winter', 'spring'],
    categorySlugs: ['nui-rung', 'van-hoa'],
  },
  {
    slug: 'thac-phu-cuong',
    titleVi: 'Thác Phú Cường',
    titleEn: 'Phu Cuong Waterfall',
    summaryVi: 'Thác nước lớn trên nền đá bazan, nổi bật sau mùa mưa.',
    descriptionVi:
      'Thác Phú Cường là một điểm thiên nhiên nổi tiếng của Gia Lai với dòng nước đổ mạnh qua vách đá bazan. Du khách nên kiểm tra thời tiết và đường đi trước khi ghé.',
    regionSlug: 'tay-nguyen',
    address: 'Chư Sê, Gia Lai',
    lat: 13.7857,
    lng: 108.2087,
    bestSeasons: ['summer', 'autumn'],
    categorySlugs: ['thac-suoi', 'nui-rung'],
  },
  {
    slug: 'ky-co',
    titleVi: 'Kỳ Co',
    titleEn: 'Ky Co',
    summaryVi: 'Bãi biển xanh trong ở khu vực Quy Nhơn, hợp tắm biển và chụp ảnh.',
    descriptionVi:
      'Kỳ Co là bãi biển nổi bật của khu vực Quy Nhơn, có nước xanh và cảnh quan đá ven biển. Điểm này thường được kết hợp cùng Eo Gió trong lịch trình biển đảo.',
    regionSlug: 'mien-trung',
    address: 'Quy Nhơn, Gia Lai (Bình Định cũ)',
    lat: 13.9536,
    lng: 109.2794,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'eo-gio',
    titleVi: 'Eo Gió',
    titleEn: 'Eo Gio',
    summaryVi: 'Cung đường ven biển với vách đá và góc nhìn rộng ra biển.',
    descriptionVi:
      'Eo Gió là thắng cảnh ven biển nổi tiếng ở Quy Nhơn, nổi bật với vách đá ôm lấy eo biển và đường đi bộ ven núi nhìn xuống nước xanh.',
    regionSlug: 'mien-trung',
    address: 'Nhơn Lý, Quy Nhơn, Gia Lai (Bình Định cũ)',
    lat: 13.8895,
    lng: 109.2883,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['bien-dao'],
  },
  {
    slug: 'thap-doi',
    titleVi: 'Tháp Đôi',
    titleEn: 'Twin Cham Towers',
    summaryVi: 'Cụm tháp Chăm nằm trong đô thị Quy Nhơn.',
    descriptionVi:
      'Tháp Đôi là di tích kiến trúc Chăm tiêu biểu ở Quy Nhơn. Điểm này phù hợp cho lịch trình tìm hiểu văn hóa Chăm và các di tích trong khu vực.',
    regionSlug: 'mien-trung',
    address: 'Quy Nhơn, Gia Lai (Bình Định cũ)',
    lat: 13.7829,
    lng: 109.2199,
    bestSeasons: ['spring', 'winter'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'bao-tang-quang-trung',
    titleVi: 'Bảo tàng Quang Trung',
    titleEn: 'Quang Trung Museum',
    summaryVi: 'Không gian lịch sử gắn với phong trào Tây Sơn.',
    descriptionVi:
      'Bảo tàng Quang Trung là điểm tham quan lịch sử quan trọng ở vùng Tây Sơn, phù hợp với du khách muốn tìm hiểu văn hóa, lịch sử và các câu chuyện về phong trào Tây Sơn.',
    regionSlug: 'mien-trung',
    address: 'Tây Sơn, Gia Lai (Bình Định cũ)',
    lat: 13.9258,
    lng: 108.8937,
    bestSeasons: ['spring', 'winter'],
    categorySlugs: ['di-san', 'van-hoa'],
  },
  {
    slug: 'suoi-da-vang',
    titleVi: 'Suối Đá Vàng',
    titleEn: 'Suoi Da Vang',
    summaryVi: 'Điểm thiên nhiên gần Bãi Xép, còn được biết đến với tên Tuyệt tình Cốc.',
    descriptionVi:
      'Suối Đá Vàng là điểm thiên nhiên gần khu vực Bãi Xép, Quy Nhơn. Dữ liệu tọa độ hiện ở mức đại diện, nên nên kiểm tra đường đi thực tế trước khi ghé.',
    regionSlug: 'mien-trung',
    address: 'Quy Nhơn, Gia Lai (Bình Định cũ)',
    lat: 13.689065,
    lng: 109.221062,
    bestSeasons: ['spring', 'summer'],
    categorySlugs: ['thac-suoi', 'nui-rung'],
  },
];

const LEGACY_DEMO_PLACE_SLUGS = PLACES.map((place) => place.slug);

// Seed runner
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('▶︎ Seeding regions...');
  for (const r of REGIONS) {
    await prisma.region.upsert({
      where: { slug: r.slug },
      update: { nameVi: r.nameVi, nameEn: r.nameEn },
      create: r,
    });
  }

  console.log('▶︎ Seeding categories...');
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameVi: c.nameVi, nameEn: c.nameEn, icon: c.icon },
      create: c,
    });
  }

  console.log(`▶︎ Seeding ${ACTIVE_PLACES.length} Gia Lai places...`);
  const regionMap = new Map((await prisma.region.findMany()).map((r) => [r.slug, r.id]));
  const categoryMap = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of ACTIVE_PLACES) {
    const regionId = regionMap.get(p.regionSlug);
    if (!regionId) {
      console.warn(`   skip ${p.slug}: region "${p.regionSlug}" not found`);
      continue;
    }

    const place = await prisma.place.upsert({
      where: { slug: p.slug },
      update: {
        titleVi: p.titleVi,
        titleEn: p.titleEn,
        summaryVi: p.summaryVi,
        descriptionVi: p.descriptionVi,
        regionId,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        bestSeasons: p.bestSeasons,
        province: 'Gia Lai',
        status: 'published',
      },
      create: {
        slug: p.slug,
        titleVi: p.titleVi,
        titleEn: p.titleEn,
        summaryVi: p.summaryVi,
        descriptionVi: p.descriptionVi,
        regionId,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        bestSeasons: p.bestSeasons,
        province: 'Gia Lai',
        status: 'published',
      },
    });

    // Replace categories.
    await prisma.placeCategory.deleteMany({ where: { placeId: place.id } });
    for (const slug of p.categorySlugs) {
      const categoryId = categoryMap.get(slug);
      if (!categoryId) continue;
      await prisma.placeCategory.create({
        data: { placeId: place.id, categoryId },
      });
    }
  }

  const activeSeedSlugs = new Set(ACTIVE_PLACES.map((place) => place.slug));
  const legacyDemoSlugsToArchive = LEGACY_DEMO_PLACE_SLUGS.filter((slug) => !activeSeedSlugs.has(slug));
  if (legacyDemoSlugsToArchive.length > 0) {
    const archived = await prisma.place.updateMany({
      where: { slug: { in: legacyDemoSlugsToArchive } },
      data: { status: 'archived' },
    });
    if (archived.count > 0) {
      console.log(`▶︎ Archived ${archived.count} legacy nationwide demo places.`);
    }
  }

  const total = await prisma.place.count({ where: { status: 'published' } });
  console.log(`✔︎ Seed done. Published places: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
