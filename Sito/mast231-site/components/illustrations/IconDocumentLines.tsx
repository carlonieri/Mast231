type IconProps = {
  className?: string;
};

/** Icona servizio — documento con righe (card home / area Privacy). */
export default function IconDocumentLines({ className = "h-[50px] w-[50px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <rect x="10" y="6" width="24" height="32" rx="3" className="fill-coral" opacity="0.85" />
      <line x1="15" y1="15" x2="29" y2="15" className="stroke-charcoal" strokeWidth="2" />
      <line x1="15" y1="21" x2="29" y2="21" className="stroke-charcoal" strokeWidth="2" />
      <line x1="15" y1="27" x2="23" y2="27" className="stroke-charcoal" strokeWidth="2" />
    </svg>
  );
}
