import type { Amenity, GalleryImage, NearbyPlace, PropertySettings, PropertySpace, Testimonial } from "@prisma/client";
import type { ContentValues } from "@/lib/content";
import { SLOT_DEFAULTS } from "@/lib/photo-config";
import { HeroSection } from "./home/hero-section";
import { AboutSection } from "./home/about-section";
import { SpacesGallery } from "./home/spaces-gallery";
import { BedroomFeature } from "./home/feature-sections";
import { AmenitiesSection } from "./home/amenities-section";
import { LocationSection } from "./home/location-section";
import { TestimonialsSection } from "./home/testimonials-section";
import { BookingBanner } from "./home/booking-banner";
import type { PhotoRef } from "./home/photo";

export type HomeSpace = PropertySpace & { images: GalleryImage[] };

export interface HomeData {
  content: Record<string, ContentValues>;
  settings: PropertySettings | null;
  spaces: HomeSpace[];
  images: GalleryImage[];
  amenities: Amenity[];
  testimonials: Testimonial[];
  places: NearbyPlace[];
}

/**
 * Photo resolution order: CMS choice → first published gallery image of the category → configured default
 * (lib/photo-config.ts). Alt text comes from the matching gallery record when one exists.
 */
function resolve(chosen: string | undefined, images: GalleryImage[], fallbackUrl: string, fallbackAlt: string): PhotoRef {
  const url = chosen || fallbackUrl;
  const match = images.find((i) => i.url === url);
  return { url, altText: match?.altText ?? fallbackAlt };
}

export function HomeView({ data }: { data: HomeData }) {
  const { content, settings, spaces, images, amenities, testimonials, places } = data;
  const hero = content["home-hero"], about = content["home-about"], sec = content["home-sections"], cta = content["booking-cta"];
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const bedroom = spaces.find((s) => s.category === "BEDROOM");

  const cards = spaces.map((s) => {
    const cover = images.find((i) => i.id === s.coverImageId) ?? s.images[0] ?? null;
    return { slug: s.slug, name: s.name, summary: s.summary, image: cover ? { url: cover.url, altText: cover.altText } : null };
  });

  return (
    <>
      <HeroSection content={hero} maxGuests={settings?.maxGuests ?? 6} airbnbUrl={settings?.airbnbUrl}
        image={resolve(hero.image, images, SLOT_DEFAULTS.heroMain, "Cozy living room with a sofa, coffee table and framed wall art")} />
      <AboutSection content={about} image={resolve(about.image, images, SLOT_DEFAULTS.about, "Balcony door opening to plants and greenery")} />
      <SpacesGallery eyebrow={sec.spacesEyebrow} heading={sec.spacesHeading} spaces={cards} />
      <BedroomFeature eyebrow={sec.bedroomEyebrow} heading={sec.bedroomHeading} body={sec.bedroomBody} cta={sec.bedroomCta}
        details={[bedroom?.bedDetails && `Beds: ${bedroom.bedDetails}`, bedroom?.occupancy && `Occupancy: ${bedroom.occupancy}`].filter(Boolean) as string[]}
        image={resolve(undefined, images, SLOT_DEFAULTS.bedroomFeature, "Bedroom with a single bed, white linen and a brown throw")} />
      <AmenitiesSection eyebrow={sec.amenitiesEyebrow} heading={sec.amenitiesHeading} subtitle={sec.amenitiesSubtitle} amenities={amenities} />
      <LocationSection eyebrow={sec.locationEyebrow} heading={sec.locationHeading} body={sec.locationBody} settings={settings} places={places} />
      <TestimonialsSection airbnbUrl={settings?.airbnbUrl} eyebrow={sec.testimonialsEyebrow} heading={sec.testimonialsHeading} empty={sec.testimonialsEmpty} testimonials={testimonials} />
      <BookingBanner airbnbUrl={settings?.airbnbUrl} name={settings?.propertyName ?? "Aavya’s Home"} heading={cta.heading} body={cta.body}
        image={resolve(cta.image, images, SLOT_DEFAULTS.banner, "Balcony with plants and hanging lanterns")} />
    </>
  );
}
