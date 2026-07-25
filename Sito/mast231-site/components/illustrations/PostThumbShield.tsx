type IconProps = {
  className?: string;
};

export default function PostThumbShield({ className = "w-[50%] h-auto" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 12 L84 30 L84 60 C84 78 68 90 50 96 C32 90 16 78 16 60 L16 30 Z"
        className="fill-teal"
        opacity="0.7"
      />
    </svg>
  );
}
