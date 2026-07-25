import type { Metadata } from "next";
import PageHead from "@/components/sections/PageHead";
import ContactForm from "@/components/sections/ContactForm";
import ContactMap from "@/components/sections/ContactMap";

export const metadata: Metadata = {
  title: "Contatti",
};

const infoBlocks = [
  {
    title: "Sede",
    lines: [
      { text: "Mast Srls" },
      { text: "Via Salvador Allende, 10" },
      { text: "56029 — Santa Croce sull'Arno (PI)" },
    ],
  },
  {
    title: "Recapiti",
    lines: [
      { text: "+39 0571 1721826", href: "tel:+3905711721826" },
      { text: "info@mast231.it", href: "mailto:info@mast231.it" },
    ],
  },
];

export default function ContattiPage() {
  return (
    <>
      <PageHead eyebrow="Contatti" title="Contatti" />

      <ContactForm
        infoBlocks={infoBlocks}
        formIntro="Raccontaci la tua esigenza, ti risponderemo al più presto."
        fieldLabels={{
          firstName: "Nome",
          lastName: "Cognome",
          email: "Email",
          message: "Messaggio",
        }}
        placeholders={{
          firstName: "Il tuo nome",
          lastName: "Il tuo cognome",
          email: "latua@email.it",
          message: "Scrivi qui la tua richiesta...",
        }}
        submitLabel="Invia richiesta"
      />

      <ContactMap />
    </>
  );
}
