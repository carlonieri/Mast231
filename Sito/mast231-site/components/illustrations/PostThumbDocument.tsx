type IconProps = {
  className?: string;
};

export default function PostThumbDocument({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="20" y="15" width="60" height="70" rx="4" className="fill-coral" opacity="0.7" />
      <line x1="32" y1="35" x2="68" y2="35" className="stroke-charcoal" strokeWidth="3" />
      <line x1="32" y1="48" x2="68" y2="48" className="stroke-charcoal" strokeWidth="3" />
      <line x1="32" y1="61" x2="52" y2="61" className="stroke-charcoal" strokeWidth="3" />
    </svg>
  );
}
