import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Download, FileText, Upload, Image } from "lucide-react";

interface BlogPost {
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
  status: string;
  created_at: string;
  published_at: string | null;
  reading_time: number;
  views_count: number;
}

const CATEGORIES = [
  "Facturation",
  "Gestion d'entreprise",
  "Fiscalité",
  "Organisation PME",
  "Conseils financiers",
];

const emptyPost = {
  title: "",
  slug: "",
  meta_title: "",
  meta_description: "",
  keywords: "",
  content: "",
  excerpt: "",
  featured_image: "",
  author: "SpeedWork",
  category: "Facturation",
  tags: [] as string[],
  status: "draft",
};

export default function AdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Erreur upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
      setEditing({ ...editing, featured_image: urlData.publicUrl });
      toast({ title: "Image uploadée" });
    }
    setUploading(false);
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Erreur upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
      const markdown = `\n![${file.name}](${urlData.publicUrl})\n`;
      setEditing({ ...editing, content: (editing.content || "") + markdown });
      toast({ title: "Image insérée dans le contenu" });
    }
    setUploading(false);
  };

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as unknown as BlogPost[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const estimateReadingTime = (text: string) =>
    Math.max(1, Math.ceil(text.split(/\s+/).length / 200));

  const openNew = () => {
    setEditing({ ...emptyPost });
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing({ ...post });
    setTagsInput(post.tags.join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing || !editing.title || !editing.content) {
      toast({ title: "Erreur", description: "Titre et contenu requis", variant: "destructive" });
      return;
    }
    setSaving(true);

    const slug = editing.slug || generateSlug(editing.title);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const reading_time = estimateReadingTime(editing.content);
    const meta_title = (editing.meta_title || editing.title).slice(0, 60);
    const meta_description = (editing.meta_description || editing.excerpt || "").slice(0, 160);

    const payload = {
      title: editing.title,
      slug,
      meta_title,
      meta_description,
      keywords: editing.keywords || "",
      content: editing.content,
      excerpt: editing.excerpt || "",
      featured_image: editing.featured_image || null,
      author: editing.author || "SpeedWork",
      category: editing.category || "Facturation",
      tags,
      status: editing.status || "draft",
      reading_time,
      published_at: editing.status === "published" ? (editing.published_at || new Date().toISOString()) : null,
      created_by: user?.id || "",
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: editing.id ? "Article mis à jour" : "Article créé" });
      setDialogOpen(false);
      fetchPosts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: "Article supprimé" });
    fetchPosts();
  };

  const exportCSV = () => {
    const headers = "Titre,Slug,Catégorie,Statut,Vues,Date\n";
    const rows = posts
      .map((p) => `"${p.title}","${p.slug}","${p.category}","${p.status}",${p.views_count},"${p.created_at}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blog-posts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalViews = posts.reduce((s, p) => s + p.views_count, 0);
  const publishedCount = posts.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du Blog</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} articles · {publishedCount} publiés · {totalViews} vues totales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
              </DialogHeader>
              {editing && (
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Titre *</Label>
                    <Input
                      value={editing.title || ""}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : generateSlug(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={editing.slug || ""}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Catégorie</Label>
                      <Select
                        value={editing.category || "Facturation"}
                        onValueChange={(v) => setEditing({ ...editing, category: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <Select
                        value={editing.status || "draft"}
                        onValueChange={(v) => setEditing({ ...editing, status: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Extrait</Label>
                    <Textarea
                      value={editing.excerpt || ""}
                      onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Contenu * (Markdown)</Label>
                    <Textarea
                      value={editing.content || ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Image à la une</Label>
                    {editing.featured_image && (
                      <img src={editing.featured_image} alt="Aperçu" className="w-full h-40 object-cover rounded-md mb-2" />
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={editing.featured_image || ""}
                        onChange={(e) => setEditing({ ...editing, featured_image: e.target.value })}
                        placeholder="URL de l'image ou uploader ci-dessous"
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="icon" asChild disabled={uploading}>
                          <span><Upload className="h-4 w-4" /></span>
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Insérer une image dans le contenu</Label>
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="w-full" asChild disabled={uploading}>
                        <span><Image className="h-4 w-4 mr-2" /> {uploading ? "Upload en cours..." : "Uploader et insérer en Markdown"}</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleContentImageUpload} />
                    </label>
                  </div>

                  {/* SEO Preview */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Prévisualisation SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p className="text-primary font-medium truncate">
                        {(editing.meta_title || editing.title || "Titre").slice(0, 60)} | SpeedWork
                      </p>
                      <p className="text-[hsl(var(--success))] text-xs">
                        speedwork.pro/blog/{editing.slug || "slug"}
                      </p>
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {(editing.meta_description || editing.excerpt || "Description...").slice(0, 160)}
                      </p>
                    </CardContent>
                  </Card>

                  <div>
                    <Label>Meta Title (max 60)</Label>
                    <Input
                      value={editing.meta_title || ""}
                      onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })}
                      maxLength={60}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(editing.meta_title || "").length}/60
                    </span>
                  </div>
                  <div>
                    <Label>Meta Description (max 160)</Label>
                    <Textarea
                      value={editing.meta_description || ""}
                      onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                      rows={2}
                      maxLength={160}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(editing.meta_description || "").length}/160
                    </span>
                  </div>
                  <div>
                    <Label>Mots-clés</Label>
                    <Input
                      value={editing.keywords || ""}
                      onChange={(e) => setEditing({ ...editing, keywords: e.target.value })}
                      placeholder="facture PME Congo, gestion stock"
                    />
                  </div>
                  <div>
                    <Label>Tags (séparés par des virgules)</Label>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="facturation, PME, Congo"
                    />
                  </div>
                  <div>
                    <Label>Auteur</Label>
                    <Input
                      value={editing.author || "SpeedWork"}
                      onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun article. Créez votre premier article !</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs shrink-0">
                      {post.status === "published" ? "Publié" : "Brouillon"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{post.category}</span>
                    <span>{post.views_count} vues</span>
                    <span>{new Date(post.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {post.status === "published" && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
