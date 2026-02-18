import { CompanyInfo } from '@/types';

/**
 * Opens the user's email client with a pre-filled email for sending a document.
 */
export function sendDocumentByEmail({
  recipientEmail,
  recipientName,
  documentType,
  documentNumber,
  companyName,
  subject,
  body,
}: {
  recipientEmail: string;
  recipientName: string;
  documentType: 'invoice' | 'quote' | 'report';
  documentNumber?: string;
  companyName: string;
  subject?: string;
  body?: string;
}) {
  const typeLabels = { invoice: 'Facture', quote: 'Devis', report: 'Rapport' };
  const label = typeLabels[documentType];
  const ref = documentNumber ? ` ${documentNumber}` : '';

  const emailSubject = subject || `${label}${ref} — ${companyName}`;
  const emailBody = body || [
    `Bonjour ${recipientName},`,
    '',
    `Veuillez trouver ci-joint ${label.toLowerCase()}${ref}.`,
    '',
    `N'hésitez pas à nous contacter pour toute question.`,
    '',
    `Cordialement,`,
    companyName,
  ].join('\n');

  const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  window.open(mailto, '_blank');
}
