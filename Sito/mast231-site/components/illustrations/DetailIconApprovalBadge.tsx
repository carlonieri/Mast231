type IconProps = {
  className?: string;
};

/** Illustrazione di dettaglio — badge di approvazione (riga servizio 01). */
export default function DetailIconApprovalBadge({ className = "h-auto w-full max-w-[280px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <path
        d="M100 20 C130 20 155 42 155 68 C155 90 145 108 130 118 L130 155 C130 163 124 169 116 169 L84 169 C76 169 70 163 70 155 L70 118 C55 108 45 90 45 68 C45 42 70 20 100 20 Z"
        className="fill-yellow"
        opacity="0.85"
      />
      <path
        d="M78 88 L94 104 L124 68"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
