import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Plus, Trash2, Eye, Download, MapPin, Calendar, ChevronLeft, Mail, MessageCircle } from 'lucide-react';
import { sendDocumentByEmail, sendDocumentByWhatsApp } from '@/lib/emailHelper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FieldReportForm from './FieldReportForm';

interface FieldReport {
  id: string;
  title: string;
  subject: string;
  intervention_location: string;
  intervention_date: string;
  reporter_name: string;
  reporter_position: string;
  workers: any[];
  observations: string;
  recommendations: string;
  status: string;
  created_at: string;
  _images?: any[];
}

export default function FieldReportsList() {
  const { user } = useAuth();
  const { company } = useCompany();
  const { toast } = useToast();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingReport, setEditingReport] = useState<FieldReport | null>(null);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('field_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); }
    else setReports((data || []) as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('field_reports').delete().eq('id', id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Rapport supprimé' }); fetchReports(); }
  };

  const openEdit = async (report: FieldReport) => {
    // Fetch images for this report
    const { data: images } = await supabase
      .from('field_report_images')
      .select('*')
      .eq('report_id', report.id)
      .order('sort_order');
    setEditingReport({ ...report, _images: images || [] });
    setView('edit');
  };

  const downloadReport = (report: FieldReport) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const workers = Array.isArray(report.workers) ? report.workers : [];
    win.document.write(`<!DOCTYPE html><html><head><title>${report.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; }
        @page { size: A4; margin: 15mm; }
        .page { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .company-name { font-size: 20px; font-weight: 700; color: #1e3a5f; }
        .company-info { font-size: 11px; color: #555; margin-top: 4px; line-height: 1.5; }
        .company-logo { max-height: 60px; max-width: 120px; object-fit: contain; }
        .report-title { font-size: 22px; font-weight: 700; text-align: center; margin: 20px 0 8px; color: #1e3a5f; }
        .report-subject { font-size: 14px; text-align: center; color: #444; margin-bottom: 24px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
        .info-item { display: flex; gap: 6px; font-size: 12px; }
        .info-label { font-weight: 600; color: #555; min-width: 120px; }
        .workers-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .workers-table th, .workers-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        .workers-table th { background: #f0f4ff; font-weight: 600; color: #1e3a5f; }
        .text-block { font-size: 12px; line-height: 1.7; white-space: pre-wrap; color: #333; }
        .footer { margin-top: 40px; padding-top: 12px; border-top: 2px solid #2563eb; display: flex; justify-content: space-between; font-size: 10px; color: #777; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body><div class="page">
      <div class="header">
        <div><div class="company-name">${company.name}</div>
          <div class="company-info">${company.address ? `<div>${company.address}</div>` : ''}${company.phone ? `<div>Tél: ${company.phone}</div>` : ''}${company.email ? `<div>${company.email}</div>` : ''}</div>
        </div>
        ${company.logo ? `<img src="${company.logo}" alt="Logo" class="company-logo" />` : ''}
      </div>
      <div class="report-title">${report.title}</div>
      ${report.subject ? `<div class="report-subject">${report.subject}</div>` : ''}
      <div class="section"><div class="section-title">Informations générales</div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Date:</span><span>${report.intervention_date ? format(new Date(report.intervention_date), 'dd MMMM yyyy', { locale: fr }) : '—'}</span></div>
          <div class="info-item"><span class="info-label">Lieu:</span><span>${report.intervention_location || '—'}</span></div>
          <div class="info-item"><span class="info-label">Rapporteur:</span><span>${report.reporter_name || '—'}</span></div>
          <div class="info-item"><span class="info-label">Poste:</span><span>${report.reporter_position || '—'}</span></div>
        </div>
      </div>
      ${workers.length > 0 ? `<div class="section"><div class="section-title">Équipe</div><table class="workers-table"><thead><tr><th>N°</th><th>Nom</th><th>Fonction</th></tr></thead><tbody>${workers.map((w: any, i: number) => `<tr><td>${i + 1}</td><td>${w.name}</td><td>${w.role || '—'}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${report.observations ? `<div class="section"><div class="section-title">Observations</div><div class="text-block">${report.observations}</div></div>` : ''}
      ${report.recommendations ? `<div class="section"><div class="section-title">Recommandations</div><div class="text-block">${report.recommendations}</div></div>` : ''}
      <div class="footer"><div>Rapport du ${format(new Date(report.created_at), 'dd/MM/yyyy', { locale: fr })}</div><div>${company.name}</div></div>
    </div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (view === 'create') {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView('list')}>
          <ChevronLeft className="w-4 h-4" />Retour à la liste
        </Button>
        <FieldReportForm onSaved={() => { setView('list'); fetchReports(); }} />
      </div>
    );
  }

  if (view === 'edit' && editingReport) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => { setView('list'); setEditingReport(null); }}>
          <ChevronLeft className="w-4 h-4" />Retour à la liste
        </Button>
        <FieldReportForm editReport={editingReport} onSaved={() => { setView('list'); setEditingReport(null); fetchReports(); }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Rapports d'intervention</h2>
        <Button size="sm" onClick={() => setView('create')}><Plus className="w-4 h-4 mr-1" />Nouveau rapport</Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Chargement...</CardContent></Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun rapport d'intervention</p>
            <Button size="sm" className="mt-4" onClick={() => setView('create')}><Plus className="w-4 h-4 mr-1" />Créer votre premier rapport</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const workers = Array.isArray(r.workers) ? r.workers : [];
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
                      {r.subject && <p className="text-sm text-muted-foreground mt-0.5 truncate">{r.subject}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(r.intervention_date), 'dd/MM/yyyy')}</span>
                        {r.intervention_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.intervention_location}</span>}
                        {workers.length > 0 && <Badge variant="secondary" className="text-xs">{workers.length} intervenant(s)</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadReport(r)}><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" title="Envoyer par email" onClick={() => sendDocumentByEmail({
                        recipientEmail: '',
                        recipientName: '',
                        documentType: 'report',
                        companyName: company.name,
                        subject: `Rapport: ${r.title} — ${company.name}`,
                        body: `Bonjour,\n\nVeuillez trouver le rapport d'intervention "${r.title}".\n\nLieu: ${r.intervention_location || 'N/A'}\nDate: ${r.intervention_date}\n\n💡 Pour télécharger le PDF, ouvrez le rapport depuis l'application et utilisez le bouton Télécharger.\n\nCordialement,\n${company.name}`,
                      })}><Mail className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" title="Envoyer par WhatsApp" onClick={() => sendDocumentByWhatsApp({
                        recipientName: '',
                        documentType: 'report',
                        companyName: company.name,
                        message: `Bonjour,\n\nVeuillez trouver le rapport d'intervention "${r.title}".\n\nLieu: ${r.intervention_location || 'N/A'}\nDate: ${r.intervention_date}\n\n💡 Pour télécharger le PDF, ouvrez le rapport depuis l'application et utilisez le bouton Télécharger.\n\nCordialement,\n${company.name}`,
                      })}><MessageCircle className="w-4 h-4 text-green-600" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteReport(r.id)}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
