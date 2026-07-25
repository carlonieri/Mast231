type AvatarProps = {
  className?: string;
  tone?: string;
};

/** Silhouette persona — usata come avatar placeholder nel team grid. */
export default function Avatar({ className = "mx-auto h-16 w-16", tone = "#D8B99A" }: AvatarProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill={tone} />
      <circle cx="32" cy="26" r="12" className="fill-charcoal" opacity="0.85" />
      <path
        d="M12 58 C12 44 20 38 32 38 C44 38 52 44 52 58"
        className="fill-charcoal"
        opacity="0.85"
      />
    </svg>
  );
}
