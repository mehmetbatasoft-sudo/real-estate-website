/**
 * prisma/seed.ts — Database seeder for Özgül's Realty
 *
 * Seeds the database with:
 * 1. Admin user (bcrypt hashed password, 12 salt rounds)
 * 2. Agent profile (Özgül Pekşen — single-agent architecture)
 * 3. Sample properties (3-5 listings for development/testing)
 *
 * Run with: pnpm prisma db seed
 * Only needs to run once after initial schema push.
 *
 * ⚠️ Contains admin credentials — keep repository private
 */

import { config } from 'dotenv'
import path from 'path'

/* Load environment variables from .env.local before anything else */
config({ path: path.join(__dirname, '..', '.env.local') })

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { hashSync } from 'bcryptjs'

/* Create a Prisma client instance for seeding */
/* Prisma v7: Uses Neon WebSocket adapter — supports transactions needed by upsert */
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Main seed function
 * Creates admin user, agent profile, and sample properties
 * Uses upsert to avoid duplicates on re-run
 */
async function main() {
  console.log('🌱 Starting database seed...')

  // =========================================================================
  // 1. Create Admin User
  // Password is hashed with bcrypt (12 salt rounds) — never stored plain text
  // =========================================================================
  const adminPassword = hashSync('Panta.7rhei', 12)

  const admin = await prisma.admin.upsert({
    where: { email: 'ozgul.oriva@gmail.com' },
    update: {},
    create: {
      name: 'Özgül Pekşen',
      email: 'ozgul.oriva@gmail.com',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // =========================================================================
  // 2. Create Agent Profile
  // Single-agent architecture — only 1 agent record exists
  // Includes multilingual bios (EN, TR, RU, AR)
  // =========================================================================
  const existingAgent = await prisma.agent.findFirst()

  if (!existingAgent) {
    const agent = await prisma.agent.create({
      data: {
        name: 'Özgül Pekşen',
        title: 'Luxury Real Estate Consultant',
        bio: 'With over 15 years of experience in the Antalya luxury real estate market, I help international buyers find their dream properties on the Turkish Riviera. My deep knowledge of the local market, combined with multilingual capabilities, ensures a seamless property buying experience.',
        bioTr: 'Antalya lüks gayrimenkul piyasasında 15 yılı aşkın deneyimimle, uluslararası alıcıların Türk Rivierası\'nda hayallerindeki mülkleri bulmalarına yardımcı oluyorum. Yerel piyasa hakkındaki derin bilgim, çok dilli yeteneklerimle birleşerek sorunsuz bir mülk satın alma deneyimi sunuyor.',
        bioRu: 'Имея более 15 лет опыта на рынке элитной недвижимости Анталии, я помогаю международным покупателям найти недвижимость их мечты на Турецкой Ривьере. Мое глубокое знание местного рынка в сочетании с многоязычными возможностями обеспечивает беспроблемный процесс покупки.',
        bioAr: 'مع أكثر من 15 عامًا من الخبرة في سوق العقارات الفاخرة في أنطاليا، أساعد المشترين الدوليين في العثور على عقارات أحلامهم على الريفييرا التركية. معرفتي العميقة بالسوق المحلي، جنبًا إلى جنب مع القدرات متعددة اللغات، تضمن تجربة شراء سلسة.',
        phone: '+90 555 123 4567',
        email: 'ozgul.oriva@gmail.com',
        imageId: 'picture-agent',
        experience: 15,
        listings: 45,
        rating: 4.9,
      },
    })
    console.log('✅ Agent profile created:', agent.name)
  } else {
    console.log('ℹ️ Agent already exists, skipping...')
  }

  // =========================================================================
  // 3. Create Sample Properties
  // At least 1 featured (for homepage), mix of forSale true/false (for filters),
  // minimum 2 total (for "Similar Properties" section)
  // =========================================================================
  const propertyCount = await prisma.property.count()

  if (propertyCount === 0) {
    /* Sample Property 1 — Featured, For Sale */
    await prisma.property.create({
      data: {
        title: 'Luxury Sea View Villa in Kalkan',
        description: 'Stunning 4-bedroom villa with panoramic Mediterranean views, infinity pool, and modern architecture. Located in the prestigious Kalkan area with easy access to the beach and local amenities.',
        descriptionTr: 'Panoramik Akdeniz manzaralı, sonsuzluk havuzlu ve modern mimariye sahip muhteşem 4 yatak odalı villa. Prestijli Kalkan bölgesinde, plaja ve yerel olanaklara kolay erişimle konumlanmıştır.',
        descriptionRu: 'Потрясающая вилла с 4 спальнями с панорамным видом на Средиземное море, бассейном-инфинити и современной архитектурой. Расположена в престижном районе Калкан с легким доступом к пляжу.',
        descriptionAr: 'فيلا فاخرة من 4 غرف نوم مع إطلالة بانورامية على البحر الأبيض المتوسط وحوض سباحة لا متناهي وهندسة معمارية حديثة.',
        price: 1500000,
        location: 'Kalkan, Antalya',
        /* Turkish convention: 4+1 means 4 bedrooms + 1 salon */
        bedrooms: 4,
        livingRooms: 1,
        bathrooms: 3,
        area: 350,
        imageIds: [],
        featured: true,
        forSale: true,
      },
    })

    /* Sample Property 2 — Featured, For Sale */
    await prisma.property.create({
      data: {
        title: 'Modern Penthouse in Lara',
        description: 'Exclusive penthouse apartment with 3 bedrooms, private terrace, and breathtaking views of the Antalya coastline. Premium finishes throughout with smart home technology.',
        descriptionTr: '3 yatak odalı, özel teraslı ve Antalya sahil şeridinin nefes kesen manzarasına sahip özel çatı katı dairesi. Akıllı ev teknolojisi ile birlikte premium malzemeler.',
        descriptionRu: 'Эксклюзивный пентхаус с 3 спальнями, частной террасой и захватывающим видом на побережье Анталии. Премиальная отделка с технологией умного дома.',
        descriptionAr: 'شقة بنتهاوس حصرية مع 3 غرف نوم وشرفة خاصة وإطلالات خلابة على ساحل أنطاليا.',
        price: 850000,
        location: 'Lara, Antalya',
        /* Turkish convention: 3+1 means 3 bedrooms + 1 salon */
        bedrooms: 3,
        livingRooms: 1,
        bathrooms: 2,
        area: 220,
        imageIds: [],
        featured: true,
        forSale: true,
      },
    })

    /* Sample Property 3 — Featured, For Sale */
    await prisma.property.create({
      data: {
        title: 'Beachfront Apartment in Konyaaltı',
        description: 'Beautiful 2-bedroom apartment directly on Konyaaltı beach. Fully furnished with high-end appliances, communal pool, and 24/7 security. Perfect for investment or holiday home.',
        descriptionTr: 'Konyaaltı plajında 2 yatak odalı güzel daire. Üst düzey cihazlarla tamamen döşenmiş, ortak havuz ve 7/24 güvenlik. Yatırım veya tatil evi için mükemmel.',
        descriptionRu: 'Красивая квартира с 2 спальнями прямо на пляже Коньяалты. Полностью меблирована с техникой премиум-класса, общий бассейн и круглосуточная охрана.',
        descriptionAr: 'شقة جميلة من غرفتي نوم مباشرة على شاطئ كونيالتي. مفروشة بالكامل مع أجهزة راقية وحوض سباحة مشترك وأمن على مدار الساعة.',
        price: 420000,
        location: 'Konyaaltı, Antalya',
        /* Turkish convention: 2+1 means 2 bedrooms + 1 salon */
        bedrooms: 2,
        livingRooms: 1,
        bathrooms: 1,
        area: 120,
        imageIds: [],
        featured: true,
        forSale: true,
      },
    })

    /* Sample Property 4 — Not Featured, For Rent */
    await prisma.property.create({
      data: {
        title: 'Cozy Villa with Garden in Belek',
        description: 'Charming 3-bedroom villa with a beautiful garden and private pool. Close to world-class golf courses and family-friendly resorts. Available for long-term rent.',
        descriptionTr: 'Güzel bahçe ve özel havuzlu şirin 3 yatak odalı villa. Dünya standartlarında golf sahalarına ve aile dostu tatil köylerine yakın. Uzun dönem kiralık.',
        descriptionRu: 'Очаровательная вилла с 3 спальнями, красивым садом и частным бассейном. Рядом с полями для гольфа мирового класса. Доступна для долгосрочной аренды.',
        descriptionAr: 'فيلا ساحرة من 3 غرف نوم مع حديقة جميلة ومسبح خاص. قريبة من ملاعب الجولف العالمية. متاحة للإيجار طويل الأمد.',
        price: 3500,
        location: 'Belek, Antalya',
        /* Turkish convention: 3+1 means 3 bedrooms + 1 salon */
        bedrooms: 3,
        livingRooms: 1,
        bathrooms: 2,
        area: 200,
        imageIds: [],
        featured: false,
        forSale: false,
      },
    })

    /* Sample Property 5 — Not Featured, For Sale */
    await prisma.property.create({
      data: {
        title: 'Elegant Duplex in Antalya Center',
        description: 'Spacious 5-bedroom duplex in the heart of Antalya. Features marble floors, high ceilings, and a rooftop terrace with city and mountain views. Walking distance to Old Town.',
        descriptionTr: 'Antalya\'nın kalbinde geniş 5 yatak odalı dubleks. Mermer zeminler, yüksek tavanlar ve şehir ile dağ manzaralı çatı terası. Kaleiçi\'ne yürüme mesafesinde.',
        descriptionRu: 'Просторный дуплекс с 5 спальнями в центре Анталии. Мраморные полы, высокие потолки и терраса на крыше с видом на город и горы. В нескольких минутах ходьбы от Старого города.',
        descriptionAr: 'دوبلكس واسع من 5 غرف نوم في قلب أنطاليا. يتميز بأرضيات رخامية وأسقف عالية وشرفة على السطح مع إطلالات على المدينة والجبال.',
        price: 750000,
        location: 'Antalya Center',
        /* Turkish convention: 5+2 means 5 bedrooms + 2 salons (larger duplex) */
        bedrooms: 5,
        livingRooms: 2,
        bathrooms: 3,
        area: 300,
        imageIds: [],
        featured: false,
        forSale: true,
      },
    })

    console.log('✅ 5 sample properties created')
  } else {
    console.log(`ℹ️ ${propertyCount} properties already exist, skipping...`)
  }

  console.log('🌱 Database seed complete!')
}

/* Execute the seed function and handle errors */
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
