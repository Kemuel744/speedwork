Je vais corriger le problème d’impression blanche en remplaçant l’isolation CSS fragile actuelle par un système d’impression plus sûr et ciblé.

Constat principal : les règles globales d’impression cachent tout le contenu de l’application avec `visibility: hidden`, puis tentent de réafficher `.print-zone`. Sur certaines pages, notamment les pages à onglets comme Finance, un contenu imprimable peut exister dans un onglet non actif ou être caché par Radix/Tailwind (`display: none`, `hidden`, `print:hidden`). Résultat : le navigateur imprime une page blanche.

Plan d’implémentation :

1. Stabiliser les règles globales d’impression
   - Réécrire la section `@media print` de `src/index.css` pour éviter de rendre tout le site invisible de façon trop agressive.
   - Conserver l’isolation de `.a4-preview`, `.guide-doc`, `.label-print-area` et `.print-zone`, mais avec des règles qui ne dépendent pas d’un contenu caché par un onglet inactif.
   - Masquer les éléments d’interface uniquement avec une classe dédiée (`.no-print`, `print:hidden`, navigation, sidebar, chat, header fixe), sans casser le contenu réel à imprimer.

2. Empêcher les onglets cachés de déclencher une impression blanche
   - Sur la page Finance, ne pas rendre tous les onglets en même temps comme contenu imprimable.
   - Faire en sorte que seule la page active puisse contenir une zone imprimable.
   - Pour les pages Comptabilité/TVA, garder leurs boutons et filtres masqués à l’impression, mais garantir que le rapport lui-même reste visible.

3. Corriger les pages de rapports internes
   - Sur `Reports.tsx`, éviter que toute la page “Ma Boutique” soit imprimée en bloc avec tous les onglets.
   - Ajouter une zone d’impression claire pour les statistiques/rapports visibles, et masquer les parties interactives non destinées au papier.
   - Vérifier que le bouton “Imprimer” n’imprime plus les menus, la sidebar, les filtres ou une page vide.

4. Corriger le rapport d’inventaire dans la boîte de dialogue
   - Le composant `InventoryReport.tsx` appelle `window.print()` mais son contenu n’est pas marqué comme zone imprimable.
   - Ajouter une zone dédiée au contenu du rapport d’inventaire, avec les boutons masqués à l’impression, pour éviter une page blanche ou l’impression de l’arrière-plan.

5. Préserver les impressions spéciales existantes
   - Ne pas casser les documents A4 (`.a4-preview`) comme factures/devis/bons de commande.
   - Ne pas casser le guide utilisateur (`.guide-doc`).
   - Ne pas casser les tickets thermiques et rapports Z, qui s’impriment déjà via une iframe dédiée.
   - Conserver les étiquettes produits (`.label-print-area`) avec leur mise en page A4.

Détails techniques :

```text
Avant :
body:has(.print-zone) #root * { visibility: hidden }
.print-zone, .print-zone * { visibility: visible }

Problème : si .print-zone est dans un onglet non actif ou si ses enfants sont display:none,
le navigateur voit une zone imprimable mais aucun contenu visible -> page blanche.

Après :
- isolation plus ciblée par type de document
- classes no-print/print:hidden pour masquer l’interface
- zones imprimables uniquement sur le contenu réellement actif
- compatibilité A4 et tickets/iframes préservée
```

Après approbation, j’appliquerai les changements dans les fichiers concernés et je vérifierai le parcours principal depuis `/finance?tab=cash`, notamment le bouton Z et les onglets Comptabilité/TVA.