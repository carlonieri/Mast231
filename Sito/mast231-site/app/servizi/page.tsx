import type { Metadata } from "next";
import PageHead from "@/components/sections/PageHead";
import ServiceDetailRow from "@/components/sections/ServiceDetailRow";
import CtaBanner from "@/components/sections/CtaBanner";
import DetailIconApprovalBadge from "@/components/illustrations/DetailIconApprovalBadge";
import DetailIconDocumentLines from "@/components/illustrations/DetailIconDocumentLines";
import DetailIconApproved from "@/components/illustrations/DetailIconApproved";
import DetailIconShield from "@/components/illustrations/DetailIconShield";

export const metadata: Metadata = {
  title: "Servizi",
};

export default function ServiziPage() {
  return (
    <>
      <PageHead
        eyebrow="Servizi"
        title="Servizi"
        description="Un presidio di compliance completo, per ogni obbligo normativo della tua attività."
      />

      <ServiceDetailRow
        numTag="01 — Antiriciclaggio"
        title="Antiriciclaggio: conformità al D.Lgs. 231/2007 senza stress"
        description={
          <>
            Se sei un professionista soggetto agli <strong>obblighi antiriciclaggio</strong>, ti
            aiutiamo a costruire un <strong>sistema di prevenzione solido</strong> — procedure
            interne, formazione, fascicoli clientela e monitoraggio continuo — per una gestione
            semplice, sicura e <strong>a prova di controllo</strong>.
          </>
        }
        checklist={[
          "Adeguata verifica e fascicoli della clientela",
          "Formazione interna su misura per studio e personale",
          "Affiancamento in caso di verifica della Guardia di Finanza",
        ]}
        icon={<DetailIconApprovalBadge />}
      />

      <ServiceDetailRow
        numTag="02 — Privacy"
        title="Privacy: la conformità GDPR come vantaggio competitivo"
        description={
          <>
            Trasformiamo gli <strong>adempimenti privacy</strong> in un processo chiaro e
            gestibile: mappatura dei processi, documentazione, gestione delle richieste degli
            interessati e <strong>incarichi di DPO</strong>, per mettere in{" "}
            <strong>sicurezza il tuo business</strong>.
          </>
        }
        checklist={[
          "Registro dei trattamenti, informative e nomine",
          "Gestione videosorveglianza e DPIA",
          "Formazione interna e supporto come DPO",
        ]}
        icon={<DetailIconDocumentLines />}
        reverse
        alt
      />

      <ServiceDetailRow
        numTag="03 — Anticorruzione"
        title="Anticorruzione: un sistema di gestione conforme alla ISO 37001"
        description={
          <>
            Progettiamo e implementiamo <strong>sistemi di gestione anticorruzione</strong>{" "}
            conformi alla norma <strong>ISO 37001</strong>, per proteggere la tua azienda da
            rischi legali e reputazionali e rafforzare la{" "}
            <strong>fiducia di clienti e partner</strong>.
          </>
        }
        checklist={[
          "Analisi dei rischi e valutazione di conformità",
          "Policy, procedure e formazione del personale",
          "Supporto alla certificazione e audit periodici",
        ]}
        icon={<DetailIconApproved />}
      />

      <ServiceDetailRow
        numTag="04 — D.Lgs. 231/01"
        title="Modelli 231: proteggi l'azienda dalla responsabilità amministrativa"
        description={
          <>
            Costruiamo <strong>Modelli di Organizzazione, Gestione e Controllo (MOG 231)</strong>{" "}
            su misura, insieme a Codice Etico, sistema di <strong>whistleblowing</strong>{" "}
            e supporto all&apos;<strong>Organismo di Vigilanza</strong>, per una governance
            solida e conforme.
          </>
        }
        checklist={[
          "Risk assessment e mappatura delle aree di rischio",
          "Codice Etico e sistema di whistleblowing",
          "Supporto all'Organismo di Vigilanza e audit periodici",
        ]}
        icon={<DetailIconShield />}
        reverse
        alt
      />

      <CtaBanner
        title="Prenota una consulenza gratuita per individuare le soluzioni più efficaci per la tua attività."
        ctaLabel="Contattaci"
        ctaHref="/contatti"
      />
    </>
  );
}
