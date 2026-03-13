import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import speedworkLogo from '@/assets/logo.webp';
import mockupInvoice from '@/assets/mockup-invoice.png';
import mockupQuote from '@/assets/mockup-quote.png';
import mtnLogo from '@/assets/mtn-momo.png';
import airtelLogo from '@/assets/airtel-money.png';
import SEO from '@/components/SEO';
import { useAdSense } from '@/hooks/useAdSense';
import AdSenseSlot from '@/components/blog/AdSenseSlot';

const LearningSection = lazy(() => import('@/components/guide/LearningSection'));

export default function Guide() {
  useAdSense();
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO
        title="Guide d'utilisation – SpeedWork"
        description="Manuel d'utilisation complet de SpeedWork : inscription, connexion, abonnement et fonctionnalités."
        path="/guide"
      />

      {/* Toolbar – hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <span className="font-semibold text-foreground text-sm hidden sm:block">Guide d'utilisation SpeedWork</span>
        <Button onClick={handlePrint} className="h-9 gap-2 text-sm">
          <Printer className="w-4 h-4" />
          Imprimer / Télécharger PDF
        </Button>
      </div>

      {/* Print hint */}
      <div className="no-print pt-20 pb-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Cliquez sur <strong>Imprimer / Télécharger PDF</strong> puis choisissez <em>« Enregistrer au format PDF »</em> comme imprimante.
        </p>
      </div>

      {/* Document */}
      <div className="guide-doc mx-auto" style={{ maxWidth: '820px', padding: '40px 60px', fontFamily: 'Georgia, serif', background: '#fff', color: '#111' }}>

        {/* Cover */}
        <div className="cover-page" style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px', borderBottom: '3px solid #1a56db', marginBottom: '48px' }}>
          <img src={speedworkLogo} alt="SpeedWork" style={{ height: '72px', margin: '0 auto 24px', display: 'block' }} />
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
            SpeedWork
          </h1>
          <h2 style={{ fontSize: '20px', fontWeight: 400, color: '#4b5563', marginBottom: '32px', fontFamily: 'Arial, sans-serif' }}>
            Guide d'utilisation complet
          </h2>
          <div style={{ display: 'inline-block', background: '#1a56db', color: '#fff', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>
            Facturation • Équipes • Missions terrain • Pointage • Analytics • Paie
          </div>

          {/* Mockup images on cover */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '48px', flexWrap: 'wrap' }}>
            <img src={mockupInvoice} alt="Aperçu facture" style={{ width: '220px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(26,86,219,0.15)', border: '1px solid #e5e7eb' }} />
            <img src={mockupQuote} alt="Aperçu devis" style={{ width: '220px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(26,86,219,0.15)', border: '1px solid #e5e7eb' }} />
          </div>

          <p style={{ marginTop: '48px', fontSize: '13px', color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
            Version 2025 – speedwork.pro
          </p>
        </div>

        {/* Table des matières */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={styles.h2}>Table des matières</h2>
          <ol style={{ paddingLeft: '20px', lineHeight: 2.2, fontSize: '15px', color: '#374151' }}>
            <li>Créer un compte (Inscription)</li>
            <li>Se connecter à l'application</li>
            <li>Choisir et payer un abonnement</li>
            <li>Activer son compte avec la clé d'activation</li>
            <li>Tableau de bord</li>
            <li>Créer une facture</li>
            <li>Créer un devis</li>
            <li>Gérer ses clients</li>
            <li>Rapports de terrain</li>
            <li>Paramètres et personnalisation</li>
            <li>Gestion des travailleurs & équipes</li>
            <li>Missions terrain & carte interactive</li>
            <li>Pointage & présence</li>
            <li>Analyse de productivité & fiabilité</li>
            <li>Calcul de paie automatique</li>
            <li>Questions fréquentes</li>
          </ol>
        </section>

        <hr style={styles.hr} />

        {/* 1. Inscription */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>1. Créer un compte (Inscription)</h2>
          <p style={styles.p}>
            SpeedWork utilise un système d'accès sécurisé. Pour créer votre compte, vous devez d'abord obtenir une <strong>clé d'activation</strong> après avoir souscrit à un abonnement.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Rendez-vous sur speedwork.pro depuis votre navigateur (Chrome recommandé)." />
            <Step n={2} text="Cliquez sur le bouton « Commencer » ou « S'inscrire » dans la barre de navigation." />
            <Step n={3} text="Vous serez redirigé vers la page de connexion. Cliquez sur « Créer un compte »." />
            <Step n={4} text="Saisissez votre adresse email et un mot de passe sécurisé (minimum 6 caractères)." />
            <Step n={5} text="Confirmez votre email en cliquant sur le lien reçu dans votre boîte mail." />
            <Step n={6} text="Saisissez ensuite votre clé d'activation pour débloquer votre abonnement." />
          </div>
          <Tip text="Utilisez une adresse email valide que vous consultez régulièrement, car c'est là que vous recevrez votre clé d'activation et les rappels de factures." />
        </section>

        <hr style={styles.hr} />

        {/* 2. Connexion */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>2. Se connecter à l'application</h2>
          <p style={styles.p}>
            Une fois votre compte créé et activé, la connexion est simple et rapide.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez sur speedwork.pro et cliquez sur « Se connecter »." />
            <Step n={2} text="Entrez votre adresse email et votre mot de passe." />
            <Step n={3} text="Cliquez sur le bouton « Se connecter »." />
            <Step n={4} text="Vous serez automatiquement redirigé vers votre tableau de bord." />
          </div>
          <Tip text="Si vous oubliez votre mot de passe, cliquez sur « Mot de passe oublié ? » pour recevoir un lien de réinitialisation par email." />
        </section>

        <hr style={styles.hr} />

        {/* 3. Abonnement */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>3. Choisir et payer un abonnement</h2>
          <p style={styles.p}>
            SpeedWork propose trois formules d'abonnement adaptées à vos besoins. Le paiement se fait via <strong>MTN Mobile Money</strong> ou <strong>Airtel Money</strong>.
          </p>

          {/* Plans table */}
          <table style={styles.table}>
            <thead>
              <tr style={{ background: '#1a56db', color: '#fff' }}>
                <th style={styles.th}>Formule</th>
                <th style={styles.th}>Prix</th>
                <th style={styles.th}>Avantages</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}><strong>Mensuel</strong></td>
                <td style={styles.td}>5 000 FCFA/mois</td>
                <td style={styles.td}>Factures & devis illimités, export PDF, signature électronique</td>
              </tr>
              <tr style={{ background: '#f0f7ff' }}>
                <td style={styles.td}><strong>Annuel ⭐</strong></td>
                <td style={styles.td}>3 000 FCFA/mois (36 000 FCFA/an)</td>
                <td style={styles.td}>Tout le plan Mensuel + tableau de bord avancé, multi-utilisateurs, support prioritaire. Économisez 40% !</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>Entreprise</strong></td>
                <td style={styles.td}>15 000 FCFA/mois</td>
                <td style={styles.td}>1 admin + 3 collaborateurs, messagerie interne, gestion centralisée</td>
              </tr>
            </tbody>
          </table>

          <h3 style={styles.h3}>Comment payer ?</h3>

          {/* Payment logos */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff8e1', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 20px' }}>
              <img src={mtnLogo} alt="MTN Mobile Money" style={{ height: '40px', objectFit: 'contain' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#92400e' }}>MTN Mobile Money</p>
                <p style={{ margin: 0, fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#374151' }}>06 444 6047</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 20px' }}>
              <img src={airtelLogo} alt="Airtel Money" style={{ height: '40px', objectFit: 'contain' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#991b1b' }}>Airtel Money</p>
                <p style={{ margin: 0, fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#374151' }}>05 303 9818</p>
              </div>
            </div>
          </div>

          <div style={styles.steps}>
            <Step n={1} text="Rendez-vous sur speedwork.pro/tarifs." />
            <Step n={2} text="Sélectionnez votre formule (Mensuel, Annuel ou Entreprise)." />
            <Step n={3} text="Choisissez votre moyen de paiement : MTN Mobile Money ou Airtel Money." />
            <Step n={4} text={`Effectuez le dépôt au numéro indiqué :\n• MTN Mobile Money : 06 444 6047\n• Airtel Money : 05 303 9818`} />
            <Step n={5} text="Cliquez sur « J'ai effectué le dépôt »." />
            <Step n={6} text="Remplissez le formulaire avec votre nom, email et numéro de téléphone." />
            <Step n={7} text="Envoyez votre demande. Vous recevrez votre clé d'activation sous peu par téléphone ou email." />
          </div>
          <Tip text="Envoyez exactement le montant indiqué pour éviter les délais de traitement. Conservez une capture d'écran de votre transaction." />
        </section>

        <hr style={styles.hr} />

        {/* 4. Activation */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>4. Activer son compte avec la clé d'activation</h2>
          <p style={styles.p}>
            Après réception de votre clé d'activation (par SMS ou email), vous pouvez activer votre abonnement.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez sur speedwork.pro/access-code." />
            <Step n={2} text="Saisissez la clé d'activation reçue dans le champ prévu." />
            <Step n={3} text="Cliquez sur « Valider ». Votre abonnement est immédiatement actif." />
            <Step n={4} text="Vous serez automatiquement redirigé vers votre tableau de bord." />
          </div>
        </section>

        <hr style={styles.hr} />

        {/* 5. Dashboard */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>5. Tableau de bord</h2>
          <p style={styles.p}>
            Le tableau de bord est votre point de contrôle central. Il affiche en temps réel :
          </p>
          <ul style={styles.ul}>
            <li>Le chiffre d'affaires du mois en cours et de l'année</li>
            <li>Le nombre de factures payées, en attente et en retard</li>
            <li>Les derniers documents créés</li>
            <li>Les alertes de factures impayées</li>
            <li>Un graphique de l'évolution de vos revenus</li>
            <li>Résumé des missions actives et équipes sur le terrain</li>
          </ul>
          <p style={styles.p}>
            La barre latérale gauche vous permet de naviguer entre les différentes sections : Documents, Clients, Équipes, Travailleurs, Missions, Pointage, Analytics, Fiabilité, Paie, Rapports, Messages, Paramètres.
          </p>
        </section>

        <hr style={styles.hr} />

        {/* 6. Facture */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>6. Créer une facture</h2>
          <p style={styles.p}>
            SpeedWork vous permet de créer des factures professionnelles en quelques clics.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Dans le menu latéral, cliquez sur « Documents » puis sur « + Nouveau »." />
            <Step n={2} text="Sélectionnez le type « Facture »." />
            <Step n={3} text="Saisissez ou sélectionnez le nom du client (auto-complétion disponible)." />
            <Step n={4} text="Ajoutez vos articles : description, quantité et prix unitaire. Les montants sont calculés automatiquement." />
            <Step n={5} text="Définissez le taux de TVA et/ou de retenue si applicable." />
            <Step n={6} text="Ajoutez une date d'échéance pour les rappels automatiques." />
            <Step n={7} text="Cliquez sur « Enregistrer » pour sauvegarder, puis sur « Exporter PDF » pour télécharger." />
          </div>

          {/* Invoice mockup */}
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <img src={mockupInvoice} alt="Exemple de facture SpeedWork" style={{ maxWidth: '100%', width: '480px', borderRadius: '12px', boxShadow: '0 6px 24px rgba(26,86,219,0.12)', border: '1px solid #e5e7eb' }} />
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontFamily: 'Arial, sans-serif' }}>Exemple de facture générée avec SpeedWork</p>
          </div>

          <Tip text="Vous pouvez partager la facture directement avec votre client via un lien unique sécurisé, sans qu'il ait besoin d'un compte." />
        </section>

        <hr style={styles.hr} />

        {/* 7. Devis */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>7. Créer un devis</h2>
          <p style={styles.p}>
            La création d'un devis suit exactement les mêmes étapes que la facture.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Cliquez sur « + Nouveau » et sélectionnez le type « Devis »." />
            <Step n={2} text="Remplissez les informations client et les articles." />
            <Step n={3} text="Enregistrez et partagez le devis avec votre client." />
            <Step n={4} text="Une fois accepté, convertissez le devis en facture en un seul clic depuis la page du document." />
          </div>

          {/* Quote mockup */}
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <img src={mockupQuote} alt="Exemple de devis SpeedWork" style={{ maxWidth: '100%', width: '480px', borderRadius: '12px', boxShadow: '0 6px 24px rgba(26,86,219,0.12)', border: '1px solid #e5e7eb' }} />
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontFamily: 'Arial, sans-serif' }}>Exemple de devis généré avec SpeedWork</p>
          </div>
        </section>

        <hr style={styles.hr} />

        {/* 8. Clients */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>8. Gérer ses clients</h2>
          <p style={styles.p}>
            La section <strong>Clients</strong> centralise toutes les informations de vos clients et leur historique.
          </p>
          <ul style={styles.ul}>
            <li><strong>Ajouter un client :</strong> Cliquez sur « + Nouveau client », remplissez nom, email, téléphone et adresse.</li>
            <li><strong>Voir l'historique :</strong> Cliquez sur un client pour voir toutes ses factures et devis.</li>
            <li><strong>Modifier / Supprimer :</strong> Utilisez les boutons d'action sur la fiche client.</li>
          </ul>
          <Tip text="Les informations client sont automatiquement suggérées lors de la création d'un document grâce à l'auto-complétion." />
        </section>

        <hr style={styles.hr} />

        {/* 9. Rapports */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>9. Rapports de terrain</h2>
          <p style={styles.p}>
            Les rapports de terrain permettent de documenter vos interventions et chantiers directement depuis votre téléphone.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans la section « Rapports » du menu latéral." />
            <Step n={2} text="Cliquez sur « + Nouveau rapport »." />
            <Step n={3} text="Remplissez : titre, lieu, date d'intervention, observations et recommandations." />
            <Step n={4} text="Ajoutez des photos directement depuis votre appareil photo." />
            <Step n={5} text="Enregistrez le rapport. Il est disponible en PDF pour partage." />
          </div>
        </section>

        <hr style={styles.hr} />

        {/* 10. Paramètres */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>10. Paramètres et personnalisation</h2>
          <p style={styles.p}>
            Configurez SpeedWork à vos couleurs et selon vos besoins depuis la section <strong>Paramètres</strong>.
          </p>
          <ul style={styles.ul}>
            <li><strong>Informations de l'entreprise :</strong> Nom, adresse, email, téléphone, logo.</li>
            <li><strong>Coordonnées bancaires :</strong> IBAN / RIB affiché automatiquement sur vos factures.</li>
            <li><strong>Couleurs et modèles :</strong> Personnalisez l'apparence de vos documents.</li>
            <li><strong>Notes personnalisées :</strong> Ajoutez un texte de pied de page sur tous vos documents.</li>
            <li><strong>Devise :</strong> Choisissez votre devise (FCFA par défaut).</li>
          </ul>
        </section>

        <hr style={styles.hr} />

        {/* 11. Travailleurs & Équipes */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>11. Gestion des travailleurs & équipes</h2>
          <p style={styles.p}>
            SpeedWork vous permet de créer un registre complet de vos travailleurs et de les organiser en équipes par chantier ou projet.
          </p>
          <h3 style={styles.h3}>Registre des travailleurs</h3>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans « Travailleurs » depuis le menu latéral." />
            <Step n={2} text="Cliquez sur « + Nouveau travailleur » et remplissez : nom, prénom, téléphone, poste, type de contrat et salaire de base." />
            <Step n={3} text="Ajoutez une photo de profil (optionnel). Le statut (actif/inactif) est géré automatiquement." />
          </div>
          <h3 style={styles.h3}>Gestion des équipes</h3>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans « Équipes » et cliquez sur « + Nouvelle équipe »." />
            <Step n={2} text="Définissez le nom, le chantier, la zone géographique et le chef d'équipe." />
            <Step n={3} text="Ajoutez des membres depuis votre registre de travailleurs." />
            <Step n={4} text="Géolocalisez l'équipe pour la voir sur la carte interactive." />
          </div>
          <Tip text="Chaque équipe peut être visualisée sur la carte des équipes (/teams-map) avec sa zone d'activité." />
        </section>

        <hr style={styles.hr} />

        {/* 12. Missions */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>12. Missions terrain & carte interactive</h2>
          <p style={styles.p}>
            Assignez des missions géolocalisées à vos travailleurs ou équipes et suivez leur avancement en temps réel.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans « Missions » et cliquez sur « + Nouvelle mission »." />
            <Step n={2} text="Remplissez : titre, description, lieu, coordonnées GPS, date, priorité et salaire." />
            <Step n={3} text="Assignez la mission à un travailleur ou une équipe." />
            <Step n={4} text="Suivez l'avancement : Ouverte → En cours → Terminée." />
            <Step n={5} text="Visualisez toutes les missions sur la carte interactive (« Carte missions »)." />
          </div>
          <Tip text="Les marqueurs sur la carte sont colorés par statut : rouge (ouverte), orange (en cours), vert (terminée), bleu (équipe)." />
        </section>

        <hr style={styles.hr} />

        {/* 13. Pointage */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>13. Pointage & présence</h2>
          <p style={styles.p}>
            Le système de pointage intelligent permet de suivre la présence de vos travailleurs avec validation GPS.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans « Pointage » depuis le menu latéral." />
            <Step n={2} text="Sélectionnez le travailleur et le type d'entrée (Arrivée, Pause, Départ)." />
            <Step n={3} text="La géolocalisation est capturée automatiquement pour vérifier la présence sur site (< 500m)." />
            <Step n={4} text="Ajoutez des preuves photo si nécessaire (avant/après travail)." />
          </div>
          <Tip text="Les retards sont détectés automatiquement (seuil 08h15) et impactent le score de fiabilité et le calcul de paie." />
        </section>

        <hr style={styles.hr} />

        {/* 14. Analytics & Fiabilité */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>14. Analyse de productivité & fiabilité</h2>
          <p style={styles.p}>
            SpeedWork calcule automatiquement des indicateurs de performance pour chaque travailleur et équipe.
          </p>
          <h3 style={styles.h3}>Dashboard analytique</h3>
          <ul style={styles.ul}>
            <li>Missions terminées vs assignées par période</li>
            <li>Temps moyen par mission et rendement par équipe</li>
            <li>Taux de présence et nombre de retards</li>
            <li>Graphiques interactifs et export des rapports</li>
          </ul>
          <h3 style={styles.h3}>Scores de fiabilité</h3>
          <p style={styles.p}>
            Chaque travailleur reçoit un score automatique (A+ à F) basé sur 4 critères pondérés :
          </p>
          <ul style={styles.ul}>
            <li><strong>Ponctualité (30%)</strong> : régularité des arrivées à l'heure</li>
            <li><strong>Missions (25%)</strong> : ratio missions terminées vs assignées</li>
            <li><strong>Qualité (20%)</strong> : preuves de travail soumises</li>
            <li><strong>Présence (25%)</strong> : jours travaillés vs jours ouvrables</li>
          </ul>
        </section>

        <hr style={styles.hr} />

        {/* 15. Paie */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>15. Calcul de paie automatique</h2>
          <p style={styles.p}>
            Le module de paie calcule automatiquement les salaires de vos travailleurs en tenant compte de tous les paramètres.
          </p>
          <div style={styles.steps}>
            <Step n={1} text="Allez dans « Paie » depuis le menu latéral." />
            <Step n={2} text="Sélectionnez le mois et l'année concernés." />
            <Step n={3} text="Cliquez sur « Calculer la paie » — le système prend en compte : jours travaillés, heures, missions terminées, primes de performance, pénalités retard et absences." />
            <Step n={4} text="Consultez la fiche de paie détaillée de chaque travailleur." />
            <Step n={5} text="Validez et exportez les fiches de paie." />
          </div>
          <Tip text="Le salaire de base est défini dans la fiche du travailleur. Les primes et pénalités sont calculées automatiquement à partir des données de pointage et de missions." />
        </section>

        <hr style={styles.hr} />

        {/* 16. FAQ */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={styles.h2}>16. Questions fréquentes</h2>

          <FAQ question="Ma clé d'activation ne fonctionne pas ?">
            Vérifiez que vous l'avez saisie correctement (sans espaces). Contactez le support si le problème persiste.
          </FAQ>

          <FAQ question="Comment télécharger l'application sur mon téléphone ?">
            Ouvrez speedwork.pro dans Chrome, puis tapez sur les 3 points en haut à droite → « Ajouter à l'écran d'accueil ». L'application fonctionne comme une app native.
          </FAQ>

          <FAQ question="Puis-je utiliser SpeedWork hors connexion ?">
            Oui, l'application est une PWA (Progressive Web App). Une fois chargée, certaines fonctionnalités restent accessibles sans internet.
          </FAQ>

          <FAQ question="Comment renouveler mon abonnement ?">
            Effectuez un nouveau dépôt via Mobile Money avant l'expiration et soumettez le formulaire sur speedwork.pro/tarifs. Une nouvelle clé vous sera envoyée.
          </FAQ>

          <FAQ question="Comment contacter le support ?">
            Rendez-vous sur speedwork.pro/contact ou appelez directement le <strong>06 444 6047</strong> (MTN) ou <strong>05 303 9818</strong> (Airtel).
          </FAQ>
        </section>

        {/* Footer */}
        <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '2px solid #1a56db', textAlign: 'center' }}>
          <img src={speedworkLogo} alt="SpeedWork" style={{ height: '36px', margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            © 2025 SpeedWork • speedwork.pro • Tous droits réservés
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
            Support : 06 444 6047 (MTN) | 05 303 9818 (Airtel)
          </p>
        </div>
      </div>

      {/* Learning Section – interactive, hidden from print */}
      <div className="no-print" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="border-t border-border pt-8">
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }>
            <LearningSection />
          </Suspense>
        </div>
      </div>

      {/* AdSense - hidden on print */}
      <div className="no-print" style={{ maxWidth: '820px', margin: '0 auto', padding: '0 60px' }}>
        <AdSenseSlot slot="guide-bottom" />
      </div>

      {/* Bottom spacing */}
      <div className="no-print h-16" />

      <style>{`
        /* Force background & colors in print */
        .guide-doc * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page {
          margin: 15mm 15mm;
          size: A4;
        }
      `}</style>
    </>
  );
}

// --- Sub-components ---

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
      <div style={{
        minWidth: '28px', height: '28px', borderRadius: '50%',
        background: '#1a56db', color: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0,
      }}>
        {n}
      </div>
      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-line', fontFamily: 'Arial, sans-serif' }}>
        {text}
      </p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginTop: '16px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontFamily: 'Arial, sans-serif' }}>
        💡 <strong>Conseil :</strong> {text}
      </p>
    </div>
  );
}

function FAQ({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
      <p style={{ ...styles.p, fontWeight: 700, marginBottom: '4px', color: '#1a1a2e' }}>
        ❓ {question}
      </p>
      <p style={{ ...styles.p, marginTop: 0 }}>{children}</p>
    </div>
  );
}

// --- Styles ---
const styles = {
  h2: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '16px',
    marginTop: '0',
    fontFamily: 'Arial, sans-serif',
    borderLeft: '4px solid #1a56db',
    paddingLeft: '12px',
  } as React.CSSProperties,
  h3: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginTop: '20px',
    marginBottom: '12px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  p: {
    fontSize: '14px',
    lineHeight: 1.8,
    color: '#374151',
    marginBottom: '12px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  ul: {
    paddingLeft: '20px',
    fontSize: '14px',
    lineHeight: 2,
    color: '#374151',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  steps: {
    marginTop: '12px',
    marginBottom: '12px',
  } as React.CSSProperties,
  hr: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px',
    fontSize: '13px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '13px',
  } as React.CSSProperties,
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top' as const,
    fontSize: '13px',
  } as React.CSSProperties,
};
