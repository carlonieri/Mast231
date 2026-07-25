type IconProps = {
  className?: string;
};

export default function Logo({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 30 30" aria-hidden="true">
      <path
        d="M15 1 C22 1 28 6 28 14 C28 21 23 28 15 29 C7 28 2 21 2 14 C2 6 8 1 15 1 Z"
        className="fill-coral"
      />
      <path
        d="M15 1 C22 1 28 6 28 14 C28 18 26 22 22 25 C18 20 12 20 8 25 C4 22 2 18 2 14 C2 6 8 1 15 1 Z"
        className="fill-yellow"
        opacity="0.85"
      />
      <path
        d="M8 25 C12 20 18 20 22 25 C19 28 17 29 15 29 C13 29 11 28 8 25 Z"
        className="fill-teal"
      />
    </svg>
  );
}
