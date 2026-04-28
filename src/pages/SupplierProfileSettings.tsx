import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Store, Save, Plus, X, Sparkles, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSupplierProfile } from '@/hooks/useSupplierProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function SupplierProfileSettings() {
  const { user } = useAuth();
  const { profile, loading, update } = useSupplierProfile();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [minOrder, setMinOrder] = useState(0);
  const [newCat, setNewCat] = useState('');
  const [newZone, setNewZone] = useState('');
  const [productCount, setProductCount] = useState(0);
  const [publicProductCount, setPublicProductCount] = useState(0);

  useEffect(() => {
    if (profile) {
      setIsPublic(profile.is_public_supplier);
      setDescription(profile.supplier_description || '');
      setCategories(profile.supplier_categories || []);
      setZones(profile.supplier_delivery_zones || []);
      setMinOrder(profile.supplier_min_order || 0);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [allRes, pubRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_public', true),
      ]);
      setProductCount(allRes.count || 0);
      setPublicProductCount(pubRes.count || 0);
    })();
  }, [user]);

  const save = async () => {
    const { error } = await update({
      is_public_supplier: isPublic,
      supplier_description: description,
      supplier_categories: categories,
      supplier_delivery_zones: zones,
      supplier_min_order: minOrder,
    });
    if (error) toast({ title: 'Erreur', description: error, variant: 'destructive' });
    else toast({ title: 'Profil fournisseur enregistré' });
  };

  if (loading) return <div className="page-container"><p className="text-sm text-muted-foreground">Chargement...</p></div>;

  return (
    <div className="page-container max-w-3xl">
      <h1 className="section-title flex items-center gap-2 mb-1"><Store className="w-6 h-6 text-primary" />Mon profil fournisseur public</h1>
      <p className="text-sm text-muted-foreground mb-6">Activez votre visibilité pour recevoir des commandes d'autres boutiquiers de la plateforme.</p>

      <Card className="mb-4">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-base">Visible publiquement</Label>
              <p className="text-xs text-muted-foreground mt-1">Les autres boutiquiers verront votre profil et catalogue dans la marketplace</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic && (
            <>
              <div>
                <Label>Description courte</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Présentez votre activité, vos points forts, vos délais..." />
              </div>

              <div>
                <Label>Catégories de produits</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="ex: Boissons, Cosmétiques..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCat.trim()) { setCategories([...categories, newCat.trim()]); setNewCat(''); } } }} />
                  <Button type="button" size="sm" onClick={() => { if (newCat.trim()) { setCategories([...categories, newCat.trim()]); setNewCat(''); } }}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((c, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">{c}<button onClick={() => setCategories(categories.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Zones de livraison</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="ex: Douala, Yaoundé..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newZone.trim()) { setZones([...zones, newZone.trim()]); setNewZone(''); } } }} />
                  <Button type="button" size="sm" onClick={() => { if (newZone.trim()) { setZones([...zones, newZone.trim()]); setNewZone(''); } }}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {zones.map((z, i) => (
                    <Badge key={i} variant="outline" className="gap-1">{z}<button onClick={() => setZones(zones.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Commande minimum (XAF)</Label>
                <Input type="number" min={0} value={minOrder} onChange={e => setMinOrder(Number(e.target.value))} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            {isPublic && profile?.is_public_supplier && (
              <Button asChild variant="outline" size="sm"><Link to={`/marketplace/${user?.id}`}><Eye className="w-3.5 h-3.5 mr-1.5" />Voir mon profil public</Link></Button>
            )}
            <Button onClick={save}><Save className="w-4 h-4 mr-1.5" />Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      {isPublic && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Catalogue public</h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>{publicProductCount}</strong> produit{publicProductCount > 1 ? 's' : ''} visible{publicProductCount > 1 ? 's' : ''} sur <strong>{productCount}</strong> au total
            </p>
            <p className="text-xs text-muted-foreground mb-3">Pour rendre un produit visible, allez dans <strong>Produits</strong> et activez "Publier dans le marketplace".</p>
            <Button asChild size="sm" variant="outline"><Link to="/inventory">Gérer mes produits</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}