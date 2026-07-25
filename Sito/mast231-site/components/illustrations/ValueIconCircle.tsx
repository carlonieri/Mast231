type IconProps = {
  className?: string;
};

export default function ValueIconCircle({ className = "mx-auto h-10 w-10" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="16" className="fill-teal" opacity="0.85" />
    </svg>
  );
}
