import type { ReactNode } from "react";

export type ServiceCardItem = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
};

type ServicesCardsProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: ServiceCardItem[];
};

export default function ServicesCards({ eyebrow, title, description, cards }: ServicesCardsProps) {
  const gridCols = cards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <div className="mb-4 font-sans text-sm tracking-[1.6px] text-teal uppercase">{eyebrow}</div>
          <h2 className="mb-4 font-serif text-[30px] text-charcoal">{title}</h2>
          <p className="font-sans text-lg text-charcoal-soft">{description}</p>
        </div>
        <div className={`grid grid-cols-1 gap-7 sm:grid-cols-2 ${gridCols}`}>
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-line bg-white p-9 px-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-5">{card.icon}</div>
              <h3 className="mb-3 font-serif text-2xl text-charcoal">{card.title}</h3>
              <p className="font-sans text-lg text-charcoal-soft [&_strong]:font-semibold [&_strong]:text-charcoal">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
