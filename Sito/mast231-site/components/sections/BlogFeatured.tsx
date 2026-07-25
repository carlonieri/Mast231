import type { ReactNode } from "react";

type BlogFeaturedProps = {
  tag: string;
  title: string;
  description: string;
  meta: string;
  image: ReactNode;
};

export default function BlogFeatured({ tag, title, description, meta, image }: BlogFeaturedProps) {
  return (
    <section className="pt-20 pb-10">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="grid grid-cols-1 items-center gap-10 overflow-hidden rounded-xl border border-line bg-white md:grid-cols-2">
          <div className="flex min-h-[280px] items-center justify-center bg-beige">{image}</div>
          <div className="p-10">
            <span className="mb-4 inline-block rounded-full bg-[#FBF0E6] px-3 py-[5px] font-sans text-xs tracking-[0.6px] text-coral uppercase">
              {tag}
            </span>
            <h2 className="mb-3.5 font-serif text-2xl text-charcoal">{title}</h2>
            <p className="mb-5 font-sans text-lg text-charcoal-soft">{description}</p>
            <div className="font-sans text-sm text-charcoal-soft">{meta}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
