import React, { useMemo } from 'react';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { formatAmount } from '@/lib/currencies';
import { Link } from 'react-router-dom';
import { Users, FileText, FileCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  invoiceCount: number;
  quoteCount: number;
  totalPaid: number;
  totalUnpaid: number;
  totalAmount: number;
}

export default function ClientsPage() {
  const { documents } = useDocuments();
  const { company } = useCompany();

  const clients = useMemo(() => {
    const map = new Map<string, ClientSummary>();
    documents.forEach(doc => {
      const key = doc.client.email || doc.client.name;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: doc.client.name,
          email: doc.client.email,
          phone: doc.client.phone,
          address: doc.client.address,
          invoiceCount: 0,
          quoteCount: 0,
          totalPaid: 0,
          totalUnpaid: 0,
          totalAmount: 0,
        });
      }
      const c = map.get(key)!;
      if (doc.type === 'invoice') {
        c.invoiceCount++;
        if (doc.status === 'paid') c.totalPaid += doc.total;
        else c.totalUnpaid += doc.total;
      } else {
        c.quoteCount++;
      }
      c.totalAmount += doc.total;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} client(s) au total</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="stat-card text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun client trouvé. Créez une facture ou un devis pour ajouter un client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <Link
              key={client.id}
              to={`/clients/${encodeURIComponent(client.id)}`}
              className="stat-card hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />{client.invoiceCount} facture(s)
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <FileCheck className="w-3 h-3 mr-1" />{client.quoteCount} devis
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total encaissé</p>
                  <p className="font-semibold text-success">{formatAmount(client.totalPaid, company.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total dû</p>
                  <p className="font-semibold text-destructive">{formatAmount(client.totalUnpaid, company.currency)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
