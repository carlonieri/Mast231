type IconProps = {
  className?: string;
};

export default function PostThumbCheck({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="38" className="fill-teal" opacity="0.7" />
      <path
        d="M32 50 L45 63 L70 35"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
