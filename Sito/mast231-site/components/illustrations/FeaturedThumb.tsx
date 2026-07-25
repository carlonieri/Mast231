type IconProps = {
  className?: string;
};

/** Illustrazione — copertina articolo in evidenza (blog). */
export default function FeaturedThumb({ className = "w-[70%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 160 160" aria-hidden="true">
      <rect x="30" y="20" width="100" height="120" rx="6" className="fill-coral" opacity="0.7" />
      <line x1="45" y1="50" x2="115" y2="50" className="stroke-charcoal" strokeWidth="3" />
      <line x1="45" y1="66" x2="115" y2="66" className="stroke-charcoal" strokeWidth="3" />
      <line x1="45" y1="82" x2="90" y2="82" className="stroke-charcoal" strokeWidth="3" />
    </svg>
  );
}
