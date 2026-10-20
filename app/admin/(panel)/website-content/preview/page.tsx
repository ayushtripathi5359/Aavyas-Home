import { HomeView } from "@/components/public/home";
import { requirePage } from "@/lib/auth/guards";
import { loadHomeData } from "@/lib/home-data";

export const metadata = { title: "Homepage preview" };

/** Renders the homepage using DRAFT content so staff can review before publishing. */
export default async function Preview() {
  await requirePage("website-content");
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <p className="sticky top-16 z-20 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">Preview — showing draft content. Not live until published.</p>
      <HomeView data={await loadHomeData("draft")} />
    </div>
  );
}
