import "dotenv/config";
import { PrismaClient, type GalleryCategory } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Production-safe seed: idempotent, contains NO prices, addresses, contact details or testimonials.
 *  - singleton settings rows
 *  - owner-confirmed amenity list
 *  - the five property spaces + the supplied property photographs (public/photos)
 */

const PHOTOS: { file: string; category: GalleryCategory; alt: string; title: string }[] = [
  { file: "img_3388", category: "LIVING_ROOM", title: "Living room corner", alt: "Living room corner with a black fold-out sofa, red cushions, wall-mounted TV and framed botanical prints" },
  { file: "img_3390", category: "LIVING_ROOM", title: "Living room", alt: "Bright living room with cane sofa and coffee table on a red rug, TV unit and marble floor" },
  { file: "img_3391", category: "LIVING_ROOM", title: "Living and dining area", alt: "Long view of the living area with cane seating, TV wall and polished marble flooring" },
  { file: "img_3382", category: "BEDROOM", title: "Bedroom with balcony door", alt: "Bedroom with an olive green duvet, framed botanical prints and a glass door opening to the balcony" },
  { file: "img_3380", category: "BEDROOM", title: "Bedroom", alt: "Bedroom with a floral bed runner, green cushions, wardrobe and a red patterned rug" },
  { file: "img_3377", category: "BEDROOM", title: "Bedroom with curtains", alt: "Bedroom corner with red and white curtains, jute rug and a set of framed leaf prints" },
  { file: "img_3384", category: "BEDROOM", title: "Bedroom with rug", alt: "Bedroom with a large patterned wool rug, writing desk and bedside lamp" },
  { file: "img_3399", category: "BEDROOM", title: "Single bed room", alt: "Room with a single bed with white linen, brown throw and a bedside cabinet" },
  { file: "img_3378", category: "KITCHEN", title: "Kitchen", alt: "Kitchen with wooden cabinets, gas hob, chimney, microwave oven, refrigerator and a granite breakfast counter" },
  { file: "img_3387", category: "BALCONY", title: "Balcony", alt: "Balcony with potted plants, hanging wind chimes, a folding bistro table and chairs and a cushioned seat" },
  { file: "img_3392", category: "BALCONY", title: "View through the balcony door", alt: "Sliding glass door opening to a balcony with plants and a green hillside beyond" },
  { file: "img_3393", category: "WASHROOM", title: "Washroom", alt: "Washroom with marble-effect wall tiles, a shower and a wall-mounted fitting" },
  { file: "img_3397", category: "WASHROOM", title: "Washroom vanity", alt: "Washroom vanity with a lit mirror, marble-effect counter, basin and a small plant" },
];

const SPACES: { slug: string; name: string; category: GalleryCategory; summary: string; cover: string }[] = [
  { slug: "living-room", name: "Living Room", category: "LIVING_ROOM", summary: "A cozy and inviting space to relax, unwind and spend quality time.", cover: "img_3390" },
  { slug: "bedroom", name: "Bedroom", category: "BEDROOM", summary: "Restful bedrooms with soft linens and natural tones.", cover: "img_3382" },
  { slug: "kitchen", name: "Kitchen", category: "KITCHEN", summary: "A kitchen with the essentials for home-style cooking.", cover: "img_3378" },
  { slug: "balcony", name: "Balcony", category: "BALCONY", summary: "A leafy private balcony to sit back and unwind.", cover: "img_3387" },
  { slug: "washroom", name: "Washroom", category: "WASHROOM", summary: "A clean, bright washroom with a lit vanity mirror.", cover: "img_3397" },
];

/** Amenities confirmed by the owner (from their Airbnb listing). Created enabled; the owner can toggle them in Admin → Amenities. */
const AMENITIES: { name: string; icon: string; description?: string }[] = [
  { name: "WiFi", icon: "Wifi" },
  { name: "Air conditioning", icon: "Snowflake", description: "Split-type ductless system" },
  { name: "Ceiling fan", icon: "Fan" },
  { name: "TV", icon: "Tv" },
  { name: "Refrigerator", icon: "Refrigerator" },
  { name: "Gas cooker", icon: "Flame" },
  { name: "Kitchen essentials", icon: "CookingPot", description: "Pots and pans, oil, salt and pepper; plates, bowls, cups, cutlery and other utensils" },
  { name: "Hot water", icon: "ShowerHead" },
  { name: "Essentials", icon: "Bath", description: "Towels, bed sheets, soap and toilet paper" },
  { name: "Balcony seating", icon: "Armchair" },
  { name: "Mountain view", icon: "Mountain" },
  { name: "Free parking on premises", icon: "Car" },
  { name: "Lift", icon: "MoveVertical" },
  { name: "Washing machine", icon: "WashingMachine" },
  { name: "Iron", icon: "Zap" },
  { name: "Clothes storage", icon: "Shirt" },
  { name: "Hangers", icon: "Shirt" },
  { name: "Bed linen", icon: "BedSingle" },
  { name: "Safe", icon: "Lock" },
  { name: "Body soap", icon: "Droplets" },
  { name: "Board games", icon: "Dices" },
  { name: "First aid kit", icon: "BriefcaseMedical" },
  { name: "Blender", icon: "Blend" },
  { name: "Wine glasses", icon: "Wine" },
  { name: "Long-term stays allowed", icon: "CalendarCheck", description: "Stays of 28 days or more" },
  { name: "Host greets you", icon: "HandHeart" },
];

async function main() {
  // Contact details and location supplied by the owner (Google Maps pin, Instagram, phone, email). Address text is intentionally left for the owner to enter in the admin panel.
  await prisma.propertySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", latitude: 30.09734, longitude: 78.272934, mapsUrl: "https://www.google.com/maps?q=30.0973400,78.2729340",
      instagramUrl: "https://www.instagram.com/aavya.s_home_rishikesh", phone: "+91 92177 48284", contactEmail: "sharmaaavyashikha27@gmail.com" },
  });
  await prisma.pricingSettings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });

  // Gallery images (skip if already present)
  if ((await prisma.galleryImage.count()) === 0) {
    let order = 0;
    for (const p of PHOTOS) {
      await prisma.galleryImage.create({
        data: { url: `/photos/${p.file}.jpg`, altText: p.alt, title: p.title, category: p.category, published: true, featured: order < 6, sortOrder: order++ },
      });
    }
  }
  const images = await prisma.galleryImage.findMany();
  const byFile = (f: string) => images.find((i) => i.url === `/photos/${f}.jpg`);

  if ((await prisma.propertySpace.count()) === 0) {
    let order = 0;
    for (const s of SPACES) {
      const space = await prisma.propertySpace.create({
        data: { slug: s.slug, name: s.name, category: s.category, summary: s.summary, published: true, featured: true, sortOrder: order++, coverImageId: byFile(s.cover)?.id },
      });
      await prisma.galleryImage.updateMany({ where: { category: s.category, spaceId: null }, data: { spaceId: space.id } });
    }
  }

  // Create any missing amenities; never modify ones that already exist (the owner may have changed them in the admin).
  const have = new Set((await prisma.amenity.findMany({ select: { name: true } })).map((a) => a.name));
  let order = await prisma.amenity.count();
  for (const a of AMENITIES) {
    if (!have.has(a.name)) await prisma.amenity.create({ data: { name: a.name, icon: a.icon, description: a.description, enabled: true, sortOrder: order++ } });
  }
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
