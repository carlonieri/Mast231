import type { Metadata } from "next";
import Image from "next/image";
import PageHead from "@/components/sections/PageHead";
import TeamGrid from "@/components/sections/TeamGrid";
import ValuesGrid from "@/components/sections/ValuesGrid";
import CtaBanner from "@/components/sections/CtaBanner";
import ValueIconBadge from "@/components/illustrations/ValueIconBadge";
import ValueIconDocument from "@/components/illustrations/ValueIconDocument";
import ValueIconCircle from "@/components/illustrations/ValueIconCircle";
import ValueIconShieldOutline from "@/components/illustrations/ValueIconShieldOutline";

export const metadata: Metadata = {
  title: "Chi siamo",
};

// NOTA: il sito sorgente non riporta nominativi, ruoli o foto reali del team
// (solo la descrizione collettiva usata nella sezione intro qui sotto) — le 3
// card restano quindi con placeholder in attesa dei dati reali, come deciso.
const teamMembers = [
  {
    id: "member-1",
    name: "Lorem Ipsum",
    role: "Lorem ipsum",
    description: "Dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt.",
    tone: "#D8B99A",
  },
  {
    id: "member-2",
    name: "Lorem Ipsum",
    role: "Lorem ipsum",
    description: "Ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrum.",
    tone: "#C9A87F",
  },
  {
    id: "member-3",
    name: "Lorem Ipsum",
    role: "Lorem ipsum",
    description: "Exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi.",
    tone: "#E0C4A0",
  },
];

const values = [
  {
    icon: <ValueIconBadge />,
    title: "Affidabilità",
    description:
      "Il nostro impegno si fonda su competenza e trasparenza, con un aggiornamento costante alle evoluzioni normative.",
  },
  {
    icon: <ValueIconDocument />,
    title: "Competenza multidisciplinare",
    description:
      "Commercialisti, avvocati ed esperti in compliance lavorano insieme per affrontare ogni aspetto della conformità.",
  },
  {
    icon: <ValueIconCircle />,
    title: "Approccio proattivo",
    description:
      "Non aspettiamo le scadenze: anticipiamo le evoluzioni del mercato e della normativa per proteggerti in anticipo.",
  },
  {
    icon: <ValueIconShieldOutline />,
    title: "Soluzioni su misura",
    description: "Ogni intervento è calibrato sulla realtà specifica del cliente, non un pacchetto standard.",
  },
];

export default function ChiSiamoPage() {
  return (
    <>
      <PageHead eyebrow="Il nostro team" title="Chi siamo" />

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-14 px-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[714/998] w-full">
            <Image
              src="/images/chi-siamo-illustration.png"
              alt="Illustrazione: un team al servizio della conformità, rappresentato da tre persone e uno scudo con spunta"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="mb-[22px] font-serif text-[28px] text-charcoal">
              Un team multidisciplinare al servizio della tua conformità
            </h2>
            <p className="mb-4 max-w-[480px] font-sans text-lg text-charcoal-soft">
              Il nostro team riunisce Dottori Commercialisti, Avvocati ed Esperti in Compliance,
              con un approccio multidisciplinare pensato per affrontare scenari normativi
              complessi e in costante evoluzione.
            </p>
            <p className="mb-4 max-w-[480px] font-sans text-lg text-charcoal-soft">
              Lavoriamo come partner strategici, non come semplice fornitore di adempimenti:
              aiutiamo professionisti e imprese a trasformare gli obblighi normativi in un
              vantaggio competitivo, con soluzioni su misura, complete e orientate alle
              specificità di ciascun cliente.
            </p>
          </div>
        </div>
      </section>

      <TeamGrid
        eyebrow="Lorem ipsum"
        title="Lorem ipsum dolor sit amet"
        description="Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam."
        members={teamMembers}
      />

      <ValuesGrid eyebrow="Chi siamo" title="I valori che guidano il nostro lavoro" values={values} />

      <CtaBanner
        title="Vuoi saperne di più su come lavoriamo?"
        ctaLabel="Contattaci"
        ctaHref="/contatti"
        variant="beige"
      />
    </>
  );
}
