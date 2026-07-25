import Image from "next/image";
import Button from "@/components/ui/Button";

type HeroProps = {
  eyebrow: string;
  title: string;
  subHeadline?: string;
  lede: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
  trustIndicators?: string[];
};

export default function Hero({
  eyebrow,
  title,
  subHeadline,
  lede,
  ctaLabel,
  ctaHref,
  trustIndicators,
}: HeroProps) {
  return (
    <section className="bg-beige">
      <div className="flex flex-col gap-10 px-10 py-16 md:flex-row md:items-center md:gap-12 md:py-20 md:pr-0 md:pl-16 lg:pl-24">
        <div className="md:w-[400px] md:flex-shrink-0 lg:w-[440px]">
          <div className="mb-4 font-sans text-sm tracking-[1.6px] text-teal uppercase">{eyebrow}</div>
          <h1 className="mb-5 font-serif text-[32px] leading-[1.25] text-charcoal sm:text-[38px]">
            {title}
          </h1>
          {subHeadline ? (
            <p className="mb-6 font-serif text-[34px] leading-none font-semibold text-coral italic sm:text-[40px]">
              {subHeadline}
            </p>
          ) : null}
          <p className="mb-8 font-sans text-xl text-charcoal-soft [&_strong]:font-semibold [&_strong]:text-charcoal">
            {lede}
          </p>
          <Button href={ctaHref}>{ctaLabel}</Button>
          {trustIndicators && trustIndicators.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-2">
              {trustIndicators.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 font-sans text-sm text-charcoal-soft"
                >
                  <span aria-hidden="true" className="font-semibold text-teal">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative hidden aspect-[10/7] md:block md:flex-1">
          <Image
            src="/images/hero-illustration.png"
            alt="Illustrazione: due persone in coda per la stessa lavatrice, una con un cesto di panni, l'altra con una borsa di denaro"
            fill
            className="object-contain object-right"
            priority
          />
        </div>
      </div>
    </section>
  );
}
