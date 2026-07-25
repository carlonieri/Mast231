import Button from "@/components/ui/Button";

type BlogNewsletterProps = {
  title: string;
  description: string;
  placeholder: string;
  ctaLabel: string;
};

export default function BlogNewsletter({ title, description, placeholder, ctaLabel }: BlogNewsletterProps) {
  return (
    <section className="bg-beige py-20 text-center">
      <div className="mx-auto max-w-[1140px] px-10">
        <h2 className="mb-3.5 font-serif text-[28px] text-charcoal">{title}</h2>
        <p className="mb-7 font-sans text-lg text-charcoal-soft">{description}</p>
        <form className="mx-auto flex max-w-[420px] gap-3">
          <input
            type="email"
            placeholder={placeholder}
            className="flex-1 rounded-sm border border-line bg-white px-4 py-[13px] font-sans text-lg text-charcoal placeholder:text-charcoal-soft"
          />
          <Button type="submit">{ctaLabel}</Button>
        </form>
      </div>
    </section>
  );
}
