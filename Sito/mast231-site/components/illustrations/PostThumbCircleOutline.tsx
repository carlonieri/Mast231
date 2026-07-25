type IconProps = {
  className?: string;
};

export default function PostThumbCircleOutline({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="38" className="fill-charcoal" opacity="0.15" />
      <circle cx="50" cy="50" r="38" fill="none" className="stroke-charcoal" strokeWidth="2" />
    </svg>
  );
}
