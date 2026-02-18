import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Trash2, Building2, Briefcase, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  position: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  max_members: number;
}

export default function TeamManagement() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchOrg = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('manage-team', {
      body: { action: 'get-org' },
    });
    if (!error && data) {
      setOrg(data.org);
      setMembers(data.members || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) { toast.error("Nom de l'organisation requis"); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('manage-team', {
      body: { action: 'create-org', name: orgName.trim() },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erreur lors de la création");
    } else {
      toast.success("Organisation créée !");
      fetchOrg();
    }
    setCreating(false);
  };

  const handleAddMember = async () => {
    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      toast.error("Email, mot de passe et nom requis");
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.functions.invoke('manage-team', {
      body: { action: 'add-member', email: newEmail.trim(), password: newPassword.trim(), name: newName.trim(), position: newPosition.trim() },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erreur lors de l'ajout");
    } else {
      toast.success("Collaborateur ajouté !");
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewPosition('');
      setAddOpen(false);
      fetchOrg();
    }
    setAdding(false);
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Supprimer le collaborateur ${memberName} ? Son compte sera définitivement supprimé.`)) return;
    const { data, error } = await supabase.functions.invoke('manage-team', {
      body: { action: 'remove-member', user_id: userId },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erreur lors de la suppression");
    } else {
      toast.success("Collaborateur supprimé");
      fetchOrg();
    }
  };

  if (loading) {
    return <div className="page-container flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  // No organization yet - show creation form
  if (!org) {
    return (
      <div className="page-container">
        <h1 className="section-title mb-6">Mon Équipe</h1>
        <div className="stat-card max-w-lg mx-auto p-8 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Créer votre organisation</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Un abonnement Entreprise actif est requis. Créez votre organisation pour ajouter jusqu'à 3 collaborateurs.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Nom de l'organisation"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="h-11"
            />
            <Button onClick={handleCreateOrg} disabled={creating} className="w-full h-11">
              {creating ? 'Création...' : 'Créer l\'organisation'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nonOwnerMembers = members.filter(m => m.user_id !== user?.id);
  const canAdd = nonOwnerMembers.length < org.max_members;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {nonOwnerMembers.length}/{org.max_members} collaborateurs
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAdd} className="gap-2">
              <UserPlus className="w-4 h-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un collaborateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Nom complet *</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Marie Dupont" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Ex: marie@entreprise.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Mot de passe *</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="6 caractères minimum" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Poste</label>
                <Input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="Ex: Comptable, Commercial..." className="mt-1" />
              </div>
              <Button onClick={handleAddMember} disabled={adding} className="w-full">
                {adding ? 'Ajout en cours...' : 'Ajouter le collaborateur'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {/* Owner card */}
        <div className="stat-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{user?.name || user?.email}</p>
              <Badge variant="default" className="text-[10px]">Admin</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <p className="text-xs text-muted-foreground">Administrateur</p>
        </div>

        {/* Members */}
        {nonOwnerMembers.map(member => (
          <div key={member.id} className="stat-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{member.name || member.email}</p>
                {member.position && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Briefcase className="w-3 h-3" /> {member.position}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRemoveMember(member.user_id, member.name || member.email)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {nonOwnerMembers.length === 0 && (
          <div className="stat-card p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun collaborateur ajouté</p>
            <p className="text-xs text-muted-foreground mt-1">Cliquez sur "Ajouter" pour inviter vos collaborateurs</p>
          </div>
        )}
      </div>
    </div>
  );
}
