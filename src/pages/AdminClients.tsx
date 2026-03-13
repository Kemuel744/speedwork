import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, UserPlus, Trash2, Building2, Loader2, Users, KeyRound, Copy, Phone, Eye, MapPin, Globe, Briefcase, Clock, Wrench, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ClientProfile {
  user_id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  trial_start: string | null;
  trial_docs_used: number | null;
  active_plan: string | null;
  full_name?: string;
  account_type?: string;
  country?: string;
  city?: string;
  sector?: string;
  employee_count?: string;
  website?: string;
  profession?: string;
  experience_years?: string;
  skills?: string;
  availability?: string;
}

const accountTypeLabels: Record<string, string> = {
  enterprise: 'Entreprise',
  freelance: 'Freelance',
  pme: 'PME / Startup',
  ong: 'Organisation / ONG',
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

export default function AdminClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState({ email: '', password: '', company_name: '', phone: '', address: '' });
  const [activateTarget, setActivateTarget] = useState<ClientProfile | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);
  const [detailClient, setDetailClient] = useState<ClientProfile | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const res = await supabase.functions.invoke('manage-clients', {
        body: { action: 'list' },
      });
      if (res.error) throw res.error;
      return (res.data?.clients || []) as ClientProfile[];
    },
  });

  const createClient = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('manage-clients', {
        body: { action: 'create', ...form },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setShowAdd(false);
      setForm({ email: '', password: '', company_name: '', phone: '', address: '' });
      toast({ title: 'Client ajouté', description: 'Le compte client a été créé avec succès.' });
    },
    onError: (err: Error) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteClient = useMutation({
    mutationFn: async (user_id: string) => {
      const res = await supabase.functions.invoke('manage-clients', {
        body: { action: 'delete', user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setDeleteTarget(null);
      toast({ title: 'Client supprimé', description: 'Le compte et toutes les données associées ont été supprimés.' });
    },
    onError: (err: Error) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const handleManualActivation = async (client: ClientProfile, plan: 'monthly' | 'annual' | 'enterprise') => {
    setActivatingPlan(plan);
    try {
      const amounts: Record<string, number> = { monthly: 5000, annual: 36000, enterprise: 15000 };
      const res = await supabase.functions.invoke('generate-access-code', {
        body: {
          user_id: client.user_id,
          plan,
          payment_method: 'mtn_mobile_money',
          amount: amounts[plan],
        },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      setGeneratedCode(res.data.access_code);
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Abonnement activé', description: `Code d'accès généré pour ${client.company_name || client.email}` });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setActivatingPlan(null);
    }
  };

  const filtered = clients.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} client(s) inscrit(s)</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Ajouter un client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total clients</p>
              <p className="text-lg font-bold text-foreground">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En période d'essai</p>
              <p className="text-lg font-bold text-foreground">
                {clients.filter(c => {
                  if (!c.trial_start) return false;
                  const end = new Date(c.trial_start);
                  end.setDate(end.getDate() + 3);
                  return new Date() < end;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Clients</CardTitle>
          <CardDescription>{filtered.length} résultat(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden lg:table-cell">Localisation</TableHead>
                  <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun client trouvé</TableCell>
                  </TableRow>
                ) : filtered.map(client => (
                  <TableRow key={client.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-foreground">{client.company_name || client.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                        {client.active_plan === 'enterprise' && (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/20 text-[10px] px-1.5 py-0">Entreprise</Badge>
                        )}
                        {client.active_plan === 'annual' && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 hover:bg-emerald-500/20 text-[10px] px-1.5 py-0">Annuel</Badge>
                        )}
                        {client.active_plan === 'monthly' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Mensuel</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-[10px]">
                        {accountTypeLabels[client.account_type || ''] || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{client.phone || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {[client.city, client.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{new Date(client.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailClient(client)}
                          title="Voir le profil"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setActivateTarget(client); setGeneratedCode(''); }}
                          className="text-primary hover:text-primary"
                          title="Activer abonnement"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(client)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Client detail dialog */}
      <Dialog open={!!detailClient} onOpenChange={() => setDetailClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Fiche client
            </DialogTitle>
          </DialogHeader>
          {detailClient && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">
                    {accountTypeLabels[detailClient.account_type || ''] || 'Non spécifié'}
                  </Badge>
                  {detailClient.active_plan && (
                    <Badge className={
                      detailClient.active_plan === 'enterprise' ? 'bg-amber-500/15 text-amber-700 border-amber-300' :
                      detailClient.active_plan === 'annual' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-300' :
                      ''
                    }>
                      {detailClient.active_plan === 'enterprise' ? 'Entreprise' :
                       detailClient.active_plan === 'annual' ? 'Annuel' : 'Mensuel'}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Informations générales</h3>
                <DetailRow icon={User} label="Nom complet" value={detailClient.full_name} />
                <DetailRow icon={Building2} label="Entreprise" value={detailClient.company_name} />
                <DetailRow icon={Phone} label="Email" value={detailClient.email} />
                <DetailRow icon={Phone} label="Téléphone" value={detailClient.phone} />
                <DetailRow icon={Globe} label="Pays" value={detailClient.country} />
                <DetailRow icon={MapPin} label="Ville" value={detailClient.city} />
                <DetailRow icon={MapPin} label="Adresse" value={detailClient.address} />

                <Separator className="my-3" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Détails professionnels</h3>
                <DetailRow icon={Briefcase} label="Secteur d'activité" value={detailClient.sector} />
                <DetailRow icon={Users} label="Nombre d'employés" value={detailClient.employee_count} />
                <DetailRow icon={Globe} label="Site web" value={detailClient.website} />
                <DetailRow icon={Wrench} label="Profession" value={detailClient.profession} />
                <DetailRow icon={Clock} label="Années d'expérience" value={detailClient.experience_years} />
                <DetailRow icon={Wrench} label="Compétences" value={detailClient.skills} />
                <DetailRow icon={Clock} label="Disponibilité" value={detailClient.availability} />

                <Separator className="my-3" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Compte</h3>
                <DetailRow icon={Clock} label="Date d'inscription" value={new Date(detailClient.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <DetailRow icon={Clock} label="Documents créés" value={String(detailClient.trial_docs_used ?? 0)} />
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailClient(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add client dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de l'entreprise *</Label>
              <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Ex: Société ABC" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@example.com" />
            </div>
            <div>
              <Label>Mot de passe *</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caractères" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+225 XX XX XX XX" />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Adresse de l'entreprise" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button
              onClick={() => createClient.mutate()}
              disabled={!form.email || !form.password || !form.company_name || createClient.isPending}
            >
              {createClient.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual activation dialog */}
      <Dialog open={!!activateTarget} onOpenChange={() => setActivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer l'abonnement manuellement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <p className="font-medium text-foreground">Client : {activateTarget?.company_name || activateTarget?.email}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>Paiement via : +242 06 444 6047 / 05 303 9818</span>
              </div>
            </div>

            {generatedCode ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">Code d'accès généré :</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold tracking-widest text-primary">{generatedCode}</span>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(generatedCode); toast({ title: 'Copié !' }); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Communiquez ce code au client pour qu'il active son compte.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-1"
                  disabled={!!activatingPlan}
                  onClick={() => activateTarget && handleManualActivation(activateTarget, 'monthly')}
                >
                  {activatingPlan === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span className="font-semibold">Mensuel</span>
                  <span className="text-xs text-muted-foreground">5 000 FCFA</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-1"
                  disabled={!!activatingPlan}
                  onClick={() => activateTarget && handleManualActivation(activateTarget, 'annual')}
                >
                  {activatingPlan === 'annual' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span className="font-semibold">Annuel</span>
                  <span className="text-xs text-muted-foreground">36 000 FCFA</span>
                </Button>
                <Button
                  className="h-auto py-4 flex flex-col gap-1"
                  disabled={!!activatingPlan}
                  onClick={() => activateTarget && handleManualActivation(activateTarget, 'enterprise')}
                >
                  {activatingPlan === 'enterprise' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span className="font-semibold">Entreprise</span>
                  <span className="text-xs text-muted-foreground">15 000 FCFA/mois</span>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateTarget(null)}>
              {generatedCode ? 'Fermer' : 'Annuler'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte de <strong>{deleteTarget?.company_name || deleteTarget?.email}</strong> ainsi que toutes ses données (documents, abonnements) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteClient.mutate(deleteTarget.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
