/**
 * Impression isolée d'un élément du DOM via une iframe dédiée.
 *
 * Pourquoi : les règles `@media print` globales (visibility:hidden + visibility:visible)
 * sont fragiles dès qu'une zone à imprimer se trouve dans un onglet inactif, un
 * Dialog, ou un conteneur masqué. Cela produit régulièrement des pages blanches.
 *
 * Cette fonction copie le HTML de l'élément cible, hérite des styles de la page
 * (toutes les <link rel="stylesheet"> et <style>) et lance l'impression dans
 * une iframe invisible. L'application réelle n'est jamais touchée.
 */

export interface PrintElementOptions {
  /** Titre du document d'impression (entête navigateur). */
  title?: string;
  /** Marges @page (ex: "10mm"). Défaut: 10mm. */
  pageMargin?: string;
  /** CSS supplémentaire à injecter dans la fenêtre d'impression. */
  extraCss?: string;
}

export function printElement(
  target: HTMLElement | null,
  options: PrintElementOptions = {},
): Promise<void> {
  return new Promise((resolve) => {
    if (!target) { resolve(); return; }

    const title = options.title || document.title || 'Impression';
    const pageMargin = options.pageMargin || '10mm';

    // Récupère toutes les feuilles de style et balises <style> de la page
    // pour que le rendu de l'élément cloné soit visuellement identique.
    const headStyles = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((node) => node.outerHTML)
      .join('\n');

    // Clone profond pour ne pas perturber le DOM réel.
    const clone = target.cloneNode(true) as HTMLElement;
    // Force la visibilité du clone (au cas où des classes le cachent).
    clone.style.display = 'block';
    clone.style.visibility = 'visible';
    clone.style.opacity = '1';
    clone.style.position = 'static';
    clone.style.transform = 'none';
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';

    const html = `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
${headStyles}
<style>
  @page { size: A4; margin: ${pageMargin}; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #111 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body { font-family: 'Inter', system-ui, sans-serif; }
  /* Masque les éléments d'interface qui auraient pu être clonés */
  .no-print, .print\\:hidden, [data-no-print] { display: none !important; }
  /* Cartes et tableaux propres en impression */
  .card, [class*="rounded"] { box-shadow: none !important; }
  table { width: 100%; border-collapse: collapse; }
  table th, table td { padding: 6px 8px; border: 1px solid #e5e7eb; }
  tr { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
  ${options.extraCss || ''}
</style>
</head><body>${clone.outerHTML}</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { document.body.removeChild(iframe); } catch { /* noop */ }
      resolve();
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) { cleanup(); return; }

      const waitForImages = (): Promise<void> => {
        const imgs = Array.from(doc.images || []);
        if (imgs.length === 0) return Promise.resolve();
        return Promise.race([
          Promise.all(imgs.map(img =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise<void>(res => {
                  img.addEventListener('load', () => res(), { once: true });
                  img.addEventListener('error', () => res(), { once: true });
                }),
          )).then(() => undefined),
          new Promise<void>(res => setTimeout(res, 2000)),
        ]);
      };

      waitForImages().then(() => {
        // Attendre aussi les fonts (typo) pour éviter un rendu vide / mal mesuré
        const waitForFonts: Promise<void> = (doc as any).fonts?.ready
          ? (doc as any).fonts.ready.then(() => undefined).catch(() => undefined)
          : Promise.resolve();
        waitForFonts.then(() => {
          // Double rAF garantit que le layout est appliqué avant print()
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => {
            try { win.focus(); win.print(); } catch { /* noop */ }
            // Sur certains navigateurs print() est bloquant et ferme tout seul,
            // sur d'autres il faut un délai plus long avant de retirer l'iframe.
            setTimeout(cleanup, 1200);
          }));
        });
      });
    };

    const idoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!idoc) { cleanup(); return; }
    idoc.open();
    idoc.write(html);
    idoc.close();

    // Garde-fou: si onload ne se déclenche pas, on nettoie après 10s.
    setTimeout(() => { if (iframe.parentNode) cleanup(); }, 10000);
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}