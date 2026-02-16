import React from 'react';
import { DocumentData, DocumentTemplate } from '@/types';
import { formatAmount } from '@/lib/currencies';
import { isColorDark, lightenColor } from '@/lib/colorExtractor';

interface Props {
  doc: DocumentData;
}

export default function DocumentPreview({ doc }: Props) {
  const colors = doc.company.brandColors;
  const template = doc.company.documentTemplate || 'moderne';
  const logoPos = doc.company.logoPosition || 'left';
  const currency = doc.company.currency || 'EUR';

  const primary = colors?.primary || '#1e40af';
  const secondary = colors?.secondary || '#3b82f6';
  const accent = colors?.accent || '#f59e0b';
  const primaryLight = lightenColor(primary, 0.92);
  const primaryMedium = lightenColor(primary, 0.85);
  const textOnPrimary = isColorDark(primary) ? '#ffffff' : '#1a1a1a';

  const renderModerne = () => (
    <div className="w-full">
      {/* Header band */}
      <div className="rounded-t-lg px-6 py-4 flex items-center justify-between" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-4">
          {doc.company.logo && logoPos !== 'right' && (
            <img src={doc.company.logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
          )}
          <div style={{ color: textOnPrimary }}>
            <h2 className="text-lg font-bold">{doc.company.name}</h2>
            <p className="text-xs opacity-80">{doc.company.email}</p>
          </div>
        </div>
        <div className="text-right" style={{ color: textOnPrimary }}>
          <h3 className="text-base font-bold uppercase">{doc.type === 'invoice' ? 'Facture' : 'Devis'}</h3>
          <p className="text-xs font-medium">{doc.number}</p>
        </div>
        {doc.company.logo && logoPos === 'right' && (
          <img src={doc.company.logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Company + Client row */}
        <div className="flex justify-between gap-6">
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>{doc.company.address}</p>
            <p>{doc.company.phone}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: primaryLight }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: primary }}>Facturer à</p>
            <p className="font-semibold text-sm">{doc.client.name}</p>
            <p className="text-xs text-gray-600">{doc.client.address}</p>
            <p className="text-xs text-gray-600">{doc.client.email}</p>
            <p className="text-xs text-gray-600">{doc.client.phone}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-6 text-xs">
          <div><span className="text-gray-500">Date : </span><span className="font-medium">{doc.date}</span></div>
          {doc.dueDate && <div><span className="text-gray-500">Échéance : </span><span className="font-medium">{doc.dueDate}</span></div>}
        </div>

        {doc.subject && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Objet</p>
            <p className="text-xs font-medium">{doc.subject}</p>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: primary }}>
              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: textOnPrimary }}>Description</th>
              <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: textOnPrimary }}>Qté</th>
              <th className="text-right py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: textOnPrimary }}>P.U.</th>
              <th className="text-right py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: textOnPrimary }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : primaryLight }}>
                <td className="py-2 px-3 text-xs">{item.description}</td>
                <td className="py-2 px-3 text-xs text-center">{item.quantity}</td>
                <td className="py-2 px-3 text-xs text-right">{formatAmount(item.unitPrice, currency)}</td>
                <td className="py-2 px-3 text-xs text-right font-medium">{formatAmount(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {renderTotals()}
        {renderSignature()}
        {renderFooter()}
      </div>
    </div>
  );

  const renderClassique = () => (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Classic header with border */}
      <div className="border-b-2 pb-4" style={{ borderColor: primary }}>
        <div className="flex justify-between items-start">
          <div>
            {doc.company.logo && (
              <div className={`mb-2 flex ${logoPos === 'center' ? 'justify-center' : logoPos === 'right' ? 'justify-end' : 'justify-start'}`}>
                <img src={doc.company.logo} alt="Logo" className="h-12 w-auto max-w-[160px] object-contain" />
              </div>
            )}
            <h2 className="text-lg font-bold" style={{ color: primary }}>{doc.company.name}</h2>
            <p className="text-xs text-gray-600">{doc.company.address}</p>
            <p className="text-xs text-gray-600">{doc.company.phone} — {doc.company.email}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold uppercase" style={{ color: primary }}>
              {doc.type === 'invoice' ? 'Facture' : 'Devis'}
            </h3>
            <p className="text-sm font-medium mt-1">{doc.number}</p>
            <p className="text-xs text-gray-500 mt-2">Date : {doc.date}</p>
            {doc.dueDate && <p className="text-xs text-gray-500">Échéance : {doc.dueDate}</p>}
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="border rounded-lg p-3" style={{ borderColor: lightenColor(primary, 0.7) }}>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: primary }}>Facturer à</p>
        <p className="font-semibold text-sm">{doc.client.name}</p>
        <p className="text-xs text-gray-600">{doc.client.address}</p>
        <p className="text-xs text-gray-600">{doc.client.email} — {doc.client.phone}</p>
      </div>

      {doc.subject && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Objet</p>
          <p className="text-xs font-medium">{doc.subject}</p>
        </div>
      )}

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-[10px] font-semibold uppercase border-b-2" style={{ borderColor: primary, color: primary }}>Description</th>
            <th className="text-center py-2 px-2 text-[10px] font-semibold uppercase border-b-2" style={{ borderColor: primary, color: primary }}>Qté</th>
            <th className="text-right py-2 px-2 text-[10px] font-semibold uppercase border-b-2" style={{ borderColor: primary, color: primary }}>P.U.</th>
            <th className="text-right py-2 px-2 text-[10px] font-semibold uppercase border-b-2" style={{ borderColor: primary, color: primary }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map(item => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-1.5 px-2 text-xs">{item.description}</td>
              <td className="py-1.5 px-2 text-xs text-center">{item.quantity}</td>
              <td className="py-1.5 px-2 text-xs text-right">{formatAmount(item.unitPrice, currency)}</td>
              <td className="py-1.5 px-2 text-xs text-right font-medium">{formatAmount(item.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderTotals()}
      {renderSignature()}
      {renderFooter()}
    </div>
  );

  const renderMinimaliste = () => (
    <div className="w-full px-8 py-6 space-y-6">
      {/* Ultra-clean header */}
      <div className="flex justify-between items-start">
        <div>
          {doc.company.logo && (
            <img src={doc.company.logo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain mb-3" />
          )}
          <h2 className="text-sm font-semibold text-gray-800">{doc.company.name}</h2>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-medium uppercase tracking-widest" style={{ color: primary }}>
            {doc.type === 'invoice' ? 'Facture' : 'Devis'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{doc.number}</p>
        </div>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: lightenColor(primary, 0.7) }} />

      <div className="flex justify-between text-xs text-gray-600">
        <div>
          <p>{doc.company.address}</p>
          <p>{doc.company.phone} — {doc.company.email}</p>
        </div>
        <div className="text-right">
          <p>Date : {doc.date}</p>
          {doc.dueDate && <p>Échéance : {doc.dueDate}</p>}
        </div>
      </div>

      {/* Client */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Client</p>
        <p className="text-sm font-medium">{doc.client.name}</p>
        <p className="text-xs text-gray-600">{doc.client.address}</p>
        <p className="text-xs text-gray-600">{doc.client.email}</p>
      </div>

      {doc.subject && <p className="text-xs italic text-gray-600">{doc.subject}</p>}

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Description</th>
            <th className="text-center py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Qté</th>
            <th className="text-right py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">P.U.</th>
            <th className="text-right py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map(item => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2 text-xs">{item.description}</td>
              <td className="py-2 text-xs text-center">{item.quantity}</td>
              <td className="py-2 text-xs text-right">{formatAmount(item.unitPrice, currency)}</td>
              <td className="py-2 text-xs text-right font-medium">{formatAmount(item.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderTotals()}
      {renderSignature()}
      {renderFooter()}
    </div>
  );

  const renderCorporate = () => (
    <div className="w-full">
      {/* Corporate header: side color bar */}
      <div className="flex">
        <div className="w-2 shrink-0" style={{ backgroundColor: primary }} />
        <div className="flex-1 px-6 py-4 flex justify-between items-center" style={{ backgroundColor: primaryLight }}>
          <div className="flex items-center gap-4">
            {doc.company.logo && (
              <img src={doc.company.logo} alt="Logo" className="h-12 w-auto max-w-[140px] object-contain" />
            )}
            <div>
              <h2 className="text-lg font-bold" style={{ color: primary }}>{doc.company.name}</h2>
              <p className="text-xs text-gray-600">{doc.company.address}</p>
              <p className="text-xs text-gray-600">{doc.company.phone} — {doc.company.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-2 rounded" style={{ backgroundColor: primary }}>
              <h3 className="text-sm font-bold uppercase" style={{ color: textOnPrimary }}>
                {doc.type === 'invoice' ? 'Facture' : 'Devis'}
              </h3>
              <p className="text-xs font-medium" style={{ color: textOnPrimary, opacity: 0.9 }}>{doc.number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="flex justify-between gap-6">
          <div className="flex gap-6 text-xs text-gray-500">
            <div><span>Date : </span><span className="font-medium text-gray-800">{doc.date}</span></div>
            {doc.dueDate && <div><span>Échéance : </span><span className="font-medium text-gray-800">{doc.dueDate}</span></div>}
          </div>
        </div>

        {/* Client */}
        <div className="p-3 rounded" style={{ backgroundColor: primaryLight, borderLeft: `3px solid ${primary}` }}>
          <p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: primary }}>Destinataire</p>
          <p className="font-semibold text-sm">{doc.client.name}</p>
          <p className="text-xs text-gray-600">{doc.client.address}</p>
          <p className="text-xs text-gray-600">{doc.client.email} — {doc.client.phone}</p>
        </div>

        {doc.subject && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Objet</p>
            <p className="text-xs font-medium">{doc.subject}</p>
          </div>
        )}

        {/* Table */}
        <table className="w-full border" style={{ borderColor: lightenColor(primary, 0.7) }}>
          <thead>
            <tr style={{ backgroundColor: primaryMedium }}>
              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: primary }}>Description</th>
              <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: primary }}>Qté</th>
              <th className="text-right py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: primary }}>P.U.</th>
              <th className="text-right py-2 px-3 text-[10px] font-semibold uppercase" style={{ color: primary }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <tr key={item.id} className="border-t" style={{ borderColor: lightenColor(primary, 0.8), backgroundColor: i % 2 === 0 ? '#fff' : primaryLight }}>
                <td className="py-1.5 px-3 text-xs">{item.description}</td>
                <td className="py-1.5 px-3 text-xs text-center">{item.quantity}</td>
                <td className="py-1.5 px-3 text-xs text-right">{formatAmount(item.unitPrice, currency)}</td>
                <td className="py-1.5 px-3 text-xs text-right font-medium">{formatAmount(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {renderTotals()}
        {renderSignature()}
        {renderFooter()}
      </div>
    </div>
  );

  const renderTotals = () => (
    <div className="flex justify-end">
      <div className="w-full sm:w-64 space-y-1">
        {(doc.laborCost ?? 0) > 0 && (
          <div className="flex justify-between text-xs"><span className="text-gray-500">Main d'œuvre</span><span>{formatAmount(doc.laborCost, currency)}</span></div>
        )}
        <div className="flex justify-between text-xs"><span className="text-gray-500">Sous-total</span><span>{formatAmount(doc.subtotal, currency)}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">TVA ({doc.taxRate}%)</span><span>{formatAmount(doc.taxAmount, currency)}</span></div>
        {(doc.withholdingRate ?? 0) > 0 && (
          <div className="flex justify-between text-xs"><span className="text-gray-500">Retenue ({doc.withholdingRate}%)</span><span className="text-red-600">-{formatAmount(doc.withholdingAmount, currency)}</span></div>
        )}
        <div className="flex justify-between text-sm font-bold pt-2 border-t-2" style={{ borderColor: primary }}>
          <span>Total</span>
          <span style={{ color: primary }}>{formatAmount(doc.total, currency)}</span>
        </div>
      </div>
    </div>
  );

  const renderSignature = () => (
    <div className="mt-6 flex justify-end">
      <div className="text-center w-56">
        <p className="text-xs font-semibold mb-10">{doc.company.signatoryTitle || 'Le Directeur Général'}</p>
        <div className="border-t border-gray-300 pt-1">
          <p className="text-[10px] text-gray-500">Signature et cachet</p>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="mt-4 pt-3 border-t" style={{ borderColor: lightenColor(primary, 0.7) }}>
      <div className="flex flex-wrap justify-between gap-3 text-[10px] text-gray-500">
        <div>
          <p className="font-semibold text-gray-700 mb-0.5">{doc.company.name}</p>
          <p>{doc.company.address}</p>
          <p>{doc.company.email} — {doc.company.phone}</p>
        </div>
        {(doc.company.iban || doc.company.bic || doc.company.bankName) && (
          <div className="text-right">
            <p className="font-semibold text-gray-700 mb-0.5">Coordonnées bancaires</p>
            {doc.company.bankName && <p>Banque : {doc.company.bankName}</p>}
            {doc.company.iban && <p>IBAN : {doc.company.iban}</p>}
            {doc.company.bic && <p>BIC : {doc.company.bic}</p>}
          </div>
        )}
      </div>
    </div>
  );

  const templateRenderers: Record<DocumentTemplate, () => React.ReactNode> = {
    moderne: renderModerne,
    classique: renderClassique,
    minimaliste: renderMinimaliste,
    corporate: renderCorporate,
  };

  return (
    <div className="a4-preview bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 w-full max-w-[210mm] overflow-hidden print:shadow-none print:border-none print:rounded-none">
      {templateRenderers[template]()}
    </div>
  );
}
