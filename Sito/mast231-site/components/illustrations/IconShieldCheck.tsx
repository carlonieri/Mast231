type IconProps = {
  className?: string;
};

/** Icona servizio — scudo con spunta (card home / area D.Lgs. 231/01). */
export default function IconShieldCheck({ className = "h-[50px] w-[50px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M22 4 L36 11 L36 22 C36 30 30 36 22 39 C14 36 8 30 8 22 L8 11 Z"
        className="fill-charcoal"
        opacity="0.12"
      />
      <path
        d="M22 4 L36 11 L36 22 C36 30 30 36 22 39 C14 36 8 30 8 22 L8 11 Z"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="1.5"
      />
      <path
        d="M16 22 L20 27 L29 16"
        fill="none"
        className="stroke-coral"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
