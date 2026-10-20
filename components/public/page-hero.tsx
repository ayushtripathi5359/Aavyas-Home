import { Botanical } from "@/components/ui/icons";

export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-beige/70 bg-cream/50">
      <Botanical className="pointer-events-none absolute -right-2 top-4 h-44 text-olive/25 sm:h-56" />
      <div className="container-page py-14 sm:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-espresso/80">{children}</div>}
      </div>
    </section>
  );
}
