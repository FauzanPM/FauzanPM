import { useEffect, useState } from 'react';
import { ArrowUpRight, Command, Menu, X } from 'lucide-react';
import { BrandMark } from './BrandIcons';

const links = [
  { id: 'work', label: 'Selected work' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'about', label: 'About' },
];

export function Navigation({ openCommands }: { openCommands: () => void }) {
  const [active, setActive] = useState('');
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -55% 0px' },
    );
    document.querySelectorAll('main > section[id]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <a
          href="#home"
          className="brand"
          aria-label="fauzan.pm — Fauzan Prima Mukti, home"
          onClick={() => setMenu(false)}
        >
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span>
            fauzan<span className="brand-suffix">.pm</span>
          </span>
        </a>
        <nav
          className={`main-nav ${menu ? 'is-open' : ''}`}
          aria-label="Main navigation"
          id="main-navigation"
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'location' : undefined}
              onClick={() => setMenu(false)}
            >
              {link.label}
            </a>
          ))}
          <a className="mobile-contact" href="#contact" onClick={() => setMenu(false)}>
            Let’s talk <ArrowUpRight size={16} />
          </a>
        </nav>
        <div className="nav-actions">
          <button className="command-trigger" onClick={openCommands} aria-label="Open command menu">
            <Command size={14} />
            <span>K</span>
          </button>
          <a className="nav-contact" href="#contact">
            Let’s talk <ArrowUpRight size={15} />
          </a>
          <button
            className="menu-toggle icon-button"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-controls="main-navigation"
            aria-label={menu ? 'Close navigation' : 'Open navigation'}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
