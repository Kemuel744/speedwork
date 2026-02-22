import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Play, ExternalLink, FileText, Video, Link as LinkIcon } from 'lucide-react';
import SEO from '@/components/SEO';

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  resource_type: string;
  created_at: string;
  created_by: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]{11})/
  );
  return match ? match[1] : null;
}

export default function Learning() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState('youtube');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('learning_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setResources(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();

    const channel = supabase
      .channel('learning_resources_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_resources' }, () => {
        fetchResources();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Le titre et le lien sont requis');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('learning_resources').insert({
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      resource_type: resourceType,
      created_by: user!.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Erreur lors de l\'ajout');
    } else {
      toast.success('Contenu ajouté avec succès');
      setTitle(''); setDescription(''); setUrl(''); setResourceType('youtube');
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('learning_resources').delete().eq('id', id);
    if (error) toast.error('Erreur lors de la suppression');
    else toast.success('Contenu supprimé');
  };

  const typeConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
    youtube: { label: 'Vidéo', icon: Video, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    article: { label: 'Article', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    link: { label: 'Lien', icon: LinkIcon, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  };

  return (
    <>
      <SEO title="Apprentissage – SpeedWork" description="Espace d'apprentissage SpeedWork : tutoriels vidéo et ressources." path="/learning" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📚 Espace d'apprentissage</h1>
            <p className="text-sm text-muted-foreground mt-1">Tutoriels, vidéos et ressources pour maîtriser SpeedWork</p>
          </div>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un contenu
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter un contenu d'apprentissage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Type</label>
                    <Select value={resourceType} onValueChange={setResourceType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">🎬 Vidéo YouTube</SelectItem>
                        <SelectItem value="article">📄 Article</SelectItem>
                        <SelectItem value="link">🔗 Lien externe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Titre *</label>
                    <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Comment créer une facture" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Lien / URL *</label>
                    <Input className="mt-1" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="Courte description du contenu..." rows={3} />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? 'Ajout en cours...' : 'Ajouter'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucun contenu d'apprentissage pour le moment.</p>
              {isAdmin && <p className="text-sm text-muted-foreground mt-2">Cliquez sur « Ajouter un contenu » pour commencer.</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map(resource => {
              const ytId = resource.resource_type === 'youtube' ? extractYouTubeId(resource.url) : null;
              const cfg = typeConfig[resource.resource_type] || typeConfig.link;
              const Icon = cfg.icon;

              return (
                <Card key={resource.id} className="overflow-hidden flex flex-col">
                  {/* YouTube thumbnail or embed */}
                  {resource.resource_type === 'youtube' && ytId && (
                    <div className="relative">
                      {activeVideo === resource.id ? (
                        <div className="aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={resource.title}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveVideo(resource.id)}
                          className="relative w-full aspect-video group cursor-pointer bg-muted"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={resource.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-white fill-white ml-1" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className={`${cfg.color} mb-2 text-xs`}>
                          <Icon className="w-3 h-3 mr-1" /> {cfg.label}
                        </Badge>
                        <CardTitle className="text-base leading-tight">{resource.title}</CardTitle>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    )}
                    <div className="mt-auto">
                      {resource.resource_type !== 'youtube' || !ytId ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-2 w-full">
                            <ExternalLink className="w-3.5 h-3.5" /> Ouvrir le lien
                          </Button>
                        </a>
                      ) : activeVideo !== resource.id ? (
                        <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => setActiveVideo(resource.id)}>
                          <Play className="w-3.5 h-3.5" /> Regarder
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => setActiveVideo(null)}>
                          Fermer la vidéo
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Ajouté le {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
