type IconProps = {
  className?: string;
};

export default function PostThumbSquare({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="18" y="18" width="64" height="64" rx="8" className="fill-yellow" opacity="0.7" />
    </svg>
  );
}
