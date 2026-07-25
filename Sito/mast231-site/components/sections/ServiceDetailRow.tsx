import type { ReactNode } from "react";

type ServiceDetailRowProps = {
  numTag: string;
  title: string;
  description: ReactNode;
  checklist: string[];
  icon: ReactNode;
  reverse?: boolean;
  alt?: boolean;
};

export default function ServiceDetailRow({
  numTag,
  title,
  description,
  checklist,
  icon,
  reverse = false,
  alt = false,
}: ServiceDetailRowProps) {
  return (
    <section className={`border-b border-line py-[88px] ${alt ? "border-b-0 bg-beige" : ""}`}>
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-14 px-10 md:grid-cols-2">
        <div className={reverse ? "md:order-2" : "md:order-1"}>
          <div className="mb-3.5 font-serif text-[15px] text-coral">{numTag}</div>
          <h2 className="mb-[18px] font-serif text-[27px] text-charcoal">{title}</h2>
          <p className="mb-3.5 max-w-[460px] font-sans text-lg text-charcoal-soft [&_strong]:font-semibold [&_strong]:text-charcoal">
            {description}
          </p>
          <ul className="mt-5 list-none">
            {checklist.map((item) => (
              <li
                key={item}
                className="relative mb-2.5 pl-6 font-sans text-lg text-charcoal-soft before:absolute before:left-0 before:font-semibold before:text-teal before:content-['✓']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={`flex items-center justify-center ${reverse ? "md:order-1" : "md:order-2"}`}>
          {icon}
        </div>
      </div>
    </section>
  );
}
