import {
  Mountain, WashingMachine, BedSingle, Dices, BriefcaseMedical, Car, MoveVertical, CalendarCheck, HandHeart, Wine, Utensils, Snowflake, Blend,
  Armchair, Bath, BedDouble, Check, Coffee, CookingPot, Droplets, Fan, Flame, ParkingCircle, Refrigerator,
  ShowerHead, Sofa, Sun, Trees, Tv, Wifi, Wind, Zap, Lock, Shirt, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Mountain, WashingMachine, BedSingle, Dices, BriefcaseMedical, Car, MoveVertical, CalendarCheck, HandHeart, Wine, Utensils, Snowflake, Blend,
  Armchair, Bath, BedDouble, Check, Coffee, CookingPot, Droplets, Fan, Flame, ParkingCircle, Refrigerator,
  ShowerHead, Sofa, Sun, Trees, Tv, Wifi, Wind, Zap, Lock, Shirt,
};

export function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Check;
  return <Icon className={className} aria-hidden="true" />;
}

/** Subtle botanical line illustration used as decoration. */
export function Botanical({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M60 155C60 110 58 70 62 15" />
      <path d="M61 120c-18-4-30-16-34-32 18 0 31 10 34 32Z" />
      <path d="M61 98c16-4 28-14 32-30-17-1-29 9-32 30Z" />
      <path d="M62 72c-14-3-24-12-27-26 15 0 25 8 27 26Z" />
      <path d="M62 52c12-3 20-11 23-22-13 0-21 7-23 22Z" />
      <path d="M62 15c-5 8-5 16 0 24 5-8 5-16 0-24Z" />
    </svg>
  );
}
