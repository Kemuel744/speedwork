/* eslint-disable @typescript-eslint/no-unused-vars */

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

/**
 * Opens WhatsApp with a pre-filled message for sending a document.
 * Uses wa.me deep link which works on mobile and desktop.
 */
export function sendDocumentByWhatsApp({
  recipientPhone,
  recipientName,
  documentType,
  documentNumber,
  companyName,
  message,
}: {
  recipientPhone?: string;
  recipientName: string;
  documentType: 'invoice' | 'quote' | 'report';
  documentNumber?: string;
  companyName: string;
  message?: string;
}) {
  const typeLabels = { invoice: 'Facture', quote: 'Devis', report: 'Rapport' };
  const label = typeLabels[documentType];
  const ref = documentNumber ? ` ${documentNumber}` : '';

  const text = message || [
    `Bonjour ${recipientName},`,
    '',
    `Veuillez trouver ${label.toLowerCase()}${ref} de la part de ${companyName}.`,
    '',
    `N'hésitez pas à nous contacter pour toute question.`,
    '',
    `Cordialement,`,
    companyName,
  ].join('\n');

  // Clean phone number: remove spaces, dashes, dots
  const cleanPhone = (recipientPhone || '').replace(/[\s\-.()]/g, '');
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
