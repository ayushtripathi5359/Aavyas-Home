import "server-only";
import { revalidateTag, unstable_cache, updateTag } from "next/cache";

/** All cached public content shares one tag so any admin edit can refresh it in one call. */
export const SITE_TAG = "site";

/**
 * Caches a database read for public pages (5 minutes, or until an admin edit busts it).
 * Skipped in development so local edits and the test-suite always see fresh data.
 * Note: results are JSON-serialised by the cache, so Dates and Decimals come back as strings.
 */
export function cachedQuery<A extends unknown[], R>(keyParts: string[], fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  if (process.env.NODE_ENV !== "production") return fn;
  return unstable_cache(fn, keyParts, { tags: [SITE_TAG], revalidate: 300 }) as (...args: A) => Promise<R>;
}

/** Immediately expire cached public content. Call from Server Actions after any content change. */
export const bustSiteCache = () => updateTag(SITE_TAG);

/** Same, for Route Handlers (which cannot use updateTag). */
export const bustSiteCacheFromRoute = () => revalidateTag(SITE_TAG, "max");
