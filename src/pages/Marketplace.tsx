import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Store, MapPin, Star, Package, Sparkles, Heart, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicSupplier {
  user_id: string;
  company_name: string;
  full_name: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  description: string;
  categories: string[];
  delivery_zones: string[];
  min_order: number;
  rating: number;
  orders_count: number;
  product_count: number;
  logo_url: string | null;
}

interface Recommended {
  user_id: string;
  company_name: string;
  city: string;
  country: string;
  description: string;
  categories: string[];
  rating: number;
  match_score: number;
  logo_url: string | null;
}

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<PublicSupplier[]>([]);
  const [recommended, setRecommended] = useState<Recommended[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supRes: any = await (supabase.rpc as any)('get_public_suppliers', {
      _search: search || null, _city: city || null, _country: country || null, _category: category || null,
    });
    const recRes: any = await (supabase.rpc as any)('get_recommended_suppliers');
    const favRes: any = await (supabase.from as any)('marketplace_favorites').select('supplier_user_id').eq('buyer_user_id', user.id);
    if (supRes?.data) setSuppliers(supRes.data as PublicSupplier[]);
    if (recRes?.data) setRecommended(recRes.data as Recommended[]);
    if (favRes?.data) setFavorites(new Set((favRes.data as Array<{ supplier_user_id: string }>).map((f: any) => f.supplier_user_id)));
    setLoading(false);
  }, [user, search, city, country, category]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleFavorite = async (supplierId: string) => {
    if (!user) return;
    if (favorites.has(supplierId)) {
      await supabase.from('marketplace_favorites' as never).delete().eq('buyer_user_id', user.id).eq('supplier_user_id', supplierId);
      const next = new Set(favorites); next.delete(supplierId); setFavorites(next);
    } else {
      const { error } = await supabase.from('marketplace_favorites' as never).insert({ buyer_user_id: user.id, supplier_user_id: supplierId } as never);
      if (error) return toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      const next = new Set(favorites); next.add(supplierId); setFavorites(next);
    }
  };

  const SupplierCard = ({ s }: { s: PublicSupplier }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {s.logo_url ? <img src={s.logo_url} alt={s.company_name} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-primary" />}
          </div>
          <div className="min-w-0 flex-1">
            <Link to={`/marketplace/${s.user_id}`} className="font-semibold hover:text-primary truncate block">{s.company_name || s.full_name}</Link>
            {(s.city || s.country) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{[s.city, s.country].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => toggleFavorite(s.user_id)} title="Favori">
            <Heart className={`w-4 h-4 ${favorites.has(s.user_id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.description}</p>}
        {s.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {s.categories.slice(0, 3).map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.product_count} produit{s.product_count > 1 ? 's' : ''}</span>
          {s.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-500" />{s.rating.toFixed(1)}</span>}
          <span>{s.orders_count} cmd</span>
        </div>
        <Button asChild size="sm" className="w-full mt-3">
          <Link to={`/marketplace/${s.user_id}`}>Voir le catalogue</Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="page-container">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="section-title flex items-center gap-2"><Store className="w-6 h-6 text-primary" />Marketplace fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Trouvez des fournisseurs vérifiés pour approvisionner votre boutique</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/marketplace/orders">Mes commandes marketplace</Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Tous les fournisseurs</TabsTrigger>
          <TabsTrigger value="recommended"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Recommandés</TabsTrigger>
          <TabsTrigger value="favorites"><Heart className="w-3.5 h-3.5 mr-1.5" />Favoris</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher un fournisseur" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Input placeholder="Ville" value={city} onChange={e => setCity(e.target.value)} />
              <Input placeholder="Catégorie (ex: Boissons)" value={category} onChange={e => setCategory(e.target.value)} />
            </CardContent>
          </Card>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
          ) : suppliers.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun fournisseur trouvé pour ces critères</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suppliers.map(s => <SupplierCard key={s.user_id} s={s} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended">
          {recommended.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune recommandation pour le moment</p>
              <p className="text-xs mt-1">Ajoutez des produits avec des catégories pour obtenir des suggestions</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommended.map(r => (
                <Card key={r.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        <Sparkles className="w-3 h-3 mr-1" />Score {r.match_score}
                      </Badge>
                      {r.rating > 0 && <Badge variant="outline" className="text-[10px]"><Star className="w-3 h-3 mr-0.5 fill-amber-400 text-amber-500" />{r.rating.toFixed(1)}</Badge>}
                    </div>
                    <Link to={`/marketplace/${r.user_id}`} className="font-semibold hover:text-primary block truncate">{r.company_name}</Link>
                    {(r.city || r.country) && <p className="text-xs text-muted-foreground"><MapPin className="w-3 h-3 inline mr-1" />{[r.city, r.country].filter(Boolean).join(', ')}</p>}
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{r.description}</p>}
                    <Button asChild size="sm" className="w-full mt-3">
                      <Link to={`/marketplace/${r.user_id}`}>Voir le profil</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {[...favorites].length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun fournisseur favori</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suppliers.filter(s => favorites.has(s.user_id)).map(s => <SupplierCard key={s.user_id} s={s} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}