import { useId, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  FileText,
  FolderOpen,
  Mail,
  Search,
  User,
  Zap,
} from 'lucide-react';
import { GitHubIcon } from './BrandIcons';
import { Dialog } from './Dialog';
import { profile } from '../data/portfolio';

export function CommandPalette({ onClose, openCV }: { onClose: () => void; openCV: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const listId = useId();
  const actions = [
    { label: 'Explore selected work', hint: 'Projects', icon: FolderOpen, href: '#work' },
    { label: 'Discover my expertise', hint: 'Capabilities', icon: Zap, href: '#expertise' },
    { label: 'A little about me', hint: 'Background', icon: User, href: '#about' },
    { label: 'View my résumé', hint: 'PDF', icon: FileText, href: 'cv' },
    { label: 'Start a conversation', hint: 'Contact', icon: Mail, href: '#contact' },
    { label: 'Explore GitHub', hint: 'External', icon: GitHubIcon, href: profile.github },
  ].filter((action) =>
    `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()),
  );
  function activate(index: number) {
    const action = actions[index];
    if (!action) return;
    onClose();
    if (action.href === 'cv') {
      openCV();
      return;
    }
    if (action.href.startsWith('#')) {
      requestAnimationFrame(() => {
        const section = document.querySelector<HTMLElement>(action.href);
        section?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
        section?.focus({ preventScroll: true });
        history.replaceState(null, '', action.href);
      });
    } else window.open(action.href, '_blank', 'noopener,noreferrer');
  }
  return (
    <Dialog title="Command menu" onClose={onClose} className="command-dialog">
      <div className="command-search">
        <Search size={20} />
        <input
          data-dialog-autofocus
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={actions.length ? `${listId}-${selected}` : undefined}
          placeholder="Where would you like to go?"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setSelected((index) => (index + 1) % (actions.length || 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected((index) => (index - 1 + actions.length) % (actions.length || 1));
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              activate(selected);
            }
          }}
        />
      </div>
      <p className="command-label mono">QUICK NAVIGATION</p>
      <div role="listbox" id={listId} aria-label="Commands" className="command-results">
        {actions.map((action, index) => (
          <div
            id={`${listId}-${index}`}
            key={action.label}
            role="option"
            aria-selected={selected === index}
            className={`command-option ${selected === index ? 'is-selected' : ''}`}
            onMouseEnter={() => setSelected(index)}
            onClick={() => activate(index)}
          >
            <action.icon size={18} />
            <span>{action.label}</span>
            <small>{action.hint}</small>
            <ArrowUpRight size={14} />
          </div>
        ))}
        {!actions.length && (
          <p className="command-empty">No matching commands. Try “projects” or “résumé”.</p>
        )}
      </div>
      <div className="command-footer mono">
        <span>
          <ArrowUp size={12} />
          <ArrowDown size={12} /> navigate
        </span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </Dialog>
  );
}
