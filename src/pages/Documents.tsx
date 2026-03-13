import React, { useState, useMemo } from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Plus, FileText, FileCheck, Trash2, Copy, ArrowUpDown, Mail, MessageCircle } from 'lucide-react';
import { sendDocumentByEmail, sendDocumentByWhatsApp } from '@/lib/emailHelper';
import { getOrCreateShareUrl } from '@/lib/shareHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Documents() {
  const { documents, deleteDocument, addDocument } = useDocuments();
  const { displayAmount } = useCurrency();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') as 'invoice' | 'quote' | null;
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [clientFilter, setClientFilter] = useState('');

  const statusMap: Record<string, { label: string; class: string }> = {
    paid: { label: t('status.paid'), class: 'bg-success/10 text-success border-success/20' },
    unpaid: { label: t('status.unpaid'), class: 'bg-destructive/10 text-destructive border-destructive/20' },
    pending: { label: t('status.pending'), class: 'bg-warning/10 text-warning border-warning/20' },
    draft: { label: t('status.draft'), class: 'bg-muted text-muted-foreground border-border' },
  };

  const clientNames = useMemo(() => {
    const names = new Set(documents.map(d => d.client.name));
    return Array.from(names).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    let docs = documents;
    if (typeFilter) docs = docs.filter(d => d.type === typeFilter);
    if (clientFilter) docs = docs.filter(d => d.client.name === clientFilter);
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d => d.number.toLowerCase().includes(q) || d.client.name.toLowerCase().includes(q));
    }
    return docs.sort((a, b) => sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [documents, typeFilter, clientFilter, search, sortAsc]);

  const handleDuplicate = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    const newDoc = {
      ...doc,
      id: crypto.randomUUID(),
      number: doc.number + '-COPIE',
      status: 'draft' as const,
      date: new Date().toISOString().split('T')[0],
    };
    try {
      await addDocument(newDoc);
      toast.success(t('documents.duplicated'));
    } catch {
      toast.error(t('documents.linkError'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success(t('documents.deleted'));
    } catch {
      toast.error(t('documents.linkError'));
    }
  };

  const title = typeFilter === 'invoice' ? t('documents.invoicesTitle') : typeFilter === 'quote' ? t('documents.quotesTitle') : t('documents.title');

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="section-title">{title}</h1>
        <div className="flex gap-2">
          {typeFilter === 'quote' ? (
            <Button asChild>
              <Link to="/create/quote"><Plus className="w-4 h-4 mr-2" />{t('documents.newQuote')}</Link>
            </Button>
          ) : typeFilter === 'invoice' ? (
            <Button asChild>
              <Link to="/create/invoice"><Plus className="w-4 h-4 mr-2" />{t('documents.newInvoice')}</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link to="/create/invoice"><FileText className="w-4 h-4 mr-2" />{t('documents.newInvoice')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/create/quote"><FileCheck className="w-4 h-4 mr-2" />{t('documents.newQuote')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="stat-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('documents.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSortAsc(!sortAsc)}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortAsc ? t('documents.oldest') : t('documents.newest')}
          </Button>
          <Select value={clientFilter} onValueChange={v => setClientFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('documents.allClients')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('documents.allClients')}</SelectItem>
              {clientNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{t('documents.noDocuments')}</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('documents.number')}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t('documents.client')}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t('common.date')}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.total')}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const st = statusMap[doc.status];
                  return (
                    <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/document/${doc.id}`} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                          {doc.type === 'invoice' ? <FileText className="w-4 h-4 text-primary shrink-0" /> : <FileCheck className="w-4 h-4 text-accent shrink-0" />}
                          <span className="truncate">{doc.number}</span>
                        </Link>
                        <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{doc.client.name}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground hidden sm:table-cell">{doc.client.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{doc.date}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className={`text-xs ${st.class}`}>{st.label}</Badge></td>
                      <td className="py-3 px-4 text-sm font-semibold text-foreground text-right">{displayAmount(doc.total, doc.company.currency)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title={t('documents.sendEmail')} onClick={async () => {
                            try {
                              const shareUrl = await getOrCreateShareUrl(doc.id);
                              sendDocumentByEmail({
                                recipientEmail: doc.client.email,
                                recipientName: doc.client.name,
                                documentType: doc.type,
                                documentNumber: doc.number,
                                companyName: doc.company?.name || 'SpeedWork',
                                shareUrl,
                              });
                            } catch { toast.error(t('documents.linkError')); }
                          }}>
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" title={t('documents.sendWhatsApp')} onClick={async () => {
                            try {
                              const shareUrl = await getOrCreateShareUrl(doc.id);
                              sendDocumentByWhatsApp({
                                recipientPhone: doc.client.phone,
                                recipientName: doc.client.name,
                                documentType: doc.type,
                                documentNumber: doc.number,
                                companyName: doc.company?.name || 'SpeedWork',
                                shareUrl,
                              });
                            } catch { toast.error(t('documents.linkError')); }
                          }}>
                            <MessageCircle className="w-3.5 h-3.5 text-success" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(doc.id)} title={t('common.duplicate')}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title={t('common.delete')}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('documents.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('documents.deleteDesc')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc.id)}>{t('common.delete')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
