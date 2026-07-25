type PageHeadProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Banner in testa alle pagine interne (Chi siamo, Servizi, Blog, Contatti). */
export default function PageHead({ eyebrow, title, description }: PageHeadProps) {
  return (
    <div className="bg-beige py-16 text-center">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mb-4 font-sans text-sm tracking-[1.6px] text-teal uppercase">{eyebrow}</div>
        <h1 className="mb-4 font-serif text-[30px] text-charcoal sm:text-[36px]">{title}</h1>
        {description ? (
          <p className="mx-auto max-w-[520px] font-sans text-lg text-charcoal-soft">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
