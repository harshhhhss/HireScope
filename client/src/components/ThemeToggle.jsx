import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { focusRing } from './formStyles';

const STORAGE_KEY = 'hirescope_theme';

/**
 * Light/dark toggle.
 *
 * The class is applied to <html> by an inline script in index.html before the
 * first paint - doing it here, after React mounts, would flash a white page at
 * dark-mode users on every load. This component only reads that existing state
 * and flips it.
 *
 * It follows the OS preference until the user chooses, at which point the
 * choice is remembered and wins. Every localStorage access is guarded: in
 * private mode it throws rather than returning null, and a theme toggle is not
 * worth crashing a page over.
 */
function readInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    // Enable colour transitions only after mount, so the very first paint is
    // not animated from whatever the browser assumed.
    root.classList.add('theme-transition');

    root.classList.toggle('dark', theme === 'dark');

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // Private browsing, or storage disabled. The toggle still works for
      // this session; it just will not be remembered.
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`rounded-ui p-2 text-ink-500 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100 ${focusRing}`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
