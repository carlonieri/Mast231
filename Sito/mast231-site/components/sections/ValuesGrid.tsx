import type { ReactNode } from "react";

export type ValueItem = {
  icon: ReactNode;
  title: string;
  description: string;
};

type ValuesGridProps = {
  eyebrow: string;
  title: string;
  values: ValueItem[];
};

export default function ValuesGrid({ eyebrow, title, values }: ValuesGridProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <div className="mb-4 font-sans text-sm tracking-[1.6px] text-teal uppercase">{eyebrow}</div>
          <h2 className="font-serif text-[30px] text-charcoal">{title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-7 text-center lg:grid-cols-4">
          {values.map((value) => (
            <div key={value.title}>
              <div className="mb-[18px]">{value.icon}</div>
              <h3 className="mb-2.5 font-serif text-2xl text-charcoal">{value.title}</h3>
              <p className="font-sans text-lg text-charcoal-soft">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
