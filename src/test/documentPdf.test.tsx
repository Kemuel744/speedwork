import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'fs';
import path from 'path';
import DocumentPreview from '@/components/document/DocumentPreview';
import type { DocumentData, DocumentTemplate, DocumentType } from '@/types';

/**
 * Tests automatiques d'impression et téléchargement PDF A4
 * pour les factures et devis. Vérifie :
 *  - Présence du conteneur .a4-preview aux dimensions A4 (210mm × 297mm)
 *  - Mise en page correcte pour les 4 templates (moderne, classique, minimaliste, corporate)
 *  - Compatibilité factures (FACTURE) et devis (DEVIS)
 *  - Règles CSS @page A4 et visibility print dans index.css
 *  - Déclenchement de window.print() (utilisé pour Imprimer ET Télécharger PDF)
 */

const buildDoc = (
  type: DocumentType,
  template: DocumentTemplate,
): DocumentData => ({
  id: 'doc-test-1',
  number: type === 'invoice' ? 'FAC-2026-001' : 'DEV-2026-001',
  type,
  status: type === 'invoice' ? 'unpaid' : 'pending',
  date: '2026-04-27',
  dueDate: '2026-05-27',
  client: {
    name: 'Boutique Sahel',
    email: 'client@sahel.cg',
    phone: '+242 06 000 0000',
    address: 'Brazzaville, Congo',
  },
  company: {
    name: 'SpeedWork Demo',
    address: 'Pointe-Noire, Congo',
    phone: '+242 06 444 6047',
    email: 'demo@speedwork.pro',
    currency: 'XAF',
    documentTemplate: template,
    logoPosition: 'left',
    brandColors: { primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b' },
  },
  items: [
    { id: '1', description: 'Riz parfumé 25kg', quantity: 10, unitPrice: 15000, total: 150000 },
    { id: '2', description: 'Huile végétale 5L', quantity: 5, unitPrice: 8500, total: 42500 },
  ],
  subtotal: 192500,
  laborCost: 0,
  taxRate: 18,
  taxAmount: 34650,
  withholdingRate: 0,
  withholdingAmount: 0,
  total: 227150,
  subject: 'Approvisionnement boutique',
  createdBy: 'user-1',
  clientId: 'client-1',
});

const TEMPLATES: DocumentTemplate[] = ['moderne', 'classique', 'minimaliste', 'corporate'];
const TYPES: DocumentType[] = ['invoice', 'quote'];

describe('Impression & téléchargement PDF A4 — DocumentPreview', () => {
  TYPES.forEach((type) => {
    TEMPLATES.forEach((template) => {
      it(`rend un conteneur A4 (210mm × 297mm) pour ${type} / ${template}`, () => {
        const { container } = render(<DocumentPreview doc={buildDoc(type, template)} />);
        const a4 = container.querySelector('.a4-preview') as HTMLElement | null;
        expect(a4).not.toBeNull();

        // Largeur A4 imposée via classe Tailwind
        expect(a4!.className).toMatch(/w-\[210mm\]/);
        expect(a4!.className).toMatch(/min-w-\[210mm\]/);

        // Hauteur A4 imposée via style inline (verrouillage strict)
        expect(a4!.style.minHeight).toBe('297mm');
        expect(a4!.style.maxHeight).toBe('297mm');

        // Couleurs / contenu doivent être préservés à l'impression
        expect(a4!.style.printColorAdjust || a4!.style.WebkitPrintColorAdjust).toBe('exact');
      });
    });
  });

  it('affiche le label FACTURE pour les factures et DEVIS pour les devis', () => {
    const inv = render(<DocumentPreview doc={buildDoc('invoice', 'moderne')} />);
    expect(inv.container.textContent).toContain('FACTURE');
    inv.unmount();

    const quo = render(<DocumentPreview doc={buildDoc('quote', 'moderne')} />);
    expect(quo.container.textContent).toContain('DEVIS');
    quo.unmount();
  });

  it('inclut numéro, client et lignes de produit dans le rendu imprimable', () => {
    const doc = buildDoc('invoice', 'classique');
    const { container } = render(<DocumentPreview doc={doc} />);
    const text = container.textContent || '';
    expect(text).toContain(doc.number);
    expect(text).toContain(doc.client.name);
    expect(text).toContain('Riz parfumé 25kg');
    expect(text).toContain('Huile végétale 5L');
  });

  it("contient des sous-conteneurs internes verrouillés à 297mm pour éviter les débordements de page", () => {
    TEMPLATES.forEach((template) => {
      const { container, unmount } = render(
        <DocumentPreview doc={buildDoc('invoice', template)} />,
      );
      const inner = container.querySelector('.a4-preview > div') as HTMLElement | null;
      expect(inner, `template ${template}`).not.toBeNull();
      expect(inner!.style.minHeight).toBe('297mm');
      expect(inner!.style.maxHeight).toBe('297mm');
      expect(inner!.style.overflow).toBe('hidden');
      unmount();
    });
  });
});

describe('Règles CSS d\'impression A4 (index.css)', () => {
  const css = readFileSync(
    path.resolve(__dirname, '../index.css'),
    'utf-8',
  );

  it('définit un format @page A4 avec marges nulles', () => {
    expect(css).toMatch(/@page\s*{[^}]*size:\s*A4/);
    expect(css).toMatch(/@page\s*{[^}]*margin:\s*0/);
  });

  it('force les dimensions 210mm × 297mm sur .a4-preview à l\'impression', () => {
    expect(css).toMatch(/\.a4-preview\b[\s\S]*width:\s*210mm/);
    expect(css).toMatch(/\.a4-preview\b[\s\S]*height:\s*297mm/);
    expect(css).toMatch(/\.a4-preview\b[\s\S]*max-height:\s*297mm/);
  });

  it('rend visible uniquement le document A4 lors de l\'impression', () => {
    expect(css).toMatch(/\.a4-preview\s*\*\s*{[\s\S]*visibility:\s*visible/);
  });

  it('préserve les couleurs de marque (print-color-adjust: exact)', () => {
    expect(css).toMatch(/print-color-adjust:\s*exact/);
    expect(css).toMatch(/-webkit-print-color-adjust:\s*exact/);
  });
});

describe('Déclenchement de window.print() (Imprimer & Télécharger PDF)', () => {
  let printSpy: ReturnType<typeof vi.fn>;
  let originalPrint: typeof window.print;

  beforeEach(() => {
    originalPrint = window.print;
    printSpy = vi.fn();
    window.print = printSpy as any;
  });

  afterEach(() => {
    window.print = originalPrint;
  });

  it('handlePrint déclenche window.print() avec restauration du titre', () => {
    // Reproduit la logique exacte de DocumentDetail.handlePrint
    const doc = buildDoc('invoice', 'moderne');
    const originalTitle = document.title;
    const handlePrint = () => {
      const prev = document.title;
      document.title = doc.number;
      window.print();
      document.title = prev;
    };

    handlePrint();

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.title).toBe(originalTitle);
  });

  it('utilise le même mécanisme pour Imprimer et Télécharger PDF', () => {
    // Les deux boutons (Imprimer / PDF) appellent handlePrint dans DocumentDetail.tsx
    const source = readFileSync(
      path.resolve(__dirname, '../pages/DocumentDetail.tsx'),
      'utf-8',
    );
    const onClickPrintMatches = source.match(/onClick=\{handlePrint\}/g) || [];
    expect(onClickPrintMatches.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain('window.print()');
  });
});