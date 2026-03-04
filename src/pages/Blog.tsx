import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Calendar, Clock, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  author: string;
  category: string;
  tags: string[];
  published_at: string | null;
  reading_time: number;
  views_count: number;
}

const CATEGORIES = [
  "Tous",
  "Facturation",
  "Gestion d'entreprise",
  "Fiscalité",
  "Organisation PME",
  "Conseils financiers",
];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, featured_image, author, category, tags, published_at, reading_time, views_count")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  const filtered = posts.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Tous" || p.category === category;
    return matchSearch && matchCat;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog SpeedWork",
    description: "Conseils facturation, gestion et fiscalité pour PME en Afrique",
    url: "https://speedwork.pro/blog",
    publisher: {
      "@type": "Organization",
      name: "SpeedWork",
      url: "https://speedwork.pro",
    },
  };

  return (
    <>
      <SEO
        title="Blog – Conseils Facturation & Gestion PME Congo"
        description="Découvrez nos articles sur la facturation, la gestion d'entreprise et la fiscalité pour les PME et freelances en Afrique. Conseils pratiques et guides gratuits."
        path="/blog"
        jsonLd={jsonLd}
      />
      <PublicNavbar />

      <main className="min-h-screen bg-background pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Blog SpeedWork
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Conseils pratiques pour gérer, facturer et développer votre entreprise en Afrique.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <div className="container mx-auto px-4 py-6 flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-8 max-w-6xl">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border bg-card animate-pulse h-80" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Aucun article trouvé.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Revenez bientôt pour de nouveaux contenus !
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="p-5">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {post.category}
                    </Badge>
                    <h2 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time} min
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="bg-primary/5 border-y py-12 mt-8">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Prêt à simplifier votre gestion ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Rejoignez les entreprises qui font confiance à SpeedWork pour leurs devis et factures.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/login">Essayer gratuitement</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/fonctionnalites">Voir les fonctionnalités</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
