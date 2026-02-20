import { Link } from 'react-router-dom';
import speedworkLogo from '@/assets/logo.webp';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Fonctionnalités', to: '/fonctionnalites' },
  { label: 'Tarifs', to: '/tarifs' },
  { label: 'Guide d\'utilisation', to: '/guide' },
  { label: 'Contact', to: '/contact' },
  { label: 'Connexion', to: '/login' },
];

export default function PublicFooter() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={speedworkLogo} alt="SpeedWork" className="h-7 w-auto" width={28} height={28} loading="lazy" />
              <span className="text-lg font-bold text-foreground">SpeedWork</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Logiciel de facturation et devis en ligne pour entreprises en Afrique, Congo-Brazzaville et dans le monde entier.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold text-foreground mb-3">Navigation</h3>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-1">
              <p>Oyo, Congo-Brazzaville</p>
              <p>
                <a href="mailto:contact@speedwork.pro" className="hover:text-foreground transition-colors">
                  contact@speedwork.pro
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SpeedWork. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
