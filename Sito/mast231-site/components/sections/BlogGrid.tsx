import type { ReactNode } from "react";

export type BlogPostItem = {
  thumb: ReactNode;
  tag: string;
  title: string;
  description: string;
  meta: string;
};

type BlogGridProps = {
  posts: BlogPostItem[];
};

export default function BlogGrid({ posts }: BlogGridProps) {
  const lgCols = Math.min(posts.length, 3);
  const lgGridClass = lgCols === 1 ? "lg:grid-cols-1" : lgCols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <section className="pt-10 pb-24">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className={`grid grid-cols-1 gap-7 sm:grid-cols-2 ${lgGridClass}`}>
          {posts.map((post) => (
            <div key={post.title} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="flex h-[150px] items-center justify-center bg-beige">{post.thumb}</div>
              <div className="p-6">
                <span className="mb-3 inline-block rounded-full bg-[#FBF0E6] px-3 py-[5px] font-sans text-xs tracking-[0.6px] text-coral uppercase">
                  {post.tag}
                </span>
                <h3 className="mb-2.5 font-serif text-2xl leading-[1.4] text-charcoal">
                  {post.title}
                </h3>
                <p className="mb-3.5 font-sans text-lg text-charcoal-soft">{post.description}</p>
                <div className="font-sans text-sm text-charcoal-soft">{post.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
