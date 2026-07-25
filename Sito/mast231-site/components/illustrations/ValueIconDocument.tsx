type IconProps = {
  className?: string;
};

export default function ValueIconDocument({ className = "mx-auto h-10 w-10" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="8" y="6" width="24" height="28" rx="3" className="fill-coral" opacity="0.85" />
    </svg>
  );
}
