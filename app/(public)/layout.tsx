import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/site";

// Content is edited by staff at any time; render per request so published changes appear immediately.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, footer] = await Promise.all([getSettings(), getContent("footer")]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header name={settings?.propertyName ?? "Aavya’s Home"} airbnbUrl={settings?.airbnbUrl} />
      <main id="main">{children}</main>
      <Footer settings={settings} description={footer.description} airbnbUrl={settings?.airbnbUrl} />
    </>
  );
}
