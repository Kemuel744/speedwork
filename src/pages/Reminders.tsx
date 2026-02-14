import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { formatAmount } from '@/lib/currencies';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface OverdueInvoice {
  document_id: string;
  number: string;
  client_name: string;
  client_email: string;
  total: number;
  due_date: string;
  days_overdue: number;
  company_currency: string;
  reminder_count: number;
  last_reminder: string | null;
}

export default function Reminders() {
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { company } = useCompany();

  useEffect(() => {
    async function fetchOverdue() {
      setLoading(true);

      // Fetch all unpaid/pending invoices past due date
      const { data: docs, error } = await supabase
        .from('documents')
        .select('id, number, client_name, client_email, total, due_date, company_currency')
        .in('status', ['unpaid', 'pending'])
        .eq('type', 'invoice')
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching overdue invoices:', error);
        setLoading(false);
        return;
      }

      if (!docs || docs.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      // Fetch reminder counts for these documents
      const docIds = docs.map(d => d.id);
      const { data: reminders } = await supabase
        .from('invoice_reminders')
        .select('document_id, sent_at')
        .in('document_id', docIds);

      const reminderMap: Record<string, { count: number; last: string | null }> = {};
      (reminders || []).forEach(r => {
        if (!reminderMap[r.document_id]) {
          reminderMap[r.document_id] = { count: 0, last: null };
        }
        reminderMap[r.document_id].count++;
        if (!reminderMap[r.document_id].last || r.sent_at > reminderMap[r.document_id].last!) {
          reminderMap[r.document_id].last = r.sent_at;
        }
      });

      const today = new Date();
      const result: OverdueInvoice[] = docs.map(d => {
        const dueDate = new Date(d.due_date!);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const rm = reminderMap[d.id] || { count: 0, last: null };
        return {
          document_id: d.id,
          number: d.number,
          client_name: d.client_name,
          client_email: d.client_email,
          total: Number(d.total),
          due_date: d.due_date!,
          days_overdue: daysOverdue,
          company_currency: d.company_currency || company.currency,
          reminder_count: rm.count,
          last_reminder: rm.last,
        };
      });

      result.sort((a, b) => b.days_overdue - a.days_overdue);
      setInvoices(result);
      setLoading(false);
    }

    fetchOverdue();
  }, [company.currency]);

  const severityBadge = (days: number) => {
    if (days > 30) return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Critique</Badge>;
    if (days > 14) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Urgent</Badge>;
    return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">En retard</Badge>;
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Tableau de bord des relances</h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des factures en retard et des relances envoyées</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Factures en retard</span>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Relances envoyées</span>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{invoices.reduce((s, i) => s + i.reminder_count, 0)}</p>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Montant total dû</span>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/10 text-warning">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatAmount(invoices.reduce((s, i) => s + i.total, 0), company.currency)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card">
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Aucune facture en retard</p>
            <p className="text-sm text-muted-foreground mt-1">Toutes vos factures sont à jour !</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Retard</TableHead>
                <TableHead>Relances</TableHead>
                <TableHead>Dernière relance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.document_id}>
                  <TableCell className="font-medium">{inv.number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{inv.client_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.client_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatAmount(inv.total, inv.company_currency)}
                  </TableCell>
                  <TableCell className="text-sm">{inv.due_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {severityBadge(inv.days_overdue)}
                      <span className="text-sm text-muted-foreground">{inv.days_overdue}j</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{inv.reminder_count}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.last_reminder
                      ? new Date(inv.last_reminder).toLocaleDateString('fr-FR')
                      : 'Aucune'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/document/${inv.document_id}`}>
                        <FileText className="w-4 h-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
