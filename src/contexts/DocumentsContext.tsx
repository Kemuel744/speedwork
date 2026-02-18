import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DocumentData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReminderData {
  id: string;
  document_id: string;
  sent_at: string;
  reminder_type: string;
  status: string;
  message: string | null;
}

interface DocumentsContextType {
  documents: DocumentData[];
  loading: boolean;
  addDocument: (doc: DocumentData) => Promise<void>;
  updateDocument: (id: string, doc: Partial<DocumentData>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => DocumentData | undefined;
  getReminders: (documentId: string) => Promise<ReminderData[]>;
  sendManualReminder: (documentId: string) => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

function docToRow(doc: DocumentData, userId: string) {
  return {
    id: doc.id,
    user_id: userId,
    number: doc.number,
    type: doc.type,
    status: doc.status,
    date: doc.date,
    due_date: doc.dueDate || null,
    subject: doc.subject || null,
    client_name: doc.client.name,
    client_email: doc.client.email,
    client_phone: doc.client.phone,
    client_address: doc.client.address,
    company_name: doc.company.name,
    company_email: doc.company.email,
    company_phone: doc.company.phone,
    company_address: doc.company.address,
    company_logo: doc.company.logo || null,
    company_logo_position: doc.company.logoPosition || 'left',
    company_iban: doc.company.iban || '',
    company_bic: doc.company.bic || '',
    company_bank_name: doc.company.bankName || '',
    company_currency: doc.company.currency || 'XOF',
    company_signatory_title: doc.company.signatoryTitle || 'Le Directeur Général',
    company_description: doc.company.description || '',
    company_brand_colors: doc.company.brandColors || {},
    company_document_template: doc.company.documentTemplate || 'moderne',
    company_custom_note: doc.company.customNote || '',
    items: doc.items as any,
    subtotal: doc.subtotal,
    labor_cost: doc.laborCost,
    tax_rate: doc.taxRate,
    tax_amount: doc.taxAmount,
    withholding_rate: doc.withholdingRate,
    withholding_amount: doc.withholdingAmount,
    total: doc.total,
  };
}

function rowToDoc(row: any): DocumentData {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    status: row.status,
    date: row.date,
    dueDate: row.due_date || undefined,
    subject: row.subject || undefined,
    client: {
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone || '',
      address: row.client_address || '',
    },
    company: {
      name: row.company_name,
      email: row.company_email,
      phone: row.company_phone || '',
      address: row.company_address || '',
      logo: row.company_logo || undefined,
      logoPosition: row.company_logo_position || 'left',
      iban: row.company_iban || '',
      bic: row.company_bic || '',
      bankName: row.company_bank_name || '',
      currency: row.company_currency || 'XOF',
      signatoryTitle: row.company_signatory_title || 'Le Directeur Général',
      description: row.company_description || '',
      brandColors: row.company_brand_colors && Object.keys(row.company_brand_colors).length > 0 ? row.company_brand_colors : undefined,
      documentTemplate: row.company_document_template || 'moderne',
      customNote: row.company_custom_note || '',
    },
    items: row.items || [],
    subtotal: Number(row.subtotal),
    laborCost: Number(row.labor_cost),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    withholdingRate: Number(row.withholding_rate),
    withholdingAmount: Number(row.withholding_amount),
    total: Number(row.total),
    createdBy: row.user_id,
    clientId: '',
  };
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments((data || []).map(rowToDoc));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocument = useCallback(async (doc: DocumentData) => {
    if (!user) return;
    const row = docToRow(doc, user.id);
    const { error } = await supabase.from('documents').insert(row as any);
    if (error) {
      console.error('Error adding document:', error);
      throw error;
    }
    await fetchDocuments();
  }, [user, fetchDocuments]);

  const updateDocument = useCallback(async (id: string, updates: Partial<DocumentData>) => {
    if (!user) return;
    // Build partial row from the full updated doc
    const existing = documents.find(d => d.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    const row = docToRow(merged, user.id);
    const { id: _id, user_id, ...updateData } = row;
    const { error } = await supabase.from('documents').update(updateData as any).eq('id', id);
    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }
    await fetchDocuments();
  }, [user, documents, fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
    await fetchDocuments();
  }, [fetchDocuments]);

  const getDocument = useCallback((id: string) => {
    return documents.find(d => d.id === id);
  }, [documents]);

  const getReminders = useCallback(async (documentId: string): Promise<ReminderData[]> => {
    const { data, error } = await supabase
      .from('invoice_reminders')
      .select('*')
      .eq('document_id', documentId)
      .order('sent_at', { ascending: false });
    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
    return data || [];
  }, []);

  const sendManualReminder = useCallback(async (documentId: string) => {
    if (!user) return;
    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    const message = `Bonjour ${doc.client.name},\n\nNous vous rappelons que la facture ${doc.number} d'un montant de ${doc.total} ${doc.company.currency || 'XOF'} est en attente de règlement.\n\nMerci de procéder au paiement dans les meilleurs délais.\n\nCordialement.`;

    const { error } = await supabase.from('invoice_reminders').insert({
      document_id: documentId,
      user_id: user.id,
      reminder_type: 'manual',
      status: 'sent',
      message,
    } as any);

    if (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }, [user, documents]);

  return (
    <DocumentsContext.Provider value={{ documents, loading, addDocument, updateDocument, deleteDocument, getDocument, getReminders, sendManualReminder }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments must be used within DocumentsProvider');
  return ctx;
}
