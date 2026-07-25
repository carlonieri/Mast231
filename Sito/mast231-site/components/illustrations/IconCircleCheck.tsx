type IconProps = {
  className?: string;
};

/** Icona servizio — cerchio con spunta (card home / area Anticorruzione). */
export default function IconCircleCheck({ className = "h-[50px] w-[50px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="18" className="fill-teal" opacity="0.85" />
      <path
        d="M14 22 L20 28 L32 14"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
