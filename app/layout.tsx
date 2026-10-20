import type { Metadata } from "next";
import { Caveat, DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans-body", display: "swap" });
const script = Caveat({ subsets: ["latin"], variable: "--nf-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Aavya’s Home — A little space to feel at home", template: "%s · Aavya’s Home" },
  description: "A calm, cozy and thoughtfully designed homestay for your everyday escape.",
  openGraph: { siteName: "Aavya’s Home", type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
