import Button from "@/components/ui/Button";

export type ContactInfoBlock = {
  title: string;
  lines: { text: string; href?: string }[];
};

type ContactFormProps = {
  infoBlocks: ContactInfoBlock[];
  formIntro?: string;
  fieldLabels: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  };
  placeholders: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  };
  submitLabel: string;
};

export default function ContactForm({
  infoBlocks,
  formIntro,
  fieldLabels,
  placeholders,
  submitLabel,
}: ContactFormProps) {
  return (
    <section className="py-[88px]">
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 gap-14 px-10 md:grid-cols-[0.85fr_1.15fr]">
        <div>
          {infoBlocks.map((block) => (
            <div key={block.title} className="mb-8">
              <h3 className="mb-3 font-sans text-sm tracking-[0.8px] text-coral uppercase">
                {block.title}
              </h3>
              {block.lines.map((line) =>
                line.href ? (
                  <a
                    key={line.text}
                    href={line.href}
                    className="mb-1 block font-sans text-lg text-charcoal no-underline"
                  >
                    {line.text}
                  </a>
                ) : (
                  <p key={line.text} className="mb-1 font-sans text-lg text-charcoal">
                    {line.text}
                  </p>
                ),
              )}
            </div>
          ))}
        </div>

        <form className="rounded-xl border border-line bg-white p-10">
          {formIntro ? (
            <p className="mb-6 font-sans text-lg text-charcoal-soft">{formIntro}</p>
          ) : null}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-sans text-sm text-charcoal-soft">
                {fieldLabels.firstName}
              </label>
              <input
                type="text"
                placeholder={placeholders.firstName}
                className="w-full rounded-sm border border-line bg-cream px-3.5 py-3 font-sans text-lg text-charcoal placeholder:text-charcoal-soft"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-sm text-charcoal-soft">
                {fieldLabels.lastName}
              </label>
              <input
                type="text"
                placeholder={placeholders.lastName}
                className="w-full rounded-sm border border-line bg-cream px-3.5 py-3 font-sans text-lg text-charcoal placeholder:text-charcoal-soft"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block font-sans text-sm text-charcoal-soft">
              {fieldLabels.email}
            </label>
            <input
              type="email"
              placeholder={placeholders.email}
              className="w-full rounded-sm border border-line bg-cream px-3.5 py-3 font-sans text-lg text-charcoal placeholder:text-charcoal-soft"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block font-sans text-sm text-charcoal-soft">
              {fieldLabels.message}
            </label>
            <textarea
              placeholder={placeholders.message}
              className="min-h-[110px] w-full resize-y rounded-sm border border-line bg-cream px-3.5 py-3 font-sans text-lg text-charcoal placeholder:text-charcoal-soft"
            />
          </div>
          <Button type="submit">{submitLabel}</Button>
        </form>
      </div>
    </section>
  );
}
