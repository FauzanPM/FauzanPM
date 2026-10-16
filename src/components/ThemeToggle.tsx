import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';
const storageKey = 'fauzanpm-theme';
const duration = 820;

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.backgroundColor = theme === 'light' ? '#f5f6ee' : '#080d0b';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f5f6ee' : '#080d0b');
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Private browsing may disable storage; the current session still works.
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

/** Changes real page colors beneath a circular, composited snapshot reveal. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [changing, setChanging] = useState(false);
  const busy = useRef(false);
  const cancel = useRef<() => void>(() => {});

  useEffect(() => {
    const storage = (event: StorageEvent) => {
      if (event.key !== storageKey || busy.current) return;
      const next = event.newValue === 'light' ? 'light' : 'dark';
      applyTheme(next);
      setTheme(next);
    };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => {
      if (motion.matches) cancel.current();
    };
    window.addEventListener('storage', storage);
    motion.addEventListener('change', stopMotion);
    return () => {
      cancel.current();
      window.removeEventListener('storage', storage);
      motion.removeEventListener('change', stopMotion);
    };
  }, []);

  const toggle = async (button: HTMLButtonElement) => {
    if (busy.current) return;
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const commit = () => {
      applyTheme(next);
      flushSync(() => setTheme(next));
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      return;
    }

    busy.current = true;
    setChanging(true);
    const root = document.documentElement;
    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty('--theme-origin-x', `${x}px`);
    root.style.setProperty('--theme-origin-y', `${y}px`);
    root.style.setProperty('--theme-radius', `${radius}px`);

    const finish = () => {
      delete root.dataset.themeTransition;
      busy.current = false;
      setChanging(false);
      cancel.current = () => {};
    };

    if (typeof document.startViewTransition === 'function') {
      root.dataset.themeTransition = 'radial';
      let committed = false;
      const transition = document.startViewTransition(() => {
        commit();
        committed = true;
      });
      let animation: Animation | undefined;
      cancel.current = () => {
        animation?.finish();
        transition.skipTransition();
      };
      try {
        await transition.ready;
        animation = root.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
            pseudoElement: '::view-transition-new(root)',
          },
        );
        await animation.finished;
      } catch {
        // A hidden tab or another transition may abort snapshot creation.
        if (!committed) commit();
        transition.skipTransition();
      } finally {
        animation?.cancel();
        finish();
      }
      return;
    }

    // Browsers without snapshots get a soft light wave and interpolated colors.
    root.dataset.themeTransition = 'fallback';
    const wave = document.createElement('div');
    wave.className = 'theme-wave';
    wave.setAttribute('aria-hidden', 'true');
    document.body.append(wave);
    // Resolve the old palette with transitions installed before switching it.
    void getComputedStyle(document.body).backgroundColor;
    commit();
    let timer = 0;
    const cleanup = () => {
      window.clearTimeout(timer);
      wave.remove();
      finish();
    };
    cancel.current = cleanup;
    timer = window.setTimeout(cleanup, duration + 80);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-disabled={changing || undefined}
      data-changing={changing || undefined}
      onClick={(event) => void toggle(event.currentTarget)}
    >
      <span className="theme-toggle-orbit" aria-hidden="true" />
      <span className="theme-toggle-icons" aria-hidden="true">
        <Sun className="theme-sun" size={17} strokeWidth={1.6} />
        <Moon className="theme-moon" size={16} strokeWidth={1.6} />
      </span>
      <span className="theme-toggle-caption" aria-hidden="true">
        {theme === 'dark' ? 'Daylight' : 'Nightfall'}
      </span>
    </button>
  );
}
