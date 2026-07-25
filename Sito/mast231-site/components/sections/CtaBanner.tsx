import Button from "@/components/ui/Button";

type CtaBannerProps = {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  variant?: "cream" | "beige";
};

export default function CtaBanner({ title, ctaLabel, ctaHref, variant = "cream" }: CtaBannerProps) {
  return (
    <section className={`py-16 text-center sm:py-24 ${variant === "beige" ? "bg-beige" : ""}`}>
      <div className="mx-auto max-w-[1140px] px-10">
        <h2 className="mx-auto mb-8 max-w-[580px] font-serif text-[29px] text-charcoal sm:text-[36px]">
          {title}
        </h2>
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
    </section>
  );
}
