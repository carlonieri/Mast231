export type WhyUsItem = {
  num: string;
  title: string;
  description: string;
};

type WhyUsProps = {
  title: string;
  items: WhyUsItem[];
};

export default function WhyUs({ title, items }: WhyUsProps) {
  return (
    <section className="bg-beige py-16 sm:py-24">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <h2 className="font-serif text-[34px] text-charcoal">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.num}>
              <div className="mb-3.5 font-serif text-[34px] text-coral">{item.num}</div>
              <h3 className="mb-2.5 font-serif text-2xl text-charcoal">{item.title}</h3>
              <p className="font-sans text-lg text-charcoal-soft">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
