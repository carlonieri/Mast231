type IconProps = {
  className?: string;
};

export default function ValueIconShieldOutline({ className = "mx-auto h-10 w-10" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 4 L36 12 L36 22 C36 30 29 36 20 38 C11 36 4 30 4 22 L4 12 Z"
        className="fill-charcoal"
        opacity="0.15"
      />
      <path
        d="M20 4 L36 12 L36 22 C36 30 29 36 20 38 C11 36 4 30 4 22 L4 12 Z"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="1.5"
      />
    </svg>
  );
}
