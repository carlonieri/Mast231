type IconProps = {
  className?: string;
};

/** Icona servizio — badge di approvazione (card home / area Antiriciclaggio). */
export default function IconApprovalBadge({ className = "h-[50px] w-[50px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M22 3 C31 3 38 9 38 17 C38 26 31 35 22 39 C13 35 6 26 6 17 C6 9 13 3 22 3 Z"
        className="fill-yellow"
        opacity="0.9"
      />
      <path
        d="M15 21 L20 26 L30 14"
        fill="none"
        className="stroke-charcoal"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
