import { Link } from 'react-router-dom';
import speedworkLogo from '@/assets/logo-small.webp';
import kubatechLogo from '@/assets/kubatech-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicFooter() {
  const { t } = useLanguage();

  const navLinks = [
    { label: t('pub.home'), to: '/' },
    { label: t('pub.features'), to: '/fonctionnalites' },
    { label: t('pub.pricing'), to: '/tarifs' },
    { label: t('footer.userGuide'), to: '/guide' },
    { label: t('pub.contact'), to: '/contact' },
    { label: t('pub.about'), to: '/a-propos' },
    { label: t('pub.login'), to: '/login' },
  ];

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
              {t('footer.description')}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('footer.navigation')}</h3>
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
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('footer.contact')}</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-1">
              <p>Oyo, Congo-Brazzaville</p>
              <p>
                <a href="mailto:speedwork033@gmail.com" className="hover:text-foreground transition-colors">
                  speedwork033@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SpeedWork. {t('footer.rights')}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Produit par</span>
          <img
            src={kubatechLogo}
            alt="KubaTech"
            className="h-6 w-6 rounded-full object-cover"
            width={24}
            height={24}
            loading="lazy"
          />
          <span className="font-semibold text-foreground">KubaTech</span>
        </div>
      </div>
    </footer>
  );
}
