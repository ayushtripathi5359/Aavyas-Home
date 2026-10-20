/**
 * Hand-painted watercolour washes for the About photograph. Pure SVG: turbulence-displaced shapes give genuinely
 * irregular edges, and a fine paper-grain alpha gives the pigment a granulated, translucent finish.
 * Palette: pale sand #E8D2B8, soft peach #E7C4A6, pale terracotta #D9A07E.
 */

function Defs({ id, scale, seed, blur }: { id: string; scale: number; seed: number; blur: number }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.028" numOctaves="4" seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={blur} result="b" />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed + 3} result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 0.25" result="ga" />
      <feComposite in="b" in2="ga" operator="in" />
    </filter>
  );
}

/** Pigment halo behind the photograph, visible where its edges dissolve. */
export function WatercolorUnder() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 800 420" preserveAspectRatio="none">
      <defs>
        <Defs id="wc-u1" scale={92} seed={21} blur={3} />
        <Defs id="wc-u2" scale={70} seed={34} blur={2.2} />
      </defs>
      <rect x="-100" y="26" width="846" height="368" fill="#E7C4A6" fillOpacity="0.5" filter="url(#wc-u1)" />
      <rect x="-100" y="34" width="822" height="352" fill="#E8D2B8" fillOpacity="0.7" filter="url(#wc-u2)" />
    </svg>
  );
}

/** A few translucent washes and dry-brush strokes bleeding past the photograph's right edge. */
export function WatercolorOver() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-y-0 left-0 hidden h-full w-[112%] overflow-visible lg:block" viewBox="0 0 900 420" preserveAspectRatio="none">
      <defs>
        <Defs id="wc-o1" scale={58} seed={7} blur={2.4} />
        <Defs id="wc-o2" scale={44} seed={15} blur={1.6} />
      </defs>
      <ellipse cx="748" cy="205" rx="58" ry="226" fill="#E8D2B8" fillOpacity="0.4" filter="url(#wc-o1)" />
      <ellipse cx="772" cy="338" rx="52" ry="78" fill="#E7C4A6" fillOpacity="0.34" filter="url(#wc-o1)" />
      <ellipse cx="736" cy="58" rx="42" ry="56" fill="#D9A07E" fillOpacity="0.2" filter="url(#wc-o1)" />
      <g fill="none" stroke="#E8D2B8" strokeLinecap="round" filter="url(#wc-o2)">
        <path d="M708 92 C 740 88 770 96 792 90" strokeWidth="3" strokeOpacity="0.5" />
        <path d="M714 168 C 748 176 776 164 800 170" strokeWidth="2" strokeOpacity="0.45" />
        <path d="M706 250 C 742 244 774 254 796 246" strokeWidth="3.5" strokeOpacity="0.4" />
        <path d="M712 318 C 744 326 772 316 790 322" strokeWidth="2" strokeOpacity="0.5" />
        <path d="M720 380 C 748 374 770 384 786 378" strokeWidth="3" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}
