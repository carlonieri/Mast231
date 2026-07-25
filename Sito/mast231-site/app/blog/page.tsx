import type { Metadata } from "next";
import PageHead from "@/components/sections/PageHead";
import BlogFeatured from "@/components/sections/BlogFeatured";
import BlogGrid from "@/components/sections/BlogGrid";
import BlogNewsletter from "@/components/sections/BlogNewsletter";
import FeaturedThumb from "@/components/illustrations/FeaturedThumb";
import PostThumbDocument from "@/components/illustrations/PostThumbDocument";
import PostThumbCheck from "@/components/illustrations/PostThumbCheck";

export const metadata: Metadata = {
  title: "Blog",
};

// NOTA: il sito sorgente ha solo 3 articoli reali pubblicati (stessa data,
// 30/05/2025). La griglia mostra dinamicamente quanti post sono presenti in
// questo array: aggiungendo nuovi articoli qui compariranno automaticamente.
const posts = [
  {
    thumb: <PostThumbDocument />,
    tag: "Antiriciclaggio",
    title: "Come costruire un fascicolo antiriciclaggio efficace per i tuoi clienti?",
    description:
      "Una guida pratica per studi professionali su come impostare correttamente il fascicolo della clientela ai fini antiriciclaggio.",
    meta: "30/05/2025",
  },
  {
    thumb: <PostThumbCheck />,
    tag: "Antiriciclaggio",
    title: "Antiriciclaggio: cosa aspettarsi da un'ispezione e come evitarne gli effetti negativi",
    description:
      "Come prepararsi a un controllo della Guardia di Finanza e affrontare l'ispezione senza conseguenze negative per lo studio.",
    meta: "30/05/2025",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHead eyebrow="Blog" title="Blog" />

      <BlogFeatured
        tag="Antiriciclaggio"
        title="Antiriciclaggio 2025 per studi professionali: cosa cambia e come adeguarsi"
        description="Una guida agli obblighi del D.Lgs. 231/2007, tra adeguata verifica e conservazione documentale, per aiutare gli studi professionali ad adeguarsi ai cambiamenti normativi del 2025."
        meta="30/05/2025"
        image={<FeaturedThumb />}
      />

      <BlogGrid posts={posts} />

      <BlogNewsletter
        title="Resta aggiornato sulla normativa"
        description="Novità su antiriciclaggio, privacy, anticorruzione e D.Lgs. 231/01, direttamente nella tua casella di posta."
        placeholder="La tua email"
        ctaLabel="Iscriviti"
      />
    </>
  );
}
