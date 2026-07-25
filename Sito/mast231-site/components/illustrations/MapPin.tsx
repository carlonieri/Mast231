type IconProps = {
  className?: string;
};

export default function MapPin({ className = "h-20 w-20" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      <path
        d="M40 6 C56 6 68 18 68 32 C68 52 40 74 40 74 C40 74 12 52 12 32 C12 18 24 6 40 6 Z"
        className="fill-charcoal"
        opacity="0.2"
      />
      <circle cx="40" cy="32" r="12" className="fill-charcoal" opacity="0.4" />
    </svg>
  );
}
