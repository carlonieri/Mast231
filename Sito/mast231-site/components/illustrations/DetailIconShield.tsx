type IconProps = {
  className?: string;
};

/** Illustrazione di dettaglio — scudo con spunta (riga servizio 04). */
export default function DetailIconShield({ className = "h-auto w-full max-w-[280px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <path
        d="M100 20 L165 50 L165 100 C165 135 138 160 100 172 C62 160 35 135 35 100 L35 50 Z"
        className="fill-charcoal"
        opacity="0.12"
      />
      <path
        d="M100 20 L165 50 L165 100 C165 135 138 160 100 172 C62 160 35 135 35 100 L35 50 Z"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="3"
      />
      <path
        d="M75 100 L92 117 L128 78"
        fill="none"
        className="stroke-coral"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
