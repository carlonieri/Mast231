type IconProps = {
  className?: string;
};

export default function ValueIconBadge({ className = "mx-auto h-10 w-10" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 3 C29 3 35 9 35 16 C35 24 29 32 20 36 C11 32 5 24 5 16 C5 9 11 3 20 3 Z"
        className="fill-yellow"
        opacity="0.9"
      />
    </svg>
  );
}
