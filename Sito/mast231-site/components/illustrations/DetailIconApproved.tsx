type IconProps = {
  className?: string;
};

/** Illustrazione di dettaglio — cerchio con spunta (riga servizio 03). */
export default function DetailIconApproved({ className = "h-auto w-full max-w-[280px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="80" className="fill-teal" opacity="0.8" />
      <path
        d="M65 100 L88 123 L138 68"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
