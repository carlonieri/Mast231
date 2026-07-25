type IconProps = {
  className?: string;
};

/** Illustrazione di dettaglio — documento con righe (riga servizio 02). */
export default function DetailIconDocumentLines({ className = "h-auto w-full max-w-[280px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <rect x="45" y="30" width="110" height="140" rx="10" className="fill-coral" opacity="0.8" />
      <line x1="65" y1="65" x2="135" y2="65" className="stroke-charcoal" strokeWidth="4" />
      <line x1="65" y1="88" x2="135" y2="88" className="stroke-charcoal" strokeWidth="4" />
      <line x1="65" y1="111" x2="105" y2="111" className="stroke-charcoal" strokeWidth="4" />
    </svg>
  );
}
