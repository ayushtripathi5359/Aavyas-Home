import { z } from "zod";
import { isValidISODate } from "@/lib/pricing/dates";

export const isoDate = z.string().refine(isValidISODate, "Enter a valid date.");
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const emptyToUndef = (v: unknown) => (v === "" || v === null ? undefined : v);
const optionalUrl = z.preprocess(emptyToUndef, z.url("Enter a valid URL (https://…).").max(500).optional());
const cuid = z.string().min(5).max(40);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number.")
  .refine((v) => v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "Enter a valid phone number.");

export const quoteInputSchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1, "At least 1 guest").max(50),
});

export const enquirySchema = quoteInputSchema.extend({
  guestName: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  phone: phoneSchema,
  specialRequests: optionalText(2000),
  /** Honeypot: real users never fill this. */
  website: z.string().max(0).optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const money = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount like 1500 or 1500.50.");

export const weekdayEnum = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);

export const weeklyRatesSchema = z.object({
  rates: z.array(z.object({ weekday: weekdayEnum, price: z.preprocess(emptyToUndef, money.optional()), active: z.boolean() })).max(7),
});

export const dailyRatesSchema = z.object({
  dates: z.array(isoDate).min(1, "Select at least one date.").max(400),
  action: z.enum(["SET", "CLEAR", "UNAVAILABLE"]),
  price: z.preprocess(emptyToUndef, money.optional()),
  overwrite: z.boolean().default(false),
});

export const overrideSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(2).max(100),
  startDate: isoDate,
  endDate: isoDate,
  price: money,
  active: z.boolean().default(true),
  notes: optionalText(500),
});

export const chargeSchema = z.object({
  id: cuid.optional(),
  type: z.enum(["EXTRA_GUEST", "CLEANING", "SECURITY_DEPOSIT", "TAX", "OTHER"]),
  name: z.string().trim().min(2).max(100),
  amount: money,
  method: z.enum(["FIXED", "PER_NIGHT", "PER_PERSON", "PER_PERSON_PER_NIGHT", "PERCENT_OF_SUBTOTAL"]),
  active: z.boolean().default(true),
  refundable: z.boolean().default(false),
});

export const pricingPolicySchema = z.object({
  includedGuests: z.coerce.number().int().min(1).max(50),
  advancePolicy: optionalText(2000),
  cancellationPolicy: optionalText(2000),
});

export const faqSchema = z.object({
  id: cuid.optional(),
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(2000),
  published: z.boolean().default(true),
});

export const categoryEnum = z.enum(["LIVING_ROOM", "BEDROOM", "KITCHEN", "BALCONY", "WASHROOM", "OTHER"]);
export const CATEGORY_LABELS: Record<z.infer<typeof categoryEnum>, string> = {
  LIVING_ROOM: "Living Room",
  BEDROOM: "Bedroom",
  KITCHEN: "Kitchen",
  BALCONY: "Balcony",
  WASHROOM: "Washroom",
  OTHER: "Other",
};

export const imageMetaSchema = z.object({
  id: cuid,
  title: optionalText(120),
  altText: z.string().trim().min(3, "Alt text is required.").max(300),
  caption: optionalText(300),
  category: categoryEnum,
  spaceId: z.preprocess(emptyToUndef, cuid.optional()),
  featured: z.boolean(),
  published: z.boolean(),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.")
  .max(80);

export const spaceSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  category: categoryEnum,
  summary: optionalText(300),
  description: optionalText(5000),
  occupancy: optionalText(200),
  bedDetails: optionalText(300),
  houseRules: optionalText(2000),
  coverImageId: z.preprocess(emptyToUndef, cuid.optional()),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  amenityIds: z.array(cuid).max(100).default([]),
});

export const AMENITY_ICONS = [
  "Wifi", "Wind", "Fan", "Tv", "Refrigerator", "CookingPot", "Flame", "ShowerHead", "Bath", "Shirt",
  "Armchair", "Sofa", "BedDouble", "Sun", "Trees", "Coffee", "Droplets", "Zap", "ParkingCircle", "Lock", "Check",
  "Mountain", "WashingMachine", "BedSingle", "Dices", "BriefcaseMedical", "Car", "MoveVertical", "CalendarCheck", "HandHeart", "Wine", "Utensils", "Snowflake", "Blend",
] as const;

export const amenitySchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(2).max(80),
  description: optionalText(300),
  icon: z.enum(AMENITY_ICONS),
  enabled: z.boolean().default(false),
});

export const testimonialSchema = z.object({
  id: cuid.optional(),
  guestName: z.string().trim().min(2).max(100),
  body: z.string().trim().min(10).max(1500),
  rating: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(5).optional()),
  approved: z.boolean().default(false),
});

export const settingsSchema = z.object({
  propertyName: z.string().trim().min(2).max(100),
  address: optionalText(500),
  contactEmail: z.preprocess(emptyToUndef, z.string().trim().email().max(200).optional()),
  notifyEmail: z.preprocess(emptyToUndef, z.string().trim().email().max(200).optional()),
  phone: z.preprocess(emptyToUndef, phoneSchema.optional()),
  whatsappNumber: z.preprocess(emptyToUndef, z.string().trim().regex(/^\+?[0-9]{8,15}$/, "Digits only, with country code, e.g. 919876543210.").optional()),
  mapsUrl: optionalUrl,
  latitude: z.preprocess(emptyToUndef, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(emptyToUndef, z.coerce.number().min(-180).max(180).optional()),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  checkInTime: optionalText(40),
  checkOutTime: optionalText(40),
  houseRules: optionalText(3000),
  maxGuests: z.coerce.number().int().min(1).max(50),
});

export const nearbyPlaceSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(2).max(120),
  description: optionalText(300),
  distance: optionalText(60),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  role: z.enum(["SUPER_ADMIN", "PROPERTY_MANAGER"]),
  password: z.string().min(10).max(128),
});

export const enquiryStatusEnum = z.enum(["NEW", "CONTACTED", "CONFIRMED", "CANCELLED", "COMPLETED"]);
