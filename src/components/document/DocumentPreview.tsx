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
  const currency = doc.company.currency || 'XAF';

  const primary = colors?.primary || '#1e40af';
  const _secondary = colors?.secondary || '#3b82f6';
  const _accent = colors?.accent || '#f59e0b';
  const primaryLight = lightenColor(primary, 0.92);
  const primaryMedium = lightenColor(primary, 0.85);
  const primarySoft = lightenColor(primary, 0.95);
  const textOnPrimary = isColorDark(primary) ? '#ffffff' : '#1a1a1a';
  const docLabel = doc.type === 'invoice' ? 'FACTURE' : 'DEVIS';

  // Shared sub-components
  const renderCompanyClientBlock = () => (
    <div className="flex justify-between gap-6 mt-5">
      <div className="text-xs text-gray-600 leading-relaxed">
        <p className="font-medium text-gray-800">{doc.company.address}</p>
        {doc.company.description && <p className="text-[10px] text-gray-500 italic mt-0.5">{doc.company.description}</p>}
        {doc.company.phone && <p>{doc.company.phone}</p>}
      </div>
      <div
        className="p-3 rounded-lg border min-w-[200px]"
        style={{ backgroundColor: primarySoft, borderColor: lightenColor(primary, 0.7) }}
      >
        <p
          className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
          style={{ color: primary }}
        >
          Facturer à
        </p>
        <p className="font-bold text-sm text-gray-900">{doc.client.name}</p>
        {doc.client.address && <p className="text-xs text-gray-600 mt-0.5">{doc.client.address}</p>}
        {doc.client.email && <p className="text-xs text-gray-600">{doc.client.email}</p>}
        {doc.client.phone && <p className="text-xs text-gray-600">{doc.client.phone}</p>}
      </div>
    </div>
  );

  const renderDateSubject = () => (
    <div className="mt-5 space-y-3">
      <div className="flex gap-8 text-xs">
        <div>
          <span className="text-gray-500">Date : </span>
          <span className="font-semibold text-gray-800">{doc.date}</span>
        </div>
        {doc.dueDate && (
          <div>
            <span className="text-gray-500">Échéance : </span>
            <span className="font-semibold text-gray-800">{doc.dueDate}</span>
          </div>
        )}
      </div>
      {doc.subject && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Objet</p>
          <p className="text-xs font-medium text-gray-800">{doc.subject}</p>
        </div>
      )}
    </div>
  );

  const renderItemsTable = (style: 'filled' | 'bordered' | 'minimal' | 'corporate') => {
    const headerStyles: Record<string, React.CSSProperties> = {
      filled: { backgroundColor: primary, color: textOnPrimary },
      bordered: { borderBottom: `2px solid ${primary}`, color: primary },
      minimal: { borderBottom: '1px solid #d1d5db', color: '#6b7280' },
      corporate: { backgroundColor: primaryMedium, color: primary },
    };

    return (
      <table className="w-full mt-5" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={headerStyles[style]}>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
              Description
            </th>
            <th className="text-center py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
              Qté
            </th>
            <th className="text-right py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
              P.U.
            </th>
            <th className="text-right py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((item, i) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: i % 2 === 0 ? '#ffffff' : primarySoft,
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <td className="py-2.5 px-3 text-xs text-gray-800">{item.description}</td>
              <td className="py-2.5 px-3 text-xs text-center text-gray-700">{item.quantity}</td>
              <td className="py-2.5 px-3 text-xs text-right text-gray-700">
                {formatAmount(item.unitPrice, currency)}
              </td>
              <td className="py-2.5 px-3 text-xs text-right font-semibold text-gray-900">
                {formatAmount(item.total, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTotals = () => (
    <div className="flex justify-end mt-4">
      <div className="w-full max-w-[280px] space-y-1.5">
        {(doc.laborCost ?? 0) > 0 && (
          <div className="flex justify-between text-xs py-0.5">
            <span className="text-gray-500">Main d'œuvre</span>
            <span className="text-gray-800">{formatAmount(doc.laborCost, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs py-0.5">
          <span className="text-gray-500">Sous-total</span>
          <span className="text-gray-800">{formatAmount(doc.subtotal, currency)}</span>
        </div>
        <div className="flex justify-between text-xs py-0.5">
          <span className="text-gray-500">TVA ({doc.taxRate}%)</span>
          <span className="text-gray-800">{formatAmount(doc.taxAmount, currency)}</span>
        </div>
        {(doc.withholdingRate ?? 0) > 0 && (
          <div className="flex justify-between text-xs py-0.5">
            <span className="text-gray-500">Retenue ({doc.withholdingRate}%)</span>
            <span style={{ color: '#dc2626' }}>-{formatAmount(doc.withholdingAmount, currency)}</span>
          </div>
        )}
        <div
          className="flex justify-between text-sm font-bold pt-2.5 mt-1"
          style={{ borderTop: `2px solid ${primary}` }}
        >
          <span className="text-gray-900">Total</span>
          <span style={{ color: primary }}>{formatAmount(doc.total, currency)}</span>
        </div>
      </div>
    </div>
  );

  const renderCustomNote = () => doc.company.customNote ? (
    <div className="mt-5 p-3 rounded-lg text-[10px] text-gray-500 italic leading-relaxed" style={{ backgroundColor: primarySoft }}>
      {doc.company.customNote}
    </div>
  ) : null;

  const renderSignature = () => (
    <div className="mt-10 flex justify-end">
      <div className="text-center w-56">
        <p className="text-xs font-semibold text-gray-800 mb-12">
          {doc.company.signatoryTitle || 'Le Directeur Général'}
        </p>
        <div style={{ borderTop: '1px solid #9ca3af' }} className="pt-1.5">
          <p className="text-[10px] text-gray-500">Signature et cachet</p>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div
      className="mt-6 pt-3"
      style={{ borderTop: `1px solid ${lightenColor(primary, 0.7)}` }}
    >
      <div className="flex flex-wrap justify-between gap-4 text-[9px] text-gray-500 leading-relaxed">
        <div>
          <p className="font-semibold text-gray-700 mb-0.5">{doc.company.name}</p>
          {doc.company.description && <p className="italic">{doc.company.description}</p>}
          <p>{doc.company.address}</p>
          <p>
            {doc.company.email}
            {doc.company.phone ? ` — ${doc.company.phone}` : ''}
          </p>
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

  // ========== TEMPLATES ==========

  const renderModerne = () => (
    <div className="w-full flex flex-col" style={{ minHeight: '297mm' }}>
      {/* Header band */}
      <div
        className="px-7 py-5 flex items-center justify-between"
        style={{ backgroundColor: primary, borderRadius: '0.5rem 0.5rem 0 0' }}
      >
        <div className="flex items-center gap-4">
          {doc.company.logo && logoPos !== 'right' && (
            <img
              src={doc.company.logo}
              alt="Logo"
              className="h-12 w-auto max-w-[140px] object-contain"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
            />
          )}
          <div style={{ color: textOnPrimary }}>
            <h2 className="text-lg font-bold leading-tight">{doc.company.name}</h2>
            {doc.company.description && <p className="text-[10px] opacity-70 italic">{doc.company.description}</p>}
            <p className="text-xs opacity-80">{doc.company.email}</p>
          </div>
        </div>
        <div className="text-right" style={{ color: textOnPrimary }}>
          <h3 className="text-base font-bold uppercase tracking-wider">{docLabel}</h3>
          <p className="text-xs font-medium opacity-90">{doc.number}</p>
        </div>
        {doc.company.logo && logoPos === 'right' && (
          <img
            src={doc.company.logo}
            alt="Logo"
            className="h-12 w-auto max-w-[140px] object-contain"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
          />
        )}
      </div>

      <div className="px-7 py-6 flex-1 flex flex-col">
        <div className="flex-1">
          {renderCompanyClientBlock()}
          {renderDateSubject()}
          {renderItemsTable('filled')}
          {renderTotals()}
          {renderCustomNote()}
          {renderSignature()}
        </div>
        {renderFooter()}
      </div>
    </div>
  );

  const renderClassique = () => (
    <div className="w-full px-7 py-6 flex flex-col" style={{ minHeight: '297mm' }}>
      <div className="flex-1 space-y-5">
      {/* Classic header */}
      <div className="pb-4" style={{ borderBottom: `3px solid ${primary}` }}>
        <div className="flex justify-between items-start">
          <div>
            {doc.company.logo && (
              <div
                className={`mb-3 flex ${
                  logoPos === 'center'
                    ? 'justify-center'
                    : logoPos === 'right'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <img
                  src={doc.company.logo}
                  alt="Logo"
                  className="h-14 w-auto max-w-[180px] object-contain"
                />
              </div>
            )}
            <h2 className="text-xl font-bold" style={{ color: primary }}>
              {doc.company.name}
            </h2>
            {doc.company.description && (
              <p className="text-[10px] text-gray-500 italic mt-0.5">{doc.company.description}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">{doc.company.address}</p>
            <p className="text-xs text-gray-600">
              {doc.company.phone}
              {doc.company.phone && doc.company.email ? ' — ' : ''}
              {doc.company.email}
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold uppercase" style={{ color: primary }}>
              {docLabel}
            </h3>
            <p className="text-sm font-medium mt-1 text-gray-700">{doc.number}</p>
            <p className="text-xs text-gray-500 mt-2">Date : {doc.date}</p>
            {doc.dueDate && (
              <p className="text-xs text-gray-500">Échéance : {doc.dueDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Client */}
      <div
        className="rounded-lg p-4 border"
        style={{ borderColor: lightenColor(primary, 0.7), backgroundColor: primarySoft }}
      >
        <p
          className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
          style={{ color: primary }}
        >
          Facturer à
        </p>
        <p className="font-bold text-sm text-gray-900">{doc.client.name}</p>
        <p className="text-xs text-gray-600 mt-0.5">{doc.client.address}</p>
        <p className="text-xs text-gray-600">
          {doc.client.email}
          {doc.client.phone ? ` — ${doc.client.phone}` : ''}
        </p>
      </div>

      {doc.subject && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Objet</p>
          <p className="text-xs font-medium text-gray-800">{doc.subject}</p>
        </div>
      )}

      {renderItemsTable('bordered')}
      {renderTotals()}
      {renderCustomNote()}
      {renderSignature()}
      </div>
      {renderFooter()}
    </div>
  );

  const renderMinimaliste = () => (
    <div className="w-full px-8 py-7 flex flex-col" style={{ minHeight: '297mm' }}>
      <div className="flex-1 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          {doc.company.logo && (
            <img
              src={doc.company.logo}
              alt="Logo"
              className="h-10 w-auto max-w-[120px] object-contain mb-3"
            />
          )}
          <h2 className="text-sm font-semibold text-gray-800">{doc.company.name}</h2>
          {doc.company.description && <p className="text-[10px] text-gray-400 italic">{doc.company.description}</p>}
        </div>
        <div className="text-right">
          <h3
            className="text-sm font-medium uppercase tracking-[0.2em]"
            style={{ color: primary }}
          >
            {docLabel}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{doc.number}</p>
        </div>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: lightenColor(primary, 0.7) }} />

      <div className="flex justify-between text-xs text-gray-600">
        <div className="leading-relaxed">
          <p>{doc.company.address}</p>
          <p>
            {doc.company.phone}
            {doc.company.phone && doc.company.email ? ' — ' : ''}
            {doc.company.email}
          </p>
        </div>
        <div className="text-right">
          <p>Date : {doc.date}</p>
          {doc.dueDate && <p>Échéance : {doc.dueDate}</p>}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Client</p>
        <p className="text-sm font-medium text-gray-900">{doc.client.name}</p>
        <p className="text-xs text-gray-600">{doc.client.address}</p>
        <p className="text-xs text-gray-600">{doc.client.email}</p>
      </div>

      {doc.subject && (
        <p className="text-xs italic text-gray-600">{doc.subject}</p>
      )}

      {renderItemsTable('minimal')}
      {renderTotals()}
      {renderCustomNote()}
      {renderSignature()}
      </div>
      {renderFooter()}
    </div>
  );

  const renderCorporate = () => (
    <div className="w-full flex flex-col" style={{ minHeight: '297mm' }}>
      {/* Corporate header: side color bar */}
      <div className="flex">
        <div className="w-2 shrink-0" style={{ backgroundColor: primary }} />
        <div
          className="flex-1 px-7 py-5 flex justify-between items-center"
          style={{ backgroundColor: primaryLight }}
        >
          <div className="flex items-center gap-4">
            {doc.company.logo && (
              <img
                src={doc.company.logo}
                alt="Logo"
                className="h-14 w-auto max-w-[160px] object-contain"
              />
            )}
            <div>
              <h2 className="text-lg font-bold" style={{ color: primary }}>
                {doc.company.name}
              </h2>
              {doc.company.description && (
                <p className="text-[10px] text-gray-500 italic">{doc.company.description}</p>
              )}
              <p className="text-xs text-gray-600">{doc.company.address}</p>
              <p className="text-xs text-gray-600">
                {doc.company.phone}
                {doc.company.phone && doc.company.email ? ' — ' : ''}
                {doc.company.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className="inline-block px-5 py-2.5 rounded-lg"
              style={{ backgroundColor: primary }}
            >
              <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: textOnPrimary }}
              >
                {docLabel}
              </h3>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: textOnPrimary, opacity: 0.9 }}
              >
                {doc.number}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-7 py-6 flex-1 flex flex-col">
        <div className="flex-1">
        <div className="flex justify-between gap-6">
          <div className="flex gap-8 text-xs text-gray-500">
            <div>
              <span>Date : </span>
              <span className="font-semibold text-gray-800">{doc.date}</span>
            </div>
            {doc.dueDate && (
              <div>
                <span>Échéance : </span>
                <span className="font-semibold text-gray-800">{doc.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client */}
        <div
          className="p-4 rounded-lg mt-5"
          style={{
            backgroundColor: primarySoft,
            borderLeft: `4px solid ${primary}`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-widest mb-1.5 font-bold"
            style={{ color: primary }}
          >
            Destinataire
          </p>
          <p className="font-bold text-sm text-gray-900">{doc.client.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{doc.client.address}</p>
          <p className="text-xs text-gray-600">
            {doc.client.email}
            {doc.client.phone ? ` — ${doc.client.phone}` : ''}
          </p>
        </div>

        {doc.subject && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Objet</p>
            <p className="text-xs font-medium text-gray-800">{doc.subject}</p>
          </div>
        )}

        {renderItemsTable('corporate')}
        {renderTotals()}
        {renderCustomNote()}
        {renderSignature()}
        </div>
        {renderFooter()}
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
    <div
      className="a4-preview bg-white text-gray-900 shadow-lg border border-gray-200 w-full max-w-[210mm] overflow-hidden print:shadow-none print:border-none print:rounded-none"
      style={{
        minHeight: '297mm',
        borderRadius: '0.5rem',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {templateRenderers[template]()}
    </div>
  );
}
