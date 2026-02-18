import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import speedworkLogo from '@/assets/logo.png';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { label: 'Accueil', to: '/' },
  { label: 'Fonctionnalités', to: '/fonctionnalites' },
  { label: 'Tarifs', to: '/tarifs' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicNavbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={speedworkLogo} alt="SpeedWork" className="h-8 w-auto" />
          <span className="text-xl font-bold text-foreground">SpeedWork</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.to
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link to="/tarifs">Commencer</Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link to="/login">Connexion</Link>
          </Button>
          <button className="p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
              <Link to="/login" onClick={() => setOpen(false)}>Connexion</Link>
            </Button>
            <Button asChild>
              <Link to="/tarifs" onClick={() => setOpen(false)}>Commencer</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
