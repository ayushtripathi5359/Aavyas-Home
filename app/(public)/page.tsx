import type { Metadata } from "next";
import { HomeView } from "@/components/public/home";
import { loadHomeData } from "@/lib/home-data";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: "/" },
    openGraph: { title: seo.title, description: seo.description, url: "/", images: seo.ogImage ? [seo.ogImage] : undefined },
  };
}

export default async function HomePage() {
  return <HomeView data={await loadHomeData()} />;
}
