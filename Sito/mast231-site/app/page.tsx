import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import ServicesCards from "@/components/sections/ServicesCards";
import WhyUs from "@/components/sections/WhyUs";
import CtaBanner from "@/components/sections/CtaBanner";
import IconApprovalBadge from "@/components/illustrations/IconApprovalBadge";
import IconDocumentLines from "@/components/illustrations/IconDocumentLines";
import IconCircleCheck from "@/components/illustrations/IconCircleCheck";
import IconShieldCheck from "@/components/illustrations/IconShieldCheck";

export const metadata: Metadata = {
  description:
    "Mast 231: soluzioni operative e su misura in antiriciclaggio, privacy, anticorruzione e responsabilità amministrativa degli enti (D.Lgs. 231/01). Contattaci per una compliance solida e verificabile.",
};

// NOTA: i testi descrittivi delle 4 card e dei 3 blocchi "Perché sceglierci" sono
// provvisori — in attesa del contenuto completo di copy-home-template-1.md da parte del cliente.
const serviceCards = [
  {
    icon: <IconApprovalBadge />,
    title: "Antiriciclaggio",
    description: (
      <>
        <strong>Adeguata verifica</strong>, adeguata formazione e presidi
        organizzativi per <strong>prevenire</strong> il rischio di <strong>riciclaggio</strong> e finanziamento
        del terrorismo.
      </>
    ),
  },
  {
    icon: <IconDocumentLines />,
    title: "Privacy",
    description: (
      <>
        Conformità al <strong>GDPR</strong>: registri dei trattamenti,
        informative, DPO e procedure per la <strong>gestione corretta dei dati
        personali.</strong>
      </>
    ),
  },
  {
    icon: <IconCircleCheck />,
    title: "Anticorruzione",
    description: (
      <>
        Piani anticorruzione e strumenti di prevenzione per <strong>ridurre</strong>{" "}
        l&apos;esposizione a <strong>rischi reputazionali e sanzionatori</strong>.
      </>
    ),
  },
  {
    icon: <IconShieldCheck />,
    title: "D.Lgs. 231/01",
    description: (
      <>
        Modelli organizzativi 231 e Organismo di Vigilanza per tutelare
        l&apos;ente dalla <strong>responsabilità amministrativa</strong>.
      </>
    ),
  },
];

const whyUsItems = [
  {
    num: "01",
    title: "Approccio operativo",
    description: "Soluzioni concrete e applicabili da subito, non solo consulenza teorica.",
  },
  {
    num: "02",
    title: "Aggiornamento costante",
    description: "Monitoriamo l'evoluzione normativa per mantenere la tua conformità sempre valida.",
  },
  {
    num: "03",
    title: "Su misura per te",
    description: "Ogni percorso di compliance è calibrato sulla tua realtà, non un modello standard.",
  },
];

export default function Home() {
  return (
    <>
      <Hero
        eyebrow="Compliance solutions"
        title="Sei un professionista o un'impresa e vuoi tutelarti da rischi e sanzioni?"
        subHeadline="Affidati a noi."
        lede={
          <>
            Ti affianchiamo con <strong>soluzioni</strong> operative e <strong>su misura</strong> in materia di{" "}
            <strong>antiriciclaggio</strong>, <strong>privacy</strong>,{" "}
            <strong>anticorruzione</strong> e responsabilità amministrativa degli
            enti (D.Lgs. 231/01) — per una conformità solida, verificabile,
            senza sorprese.
          </>
        }
        ctaLabel="Contattaci"
        ctaHref="/contatti"
        trustIndicators={[
          "Team multidisciplinare",
          "Soluzioni operative su misura",
          "Aggiornamento normativo continuo",
        ]}
      />

      <ServicesCards
        eyebrow="Le nostre aree"
        title="Un presidio di compliance su ogni fronte"
        description="Quattro ambiti normativi, un unico punto di riferimento per la tua conformità."
        cards={serviceCards}
      />

      <WhyUs title="Perché sceglierci" items={whyUsItems} />

      <CtaBanner
        title="Non aspettare un controllo per scoprire di non essere in regola."
        ctaLabel="Contattaci"
        ctaHref="/contatti"
      />
    </>
  );
}