import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import speedworkLogo from '@/assets/logo-small.webp';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicNavbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const links = [
    { label: t('pub.home'), to: '/' },
    { label: t('pub.features'), to: '/fonctionnalites' },
    { label: t('pub.pricing'), to: '/tarifs' },
    { label: t('pub.blog'), to: '/blog' },
    { label: t('pub.guide'), to: '/guide' },
    { label: t('pub.contact'), to: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={speedworkLogo} alt="SpeedWork" className="h-8 w-auto" width={32} height={32} decoding="async" />
          <span className="text-xl font-bold text-foreground">SpeedWork</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.to
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">{t('pub.login')}</Link>
          </Button>
          <Button asChild>
            <Link to="/tarifs">{t('pub.start')}</Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link to="/login">{t('pub.login')}</Link>
          </Button>
          <button className="p-2" onClick={() => setOpen(!open)} aria-label={open ? t('pub.closeMenu') : t('pub.openMenu')} aria-expanded={open}>
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-3 text-sm font-medium ${
                pathname === l.to ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 mt-3">
            <Button variant="outline" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>{t('pub.login')}</Link>
            </Button>
            <Button asChild>
              <Link to="/tarifs" onClick={() => setOpen(false)}>{t('pub.start')}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
