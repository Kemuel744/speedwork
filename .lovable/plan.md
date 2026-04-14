

# Plan : Pivot complet vers la gestion de boutiques et pharmacies

## Contexte

SpeedWork passe d'une plateforme de gestion d'entreprise généraliste (facturation, missions terrain, pointage, etc.) à un **logiciel spécialisé de gestion de magasin** (boutiques, dépôts, pharmacies). Toutes les fonctionnalités non pertinentes seront supprimées.

## Ce qui est conservé

- **Ma Boutique** (caisse POS, panier, reçus, scanner QR)
- **Produits & Stock** (inventaire, alertes, codes QR, PDF)
- **Historique des ventes**
- **Statistiques de ventes** (onglet existant)
- **Authentification, profils, abonnements**
- **Blog, Guide, À propos, Contact**
- **Messagerie** (support client)
- **Paramètres entreprise** (logo, coordonnées sur les reçus)
- **Mode hors ligne**
- **Notifications**

## Ce qui est supprimé

| Module supprimé | Pages / composants concernés |
|---|---|
| Facturation / Documents | Documents, CreateDocument, DocumentDetail, SharedDocument |
| Équipes terrain | Teams, TeamDetail, TeamsMap, TeamManagement |
| Workers / Ouvriers | Workers, WorkerDetail, WorkerDashboard, WorkerOnboarding |
| Missions | Missions, MissionsMap, MissionProofs |
| Pointage | Attendance |
| Paie | Payroll |
| Tâches terrain | WorkTasks |
| Analytics terrain | ProductivityAnalytics, ProductivityMap, ReliabilityScores |
| Bilan annuel | AnnualReview |
| Relances factures | Reminders |
| Client dashboard | ClientDashboard, ClientDetail, Clients |
| Admin clients | AdminClients |
| Rapports terrain | FieldReportForm, FieldReportsList |
| Convertisseur devises | CurrencyConverter |

## Étapes d'implémentation

### 1. Refonte de la page d'accueil et du SEO
- Réécrire `HeroSection`, `ProblemSection`, `SolutionSection`, `BenefitsSection`, etc. pour cibler les gérants de boutiques, dépôts et pharmacies
- Nouveau slogan : "Le logiciel de gestion simple et puissant pour boutiques, dépôts et pharmacies en Afrique"
- Mettre à jour les métadonnées SEO, sitemap, robots.txt

### 2. Simplifier la navigation (AppSidebar)
Nouvelle structure de la sidebar :

```text
PRINCIPAL
  ├── Tableau de bord  (stats ventes, stock bas, CA)
  └── Ma Boutique      (caisse POS)

GESTION
  ├── Produits & Stock
  ├── Historique ventes
  └── Statistiques

COMMUNICATION
  ├── Messages
  └── Notifications

ADMINISTRATION (admin only)
  ├── Abonnements
  └── Blog
```

### 3. Nouveau tableau de bord commerce
- Remplacer le Dashboard actuel par un tableau de bord centré sur :
  - CA du jour / semaine / mois
  - Nombre de ventes aujourd'hui
  - Produits les plus vendus
  - Alertes de stock bas
  - Graphique des ventes récentes

### 4. Supprimer les pages et composants inutiles
- Retirer les imports et routes de ~25 pages dans `AuthenticatedRoutes.tsx` et `App.tsx`
- Supprimer les fichiers des modules terrain (pages + composants)
- Nettoyer `AppSidebar.tsx` (retirer les sections terrain, facturation, etc.)

### 5. Mettre à jour les traductions
- Nettoyer `translations.ts` des clés inutilisées
- Ajouter les nouvelles clés commerce/pharmacie

### 6. Mettre à jour la page Fonctionnalités et Tarifs
- Recentrer sur les fonctionnalités boutique : caisse, stock, QR, inventaire PDF, mode hors ligne
- Adapter les plans tarifaires au contexte commerce

### 7. Page d'inscription / profil
- Remplacer les types de compte (enterprise, freelance, PME, ONG) par : Boutique, Dépôt, Pharmacie, Autre
- Simplifier le formulaire d'inscription

---

## Détails techniques

- **Aucune migration DB destructive** : les tables terrain (workers, missions, teams, etc.) restent en base mais ne sont plus accessibles depuis l'UI. Cela évite toute perte de données.
- **Routes** : les anciennes URLs (ex: `/workers`, `/missions`) redirigeront vers `/dashboard` ou afficheront la page 404.
- **Fichiers supprimés** : ~30 fichiers de pages/composants seront retirés du code source.
- **Contextes** : `DocumentsContext` sera supprimé. `CompanyContext` et `CurrencyContext` sont conservés.

