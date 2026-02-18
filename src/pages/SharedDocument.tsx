import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DocumentPreview from '@/components/document/DocumentPreview';
import { DocumentData } from '@/types';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function SharedDocument() {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSharedDoc() {
      if (!token) { setError(true); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from('documents')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();
      if (err || !data) { setError(true); }
      else { setDoc(rowToDoc(data)); }
      setLoading(false);
    }
    fetchSharedDoc();
  }, [token]);

  const handlePrint = () => {
    if (doc) {
      const originalTitle = document.title;
      document.title = doc.number;
      window.print();
      document.title = originalTitle;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement du document...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Document introuvable</h1>
          <p className="text-gray-500">Ce lien de partage est invalide ou a expiré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h1 className="text-lg font-semibold text-gray-800">
            {doc.type === 'invoice' ? 'Facture' : 'Devis'} {doc.number}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />Imprimer
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />Télécharger PDF
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <DocumentPreview doc={doc} />
        </div>
      </div>
    </div>
  );
}
