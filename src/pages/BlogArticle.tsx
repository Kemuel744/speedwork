import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import AdSenseSlot from "@/components/blog/AdSenseSlot";
import BlogCTA from "@/components/blog/BlogCTA";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface Post {
  id: string;
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  author: string;
  category: string;
  tags: string[];
  published_at: string | null;
  reading_time: number;
  views_count: number;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<{ title: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Load AdSense script once on blog article pages
  const adsLoaded = useRef(false);
  useEffect(() => {
    if (adsLoaded.current) return;
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const s = document.createElement("script");
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9622797998614025";
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    adsLoaded.current = true;
  }, []);

  useEffect(() => {
    if (slug) fetchPost(slug);
  }, [slug]);

  const fetchPost = async (s: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", s)
      .eq("status", "published")
      .single();

    if (data) {
      setPost(data as unknown as Post);
      // Increment views (fire and forget)
      supabase.from("blog_posts").update({ views_count: (data.views_count || 0) + 1 }).eq("id", data.id).then(() => {});
      // Fetch related
      const { data: rel } = await supabase
        .from("blog_posts")
        .select("title, slug")
        .eq("status", "published")
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(3);
      setRelated((rel as { title: string; slug: string }[]) || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <PublicNavbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <PublicNavbar />
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-xl text-muted-foreground">Article introuvable</p>
          <Button asChild variant="outline">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour au blog
            </Link>
          </Button>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Split content into paragraphs for ad insertion
  const contentParts = post.content.split("\n\n");
  const adAfterFirst = Math.min(2, contentParts.length);
  const adMiddle = Math.floor(contentParts.length / 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image || "https://speedwork.pro/og-image.png",
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "SpeedWork",
      logo: { "@type": "ImageObject", url: "https://speedwork.pro/favicon.png" },
    },
    datePublished: post.published_at,
    dateModified: post.published_at,
    mainEntityOfPage: `https://speedwork.pro/blog/${post.slug}`,
    keywords: post.keywords,
  };

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        path={`/blog/${post.slug}`}
        jsonLd={jsonLd}
      />
      <PublicNavbar />

      <main className="min-h-screen bg-background pt-20">
        <article className="container mx-auto px-4 max-w-3xl py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground">{post.category}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <Badge variant="secondary" className="mb-3">{post.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Par {post.author}</span>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.published_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time} min de lecture
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full rounded-lg mb-8 object-cover max-h-[400px]"
              loading="eager"
              fetchPriority="high"
            />
          )}

          {/* Content with ad slots */}
          <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground">
            {contentParts.map((part, i) => (
              <div key={i}>
                <ReactMarkdown>{part}</ReactMarkdown>
                {i === adAfterFirst - 1 && <AdSenseSlot slot="after-intro" />}
                {i === adMiddle && i !== adAfterFirst - 1 && <AdSenseSlot slot="mid-article" />}
              </div>
            ))}
          </div>

          {/* End-of-article ad */}
          <AdSenseSlot slot="end-article" className="mt-8" />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* CTA Block */}
          <BlogCTA />

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="mt-12 pt-8 border-t">
              <h2 className="text-xl font-bold text-foreground mb-4">Articles similaires</h2>
              <div className="grid gap-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/10 transition-colors group"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {r.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Internal Links */}
          <section className="mt-8 p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-foreground mb-3">Découvrez SpeedWork</h3>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/fonctionnalites">Fonctionnalités</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/tarifs">Tarifs</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/guide">Guide d'utilisation</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/login">Créer un compte</Link>
              </Button>
            </div>
          </section>
        </article>
      </main>

      <PublicFooter />
    </>
  );
}
