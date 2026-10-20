/**
 * Central photograph configuration.
 *
 * - SLOT_DEFAULTS: which supplied photograph fills each homepage slot when the owner has not chosen one in
 *   Admin → Website content. Change a path here (or pick an image in the CMS) — no component edits needed.
 * - POSITION: per-photograph `object-position`, so crops keep the important subject in frame.
 */
export const SLOT_DEFAULTS = {
  heroMain: "/photos/img_3390.jpg",
  about: "/photos/img_3392.jpg",
  bedroomFeature: "/photos/img_3399.jpg",
  kitchenFeature: "/photos/img_3378.jpg",
  banner: "/photos/img_3387.jpg",
} as const;

export type Slot = keyof typeof SLOT_DEFAULTS;

const POSITION: Record<string, string> = {
  "/photos/img_3388.jpg": "50% 38%",
  "/photos/img_3390.jpg": "50% 50%",
  "/photos/img_3391.jpg": "50% 45%",
  "/photos/img_3392.jpg": "0% 40%",
  "/photos/img_3399.jpg": "50% 50%",
  "/photos/img_3382.jpg": "50% 55%",
  "/photos/img_3380.jpg": "50% 55%",
  "/photos/img_3377.jpg": "50% 45%",
  "/photos/img_3384.jpg": "50% 60%",
  "/photos/img_3378.jpg": "50% 50%",
  "/photos/img_3387.jpg": "50% 58%",
  "/photos/img_3393.jpg": "50% 40%",
  "/photos/img_3397.jpg": "50% 35%",
};

/** Optional zoom (scale about the object-position point) for photographs whose subject sits off-centre. */
const ZOOM: Record<string, number> = {
  "/photos/img_3392.jpg": 1.35,
};

export const zoomFor = (url: string | undefined | null) => (url && ZOOM[url]) || 1;

export const objectPosition = (url: string | undefined | null) => (url && POSITION[url]) || "50% 50%";

/**
 * Amenities page thumbnails. Only amenities that are actually visible in one of the supplied photographs get one;
 * the rest render as text-only cards.
 *   fx / fy  focal point of the item inside the photograph (0-100 %)
 *   ratio    photograph width / height
 *   zoom     magnification applied about the focal point
 */
export interface AmenityPhoto { url: string; fx: number; fy: number; ratio: number; zoom: number }
export const AMENITY_PHOTOS: Record<string, AmenityPhoto> = {
  "tv": { url: "/photos/img_3390.jpg", fx: 38, fy: 44, ratio: 1.333, zoom: 2.2 },
  "ceiling fan": { url: "/photos/img_3390.jpg", fx: 50, fy: 8, ratio: 1.333, zoom: 2.6 },
  "refrigerator": { url: "/photos/img_3378.jpg", fx: 92, fy: 68, ratio: 1.334, zoom: 2.2 },
  "gas cooker": { url: "/photos/img_3378.jpg", fx: 64, fy: 50, ratio: 1.334, zoom: 3.2 },
  "kitchen essentials": { url: "/photos/img_3378.jpg", fx: 55, fy: 55, ratio: 1.334, zoom: 1.4 },
  "balcony seating": { url: "/photos/img_3387.jpg", fx: 57, fy: 66, ratio: 0.611, zoom: 1.9 },
  "mountain view": { url: "/photos/img_3392.jpg", fx: 26, fy: 30, ratio: 0.959, zoom: 2.2 },
};

export const amenityPhoto = (name: string) => AMENITY_PHOTOS[name.trim().toLowerCase()];

/** Box the thumbnail is drawn in (width / height), used to keep the focal point in frame under object-fit: cover. */
const THUMB_RATIO = 1.4;

/** object-position + zoom that keep the item in the thumbnail even when it sits near the photograph's edge. */
export function amenityThumbStyle(p: AmenityPhoto) {
  const axis = (focalPct: number, relRaw: number) => {
    const focal = focalPct;
    const rel = Math.max(1, relRaw);                                   // under object-fit: cover an axis is never smaller than the box
    if (rel === 1) return { pos: 0.5, box: focal };                    // axis fits exactly: focal point keeps its own position
    const pos = Math.min(1, Math.max(0, (focal * rel - 0.5) / (rel - 1)));
    return { pos, box: focal * rel - pos * (rel - 1) };               // focal point in box coordinates
  };
  const x = axis(p.fx / 100, p.ratio / THUMB_RATIO);                  // image width relative to the box
  const y = axis(p.fy / 100, THUMB_RATIO / p.ratio);                  // image height relative to the box
  // Pull the focal point toward the centre of the thumbnail, but never so far that the zoomed photo stops covering the box.
  const shift = (o: number) => {
    const z = p.zoom;
    const lo = 1 - z - o * (1 - z);
    const hi = -o * (1 - z);
    return Math.min(hi, Math.max(lo, 0.5 - o));
  };
  const tx = shift(x.box), ty = shift(y.box);
  return {
    objectPosition: `${(x.pos * 100).toFixed(1)}% ${(y.pos * 100).toFixed(1)}%`,
    transformOrigin: `${(x.box * 100).toFixed(1)}% ${(y.box * 100).toFixed(1)}%`,
    transform: `translate(${(tx * 100).toFixed(1)}%, ${(ty * 100).toFixed(1)}%) scale(${p.zoom})`,
  };
}
