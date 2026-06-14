# Module Inventaire physique

Nouvelle fonctionnalité **Inventaire** ajoutée à la page **Stock & Produits** (`StockHub`), permettant aux commerçants de réaliser des comptages physiques et de comparer stock théorique vs stock compté, sans jamais créer de nouveaux produits.

## 1. Nouvel onglet dans StockHub

Ajout d'un onglet **"Inventaire"** (icône `ClipboardCheck`) dans `src/pages/StockHub.tsx`, pointant vers une nouvelle page `src/pages/Inventory.tsx`.

## 2. Base de données (migration)

Deux nouvelles tables liées aux produits existants :

- **`inventories`** — entête d'une session d'inventaire
  - `name`, `inventory_date`, `location_id` (FK locations), `responsible_name`, `comment`, `status` (`draft` / `validated`), totaux calculés (produits contrôlés, écart total, valeur écart, taux précision)
- **`inventory_items`** — lignes par produit
  - `inventory_id`, `product_id` (FK produits existants), `variant_id` (optionnel), `system_qty`, `counted_qty`, `unit_price`, écart calculé

RLS standard `user_id = auth.uid()`, GRANTs `authenticated` + `service_role`, triggers `updated_at`.

Aucune écriture dans `products`. À la validation, génération de `stock_movements` (type `adjustment`) et mise à jour de `products.quantity_in_stock` (et `location_stock` si multi-dépôts).

## 3. Page Inventory

### Tableau de bord (haut de page)
- Dernier inventaire (date)
- Produits vérifiés
- Écart total (unités)
- Valeur des pertes
- Taux de précision (%)

### Bouton "➕ Nouvel Inventaire"
Ouvre un dialog avec : nom, date, magasin (select sur `locations`), responsable, commentaire.

### Écran de comptage
Tableau : `Produit | Stock système | Stock compté | Écart | Valeur écart`
- Recherche produit (par nom / SKU / code-barres)
- Saisie manuelle de la quantité comptée
- Scan code-barres / QR (réutilisation de `QRScanner` existant)
- Calculs en direct : surplus, manquants, valeur écarts, taux précision

### Validation
Bouton **"Valider l'inventaire"** :
- Crée les mouvements de stock d'ajustement
- Met à jour `products.quantity_in_stock`
- Passe le statut à `validated` et fige les totaux

### Historique
Liste des inventaires validés : date, responsable, produits vérifiés, écart total, statut. Clic = vue détaillée en lecture seule.

### Rapports
- **Imprimer** (réutilise `printElement`)
- **Export PDF** via `printElement` (impression navigateur en PDF)
- **Export Excel** via `xlsx` (déjà présent dans le projet si dispo, sinon CSV natif)

## 4. UI & i18n

- Style cohérent avec le reste de SpeedWork (cards, badges, dialog shadcn)
- Responsive mobile / tablette / desktop
- Textes FR (ajout des clés dans `src/lib/translations.ts`, EN en suivant)
- Devise via `displayAmount` du `CurrencyContext`

## Détails techniques

- Page : `src/pages/Inventory.tsx`
- Composants : `src/components/inventory/InventoryDialog.tsx`, `InventoryCountTable.tsx`, `InventoryHistory.tsx`, `InventoryKPIs.tsx`
- Tables : `public.inventories`, `public.inventory_items`
- Mutations : insert dans `stock_movements` (type `adjustment`) + update `products.quantity_in_stock` à la validation
- Aucun nouvel `INSERT INTO products` n'est effectué dans tout le module

## Hors scope (à confirmer plus tard si besoin)
- Intégration multi-dépôts fine (`location_stock`) : version 1 prend le stock global du produit ; ajustement multi-dépôts pourra suivre.
- Export Excel natif (vs CSV) selon dépendances disponibles.
