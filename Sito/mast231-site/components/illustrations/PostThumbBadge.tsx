type IconProps = {
  className?: string;
};

export default function PostThumbBadge({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 10 C65 10 77 20 77 35 C77 46 71 55 63 60 L63 80 C63 84 60 87 56 87 L44 87 C40 87 37 84 37 80 L37 60 C29 55 23 46 23 35 C23 20 35 10 50 10 Z"
        className="fill-yellow"
        opacity="0.8"
      />
    </svg>
  );
}
