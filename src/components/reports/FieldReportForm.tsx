import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Camera, Plus, Trash2, X, Users, MapPin, FileText, Download,
  ClipboardList, Image as ImageIcon, UserCircle, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReportImage {
  id: string;
  file?: File;
  previewUrl: string;
  caption: string;
  uploaded?: boolean;
  image_url?: string;
}

interface Worker {
  name: string;
  role: string;
}

interface FieldReportData {
  id?: string;
  title: string;
  subject: string;
  intervention_location: string;
  intervention_date: string;
  reporter_name: string;
  reporter_position: string;
  workers: Worker[];
  observations: string;
  recommendations: string;
  images: ReportImage[];
}

const EMPTY_REPORT: FieldReportData = {
  title: '',
  subject: '',
  intervention_location: '',
  intervention_date: format(new Date(), 'yyyy-MM-dd'),
  reporter_name: '',
  reporter_position: '',
  workers: [],
  observations: '',
  recommendations: '',
  images: [],
};

interface Props {
  onSaved?: () => void;
  editReport?: any;
}

export default function FieldReportForm({ onSaved, editReport }: Props) {
  const { user } = useAuth();
  const { company } = useCompany();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FieldReportData>(() => {
    if (editReport) {
      return {
        id: editReport.id,
        title: editReport.title || '',
        subject: editReport.subject || '',
        intervention_location: editReport.intervention_location || '',
        intervention_date: editReport.intervention_date || format(new Date(), 'yyyy-MM-dd'),
        reporter_name: editReport.reporter_name || '',
        reporter_position: editReport.reporter_position || '',
        workers: editReport.workers || [],
        observations: editReport.observations || '',
        recommendations: editReport.recommendations || '',
        images: (editReport._images || []).map((img: any) => ({
          id: img.id,
          previewUrl: img.image_url, // temporary, will be resolved via effect
          caption: img.caption || '',
          uploaded: true,
          image_url: img.image_url,
        })),
      };
    }
    return { ...EMPTY_REPORT, reporter_name: user?.name || '' };
  });

  // Resolve signed URLs for private bucket images
  useEffect(() => {
    if (!editReport?._images?.length) return;
    const resolveUrls = async () => {
      const resolved = await Promise.all(
        form.images.map(async (img) => {
          if (img.uploaded && img.image_url && !img.image_url.startsWith('http')) {
            const { data } = await supabase.storage.from('report-images').createSignedUrl(img.image_url, 3600);
            if (data?.signedUrl) return { ...img, previewUrl: data.signedUrl };
          }
          return img;
        })
      );
      setForm(prev => ({ ...prev, images: resolved }));
    };
    resolveUrls();
  }, [editReport]); // eslint-disable-line react-hooks/exhaustive-deps

  const [workerInput, setWorkerInput] = useState({ name: '', role: '' });
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const updateField = (key: keyof FieldReportData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const addWorker = () => {
    if (!workerInput.name) return;
    updateField('workers', [...form.workers, { ...workerInput }]);
    setWorkerInput({ name: '', role: '' });
  };

  const removeWorker = (i: number) => updateField('workers', form.workers.filter((_, idx) => idx !== i));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ReportImage[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));
    updateField('images', [...form.images, ...newImages]);
    e.target.value = '';
  };

  const updateImageCaption = (id: string, caption: string) => {
    updateField('images', form.images.map(img => img.id === id ? { ...img, caption } : img));
  };

  const removeImage = (id: string) => {
    const img = form.images.find(i => i.id === id);
    if (img && !img.uploaded) URL.revokeObjectURL(img.previewUrl);
    updateField('images', form.images.filter(i => i.id !== id));
  };

  const uploadImage = async (img: ReportImage): Promise<string> => {
    if (img.uploaded && img.image_url) return img.image_url;
    if (!img.file || !user) throw new Error('No file');
    const ext = img.file.name.split('.').pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('report-images').upload(path, img.file);
    if (error) throw error;
    // Store the path (not public URL) since bucket is now private
    return path;
  };

  const saveReport = async () => {
    if (!user) return;
    if (!form.title) { toast({ title: 'Erreur', description: 'Le titre est obligatoire', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      // Upload images
      const uploadedImages = await Promise.all(
        form.images.map(async (img, i) => ({ url: await uploadImage(img), caption: img.caption, sort_order: i }))
      );

      const reportData = {
        user_id: user.id,
        title: form.title,
        subject: form.subject,
        intervention_location: form.intervention_location,
        intervention_date: form.intervention_date,
        reporter_name: form.reporter_name,
        reporter_position: form.reporter_position,
        workers: form.workers as any,
        observations: form.observations,
        recommendations: form.recommendations,
        status: 'completed',
      };

      let reportId = form.id;

      if (reportId) {
        const { error } = await supabase.from('field_reports').update(reportData as any).eq('id', reportId);
        if (error) throw error;
        // Delete old images and re-insert
        await supabase.from('field_report_images').delete().eq('report_id', reportId);
      } else {
        const { data, error } = await supabase.from('field_reports').insert(reportData as any).select('id').single();
        if (error) throw error;
        reportId = data.id;
      }

      // Insert images
      if (uploadedImages.length > 0) {
        const imageRows = uploadedImages.map(img => ({
          report_id: reportId!,
          user_id: user.id,
          image_url: img.url,
          caption: img.caption,
          sort_order: img.sort_order,
        }));
        await supabase.from('field_report_images').insert(imageRows as any);
      }

      toast({ title: 'Rapport enregistré avec succès' });
      if (!editReport) setForm({ ...EMPTY_REPORT, reporter_name: user?.name || '' });
      onSaved?.();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = () => {
    setPreviewOpen(true);
    setTimeout(() => {
      const printContent = document.getElementById('field-report-print');
      if (!printContent) return;
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>${form.title || 'Rapport'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 0; }
          @page { size: A4; margin: 15mm; }
          .page { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .header-left { flex: 1; }
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
          .info-value { color: #1a1a1a; }
          .workers-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .workers-table th, .workers-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
          .workers-table th { background: #f0f4ff; font-weight: 600; color: #1e3a5f; }
          .text-block { font-size: 12px; line-height: 1.7; white-space: pre-wrap; color: #333; }
          .image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .image-item img { width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; }
          .image-caption { font-size: 11px; color: #555; margin-top: 4px; font-style: italic; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 2px solid #2563eb; display: flex; justify-content: space-between; font-size: 10px; color: #777; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>${printContent.innerHTML}</body></html>`);
      win.document.close();
      setTimeout(() => { win.print(); }, 500);
      setPreviewOpen(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Main info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />Informations du rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre du rapport *</Label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Ex: Rapport d'intervention chantier Bamako" />
          </div>
          <div>
            <Label>Objet</Label>
            <Input value={form.subject} onChange={e => updateField('subject', e.target.value)} placeholder="Ex: Inspection technique du site" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Lieu d'intervention</Label>
              <Input value={form.intervention_location} onChange={e => updateField('intervention_location', e.target.value)} placeholder="Ex: Chantier zone industrielle" />
            </div>
            <div>
              <Label>Date d'intervention</Label>
              <Input type="date" value={form.intervention_date} onChange={e => updateField('intervention_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" />Nom du rapporteur</Label>
              <Input value={form.reporter_name} onChange={e => updateField('reporter_name', e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <Label>Poste du rapporteur</Label>
              <Input value={form.reporter_position} onChange={e => updateField('reporter_position', e.target.value)} placeholder="Ex: Chef de chantier" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />Équipe sur le terrain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={workerInput.name} onChange={e => setWorkerInput(w => ({ ...w, name: e.target.value }))} placeholder="Nom du travailleur" className="flex-1" />
            <Input value={workerInput.role} onChange={e => setWorkerInput(w => ({ ...w, role: e.target.value }))} placeholder="Fonction (optionnel)" className="flex-1" />
            <Button size="sm" variant="outline" onClick={addWorker} disabled={!workerInput.name}>
              <Plus className="w-4 h-4 mr-1" />Ajouter
            </Button>
          </div>
          {form.workers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.workers.map((w, i) => (
                <Badge key={i} variant="secondary" className="gap-1 py-1 px-2.5 text-xs">
                  {w.name}{w.role && <span className="text-muted-foreground">({w.role})</span>}
                  <button onClick={() => removeWorker(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observations & Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />Contenu du rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Observations / Constatations</Label>
            <Textarea value={form.observations} onChange={e => updateField('observations', e.target.value)} placeholder="Décrivez les constatations faites sur le terrain..." rows={5} />
          </div>
          <div>
            <Label>Recommandations / Actions à mener</Label>
            <Textarea value={form.recommendations} onChange={e => updateField('recommendations', e.target.value)} placeholder="Actions recommandées suite aux observations..." rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />Photos & Illustrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-4 h-4 mr-1" />Galerie
            </Button>
            <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="w-4 h-4 mr-1" />Caméra
            </Button>
          </div>

          {form.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.images.map(img => (
                <div key={img.id} className="relative group rounded-lg border border-border overflow-hidden">
                  <img src={img.previewUrl} alt="" className="w-full h-48 object-cover" />
                  <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-2">
                    <Input
                      value={img.caption}
                      onChange={e => updateImageCaption(img.id, e.target.value)}
                      placeholder="Commentaire sur cette image..."
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={saveReport} disabled={saving} className="gap-1.5">
          <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer le rapport'}
        </Button>
        <Button variant="outline" onClick={generatePDF} disabled={!form.title} className="gap-1.5">
          <Download className="w-4 h-4" />Télécharger PDF
        </Button>
      </div>

      {/* Hidden print content */}
      <div className="hidden">
        <div id="field-report-print">
          <div className="page">
            <div className="header">
              <div className="header-left">
                <div className="company-name">{company.name}</div>
                <div className="company-info">
                  {company.address && <div>{company.address}</div>}
                  {company.phone && <div>Tél: {company.phone}</div>}
                  {company.email && <div>Email: {company.email}</div>}
                </div>
              </div>
              {company.logo && <img src={company.logo} alt="Logo" className="company-logo" />}
            </div>

            <div className="report-title">{form.title || 'Rapport d\'intervention'}</div>
            {form.subject && <div className="report-subject">{form.subject}</div>}

            <div className="section">
              <div className="section-title">Informations générales</div>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Date d'intervention:</span><span className="info-value">{form.intervention_date ? format(new Date(form.intervention_date), 'dd MMMM yyyy', { locale: fr }) : '—'}</span></div>
                <div className="info-item"><span className="info-label">Lieu:</span><span className="info-value">{form.intervention_location || '—'}</span></div>
                <div className="info-item"><span className="info-label">Rapporteur:</span><span className="info-value">{form.reporter_name || '—'}</span></div>
                <div className="info-item"><span className="info-label">Poste:</span><span className="info-value">{form.reporter_position || '—'}</span></div>
              </div>
            </div>

            {form.workers.length > 0 && (
              <div className="section">
                <div className="section-title">Équipe sur le terrain</div>
                <table className="workers-table">
                  <thead><tr><th>N°</th><th>Nom</th><th>Fonction</th></tr></thead>
                  <tbody>
                    {form.workers.map((w, i) => (
                      <tr key={i}><td>{i + 1}</td><td>{w.name}</td><td>{w.role || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {form.observations && (
              <div className="section">
                <div className="section-title">Observations & Constatations</div>
                <div className="text-block">{form.observations}</div>
              </div>
            )}

            {form.images.length > 0 && (
              <div className="section">
                <div className="section-title">Photos & Illustrations</div>
                <div className="image-grid">
                  {form.images.map(img => (
                    <div key={img.id} className="image-item">
                      <img src={img.previewUrl} alt={img.caption} />
                      {img.caption && <div className="image-caption">{img.caption}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.recommendations && (
              <div className="section">
                <div className="section-title">Recommandations</div>
                <div className="text-block">{form.recommendations}</div>
              </div>
            )}

            <div className="footer">
              <div>Rapport établi le {format(new Date(), 'dd/MM/yyyy', { locale: fr })} par {form.reporter_name || company.name}</div>
              <div>{company.name} — {company.phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
