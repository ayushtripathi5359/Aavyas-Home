import "server-only";
import { prisma } from "@/lib/db/prisma";

export type FieldType = "text" | "textarea" | "image";
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  default: string;
  help?: string;
}
export interface ContentGroup {
  key: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

/**
 * Registry of every editable CMS block. Defaults are neutral brand copy; owner-specific facts
 * (address, prices, contact details) are never defaulted here — they live in settings tables.
 */
export const CONTENT_GROUPS: ContentGroup[] = [
  {
    key: "home-hero",
    label: "Homepage hero",
    description: "The first thing visitors see. Wrap text in *asterisks* to colour it terracotta; use | for a line break.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", default: "BOUTIQUE HOMESTAY" },
      { name: "headline", label: "Headline", type: "text", default: "A little space|to feel *at home.*" },
      { name: "description", label: "Description", type: "textarea", default: "A calm, cozy and thoughtfully designed homestay for modern travelers, families and working professionals." },
      { name: "highlights", label: "Feature highlights (one per line)", type: "textarea", default: "Peaceful Location\nCozy & Modern Interiors\nFully Equipped Kitchen\nPrivate Balcony\nWiFi", help: "Only list facilities you have confirmed." },
      { name: "caption", label: "Handwritten caption on the photo", type: "text", default: "Simple Stays, Meaningful Moments" },
      { name: "image", label: "Main hero image", type: "image", default: "" },
    ],
  },
  {
    key: "home-about",
    label: "About section",
    description: "“More than just a stay”.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", default: "ABOUT AAVYA’S HOME" },
      { name: "heading", label: "Heading", type: "text", default: "More than just a stay,|it’s a *feeling.*" },
      { name: "body", label: "Body", type: "textarea", default: "A fully furnished, cozy and thoughtfully designed home perfect for short or long stays. Whether you’re here for work, a getaway, or to simply relax, Aavya’s Home offers a clean, peaceful and comfortable space that feels like home." },
      { name: "cta", label: "Button label", type: "text", default: "Explore The Space" },
      { name: "benefits", label: "Benefit card (one per line)", type: "textarea", default: "Clean Spaces\nThoughtful Details\nComfortable Stays\nFeels Like Home" },
      { name: "image", label: "Image", type: "image", default: "" },
    ],
  },
  {
    key: "home-sections",
    label: "Homepage section copy",
    description: "Headings and text for spaces, bedroom, amenities, location and guests. Use | for a line break and *asterisks* for terracotta.",
    fields: [
      { name: "spacesEyebrow", label: "Spaces eyebrow", type: "text", default: "OUR SPACES" },
      { name: "spacesHeading", label: "Spaces heading", type: "text", default: "Explore Our Spaces" },
      { name: "bedroomEyebrow", label: "Bedroom eyebrow", type: "text", default: "THE BEDROOM" },
      { name: "bedroomHeading", label: "Bedroom heading", type: "text", default: "A Restful|Night\u2019s *Sleep.*" },
      { name: "bedroomBody", label: "Bedroom text", type: "textarea", default: "A cozy and peaceful bedroom with a comfortable bed, minimal setup, soft lighting and thoughtful details, it\u2019s the perfect place to relax after a long day.", help: "Beds, occupancy, air conditioning \u2014 only confirmed details." },
      { name: "bedroomCta", label: "Bedroom button", type: "text", default: "View Bedroom Photos" },
      { name: "amenitiesEyebrow", label: "Amenities eyebrow", type: "text", default: "AMENITIES" },
      { name: "amenitiesHeading", label: "Amenities heading", type: "text", default: "Everything You Need|for a Comfortable Stay" },
      { name: "amenitiesSubtitle", label: "Amenities subtitle", type: "text", default: "Enjoy a relaxed and hassle-free stay with essential amenities for your comfort." },
      { name: "locationEyebrow", label: "Location eyebrow", type: "text", default: "LOCATION" },
      { name: "locationHeading", label: "Location heading", type: "text", default: "Peaceful Surroundings,|*Easy Access.*" },
      { name: "locationBody", label: "Location text", type: "textarea", default: "Find your way to Aavya\u2019s Home and explore what\u2019s nearby." },
      { name: "testimonialsEyebrow", label: "Guests eyebrow", type: "text", default: "TESTIMONIALS" },
      { name: "testimonialsHeading", label: "Guests heading", type: "text", default: "What Our Guests Say" },
      { name: "testimonialsEmpty", label: "Text shown when there are no approved testimonials", type: "textarea", default: "We would love to host you. Send an enquiry and plan your stay with us." },
    ],
  },
  {
    key: "booking-cta",
    label: "Booking call-to-action",
    description: "The closing banner on the homepage.",
    fields: [
      { name: "heading", label: "Heading", type: "text", default: "Ready for a Comfortable Stay?" },
      { name: "body", label: "Body", type: "textarea", default: "Book your stay now and experience a peaceful, cozy and well-equipped home." },
      { name: "image", label: "Background image", type: "image", default: "" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    description: "Brand description in the footer.",
    fields: [
      { name: "description", label: "Brand description", type: "textarea", default: "A boutique homestay for modern travelers. A calm space to relax, recharge and feel at home." },
    ],
  },
  {
    key: "seo",
    label: "SEO metadata",
    description: "Default title, description and share image.",
    fields: [
      { name: "title", label: "Site title", type: "text", default: "Aavya’s Home — A little space to feel at home" },
      { name: "description", label: "Meta description", type: "textarea", default: "A calm, cozy and thoughtfully designed homestay for your everyday escape." },
      { name: "ogImage", label: "Share image", type: "image", default: "" },
    ],
  },
  {
    key: "page-space",
    label: "The Space page",
    description: "Copy for /the-space.",
    fields: [
      { name: "heading", label: "Heading", type: "text", default: "The Space" },
      { name: "body", label: "Body", type: "textarea", default: "A calm, cozy and thoughtfully designed homestay for your everyday escape." },
    ],
  },
  {
    key: "page-pricing",
    label: "Pricing page copy",
    description: "Hero and explanation on /pricing.",
    fields: [
      { name: "heading", label: "Heading", type: "text", default: "Pricing" },
      { name: "body", label: "Intro", type: "textarea", default: "Choose your dates to see a night-by-night estimate. This is an enquiry estimate, not a confirmed booking." },
      { name: "notes", label: "Pricing notes", type: "textarea", default: "" },
    ],
  },
];

export const GROUP_BY_KEY = Object.fromEntries(CONTENT_GROUPS.map((g) => [g.key, g]));

export type ContentValues = Record<string, string>;

export function withDefaults(key: string, stored: unknown): ContentValues {
  const group = GROUP_BY_KEY[key];
  const obj = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  return Object.fromEntries(
    group.fields.map((f) => [f.name, typeof obj[f.name] === "string" ? (obj[f.name] as string) : f.default]),
  );
}

/** Published content (public site). */
export async function getContent(key: string): Promise<ContentValues> {
  const row = await prisma.websiteContent.findUnique({ where: { key } });
  return withDefaults(key, row?.published);
}

/** Draft if one exists, else published (admin editor and preview). */
export async function getDraftContent(key: string): Promise<{ values: ContentValues; hasDraft: boolean }> {
  const row = await prisma.websiteContent.findUnique({ where: { key } });
  return { values: withDefaults(key, row?.draft ?? row?.published), hasDraft: !!row?.draft };
}

export async function getAllContent(mode: "published" | "draft"): Promise<Record<string, ContentValues>> {
  const rows = await prisma.websiteContent.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return Object.fromEntries(
    CONTENT_GROUPS.map((g) => {
      const r = byKey.get(g.key);
      return [g.key, withDefaults(g.key, mode === "draft" ? (r?.draft ?? r?.published) : r?.published)];
    }),
  );
}
