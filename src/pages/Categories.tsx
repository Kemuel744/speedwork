import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FolderTree, Plus, Edit2, Trash2, ChevronRight, Folder } from 'lucide-react';

interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  description: string;
  sort_order: number;
}

interface TreeNode extends Category {
  children: TreeNode[];
}

const empty = { parent_id: null as string | null, name: '', description: '', sort_order: 0 };

function buildTree(items: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  items.forEach(i => map.set(i.id, { ...i, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function CategoryNode({ node, depth, onEdit, onDelete, onAddChild }: {
  node: TreeNode; depth: number;
  onEdit: (c: Category) => void; onDelete: (id: string) => void; onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-accent/50 rounded-lg group" style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}>
        {node.children.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <div className="w-4" />
        )}
        <Folder className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{node.name}</p>
          {node.description && <p className="text-xs text-muted-foreground truncate">{node.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddChild(node.id)} title="Ajouter sous-catégorie">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(node)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(node.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {expanded && node.children.map(c => (
        <CategoryNode key={c.id} node={c} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  );
}

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(empty);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('product_categories').select('*').order('sort_order').order('name');
    if (data) setCategories(data as Category[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const openNew = (parentId: string | null = null) => {
    setEditing(null);
    setForm({ ...empty, parent_id: parentId });
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ parent_id: c.parent_id, name: c.name, description: c.description, sort_order: c.sort_order });
    setOpen(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) {
      toast({ title: 'Le nom est requis', variant: 'destructive' });
      return;
    }
    if (editing) {
      const { error } = await supabase.from('product_categories').update(form as never).eq('id', editing.id);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Catégorie mise à jour' });
    } else {
      const { error } = await supabase.from('product_categories').insert({ ...form, user_id: user.id } as never);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      toast({ title: 'Catégorie ajoutée' });
    }
    setOpen(false); fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les sous-catégories deviendront racines.')) return;
    await supabase.from('product_categories').delete().eq('id', id);
    toast({ title: 'Catégorie supprimée' });
    fetchAll();
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-primary" />
            </div>
            Catégories
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Organisez vos produits par rayons et sous-rayons</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openNew(null)}><Plus className="w-4 h-4 mr-1.5" />Nouvelle catégorie</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Catégorie parent</Label>
                <Select value={form.parent_id ?? 'root'} onValueChange={v => setForm({ ...form, parent_id: v === 'root' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">— Racine (aucun parent) —</SelectItem>
                    {categories.filter(c => !editing || c.id !== editing.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nom *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Boissons, Médicaments OTC..." />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save}>{editing ? 'Mettre à jour' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-3">
          {tree.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune catégorie. Créez vos rayons et sous-rayons pour organiser votre catalogue.</p>
            </div>
          ) : (
            tree.map(node => (
              <CategoryNode key={node.id} node={node} depth={0} onEdit={openEdit} onDelete={remove} onAddChild={openNew} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
