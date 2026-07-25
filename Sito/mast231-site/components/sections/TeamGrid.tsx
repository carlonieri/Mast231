import Avatar from "@/components/illustrations/Avatar";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  description: string;
  tone?: string;
};

type TeamGridProps = {
  eyebrow: string;
  title: string;
  description: string;
  members: TeamMember[];
};

export default function TeamGrid({ eyebrow, title, description, members }: TeamGridProps) {
  return (
    <section className="bg-beige py-16 sm:py-24">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <div className="mb-4 font-sans text-sm tracking-[1.6px] text-teal uppercase">{eyebrow}</div>
          <h2 className="mb-4 font-serif text-[30px] text-charcoal">{title}</h2>
          <p className="font-sans text-lg text-charcoal-soft">{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-line bg-white p-7 text-center"
            >
              <Avatar tone={member.tone} className="mx-auto mb-[18px] h-16 w-16" />
              <h3 className="mb-1 font-serif text-2xl text-charcoal">{member.name}</h3>
              <div className="mb-3.5 font-sans text-sm tracking-[0.5px] text-coral uppercase">
                {member.role}
              </div>
              <p className="font-sans text-lg text-charcoal-soft">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
