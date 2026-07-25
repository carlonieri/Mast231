import Link from "next/link";

const serviceLinks = ["Antiriciclaggio", "Privacy", "Anticorruzione", "D.Lgs. 231/01"];
const contactLinks = ["Lorem ipsum", "Lorem ipsum"];

export default function Footer() {
  return (
    <footer className="bg-charcoal py-14 pb-7 text-cream">
      <div className="mx-auto max-w-[1140px] px-10">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold tracking-[0.8px] text-coral uppercase">
              Mast 231
            </h4>
            <p className="max-w-[220px] font-sans text-lg text-[#C9C0B2]">
              Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold tracking-[0.8px] text-coral uppercase">
              Servizi
            </h4>
            {serviceLinks.map((label) => (
              <Link
                key={label}
                href="/servizi"
                className="mb-2 block font-sans text-lg text-[#C9C0B2] hover:text-cream"
              >
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold tracking-[0.8px] text-coral uppercase">
              Azienda
            </h4>
            <Link
              href="/chi-siamo"
              className="mb-2 block font-sans text-lg text-[#C9C0B2] hover:text-cream"
            >
              Chi siamo
            </Link>
            <Link
              href="/blog"
              className="mb-2 block font-sans text-lg text-[#C9C0B2] hover:text-cream"
            >
              Blog
            </Link>
            <Link
              href="/contatti"
              className="mb-2 block font-sans text-lg text-[#C9C0B2] hover:text-cream"
            >
              Contatti
            </Link>
          </div>
          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold tracking-[0.8px] text-coral uppercase">
              Contatti
            </h4>
            {contactLinks.map((label, index) => (
              <Link
                key={`${label}-${index}`}
                href="/contatti"
                className="mb-2 block font-sans text-lg text-[#C9C0B2] hover:text-cream"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[#453F38] pt-[22px] font-sans text-base text-[#9B9186] sm:flex-row sm:justify-between">
          <span>© 2026 Mast Srls</span>
          <span>Lorem ipsum · Lorem ipsum · Lorem ipsum</span>
        </div>
      </div>
    </footer>
  );
}
