/** @type {import('tailwindcss').Config} */

/**
 * HireScope design tokens.
 *
 * Everything visual in the app should come from this file. If a component
 * reaches for a raw Tailwind colour like `green-500` or picks its own radius,
 * that is a bug - the point of these tokens is that a decision gets made once,
 * here, rather than re-invented in eight components.
 *
 * `borderRadius` and `fontSize` sit OUTSIDE `extend`, which replaces Tailwind's
 * default scales rather than adding to them. That is deliberate: `rounded-xl`
 * and `text-sm` no longer exist, so reaching for one fails visibly instead of
 * quietly reintroducing a second radius or a seventh text size. Colours stay in
 * `extend` because the defaults there are harmless and occasionally useful.
 */
export default {
  // Tailwind scans these files for class names and only ships the CSS it finds.
  content: ['./index.html', './src/**/*.{js,jsx}'],

  /**
   * Dark mode is driven by a `dark` class on <html>, not the OS setting alone.
   * A toggle needs to be able to override the system preference, and a media
   * query cannot be overridden from JavaScript.
   */
  darkMode: 'class',

  theme: {
    /**
     * Two radii now, not one.
     *
     * `ui` stays the workhorse for inputs, chips and buttons. `panel` is a
     * larger radius for the cards and elevated sections, which at 10px read as
     * boxes rather than surfaces. Still a closed set: no arbitrary values.
     */
    borderRadius: {
      ui: '10px',
      panel: '18px',
      full: '9999px',
    },

    /**
     * A type scale with actual steps in it.
     *
     * The previous scale was too compressed - a 44px "display" against 28px
     * titles and 15px body meant headings never dominated. These are spread
     * much further apart, and `hero` is deliberately oversized for the one
     * place a headline is the entire content of the screen.
     */
    fontSize: {
      // The landing headline. Nothing else uses this.
      hero: ['clamp(2.75rem, 7vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.035em', fontWeight: '700' }],
      // The score when it is the headline of a card. Proportional figures,
      // because it is read as a statement rather than scanned down a column.
      display: ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],
      // Page titles (one per page).
      title: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
      // Section headings inside a page.
      heading: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      // A step between heading and body, for card titles.
      subheading: ['1.0625rem', { lineHeight: '1.4', fontWeight: '600' }],
      // Default body copy.
      body: ['1rem', { lineHeight: '1.65' }],
      // Secondary text: helper copy, counts, timestamps.
      meta: ['0.875rem', { lineHeight: '1.55' }],
      // Eyebrows and table column headers, used uppercase.
      label: ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
    },

    extend: {
      /**
       * Two families, loaded from Google Fonts in index.html.
       *
       * Space Grotesk is geometric with slightly odd, mechanical letterforms -
       * it gives headings a character the default system stack has none of.
       * Inter carries everything else, because it was drawn for UI text at
       * small sizes and stays readable where a display face would not.
       */
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // The hero mesh: two blobs drifting slowly out of phase, so the
        // background is never quite static but never draws attention either.
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.12)' },
        },
        driftSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1.05)' },
          '50%': { transform: 'translate3d(-5%, 5%, 0) scale(0.95)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 18s ease-in-out infinite',
        driftSlow: 'driftSlow 24s ease-in-out infinite',
      },

      /**
       * Layered shadows. A single box-shadow reads as a drop shadow; stacking a
       * tight dark one under a wider soft one is what makes a surface look
       * lifted rather than stuck on.
       */
      boxShadow: {
        card: '0 1px 2px rgb(25 25 25 / 0.04), 0 4px 12px -2px rgb(25 25 25 / 0.06)',
        lifted: '0 2px 4px rgb(25 25 25 / 0.05), 0 12px 28px -6px rgb(25 25 25 / 0.12)',
        panel: '0 1px 3px rgb(25 25 25 / 0.05), 0 20px 44px -12px rgb(109 46 91 / 0.16)',
      },

      colors: {
        /**
         * Primary - deep aubergine.
         *
         * Chosen for what it is NOT next to: the four status colours below
         * occupy green, yellow, orange and red (hues 0-120). Sitting at hue
         * ~318 means a primary button can never be mistaken for a status
         * signal, including by someone with red-green colour blindness.
         * 600 is the base; white text on it clears WCAG AA at 9:1.
         */
        primary: {
          50: '#FAF2F7',
          100: '#F2E0EC',
          200: '#E5C2DA',
          300: '#D19CC2',
          400: '#B472A3',
          500: '#915082',
          600: '#6D2E5B',
          700: '#58254A',
          800: '#421C38',
          900: '#2C1225',
        },

        /**
         * Accent - deep indigo, the second colour in the hero gradient.
         *
         * At hue ~265 it sits between the aubergine and blue: far enough from
         * primary to read as a second colour in a mesh, far enough from the
         * status hues (0-120) to never be mistaken for one.
         */
        accent: {
          50: '#F3F1FA',
          100: '#E4E0F4',
          200: '#C9C1E8',
          300: '#A79BD8',
          400: '#8271C4',
          500: '#614EA6',
          600: '#442E6D',
          700: '#382658',
          800: '#2A1D42',
          900: '#1C132C',
        },

        /**
         * Status colours. These carry meaning, so they are never decoration:
         * every use is paired with a word, and nothing relies on colour alone.
         *
         * Each has these roles:
         *   DEFAULT - the solid colour, for fills and indicator strokes
         *   soft    - a tinted background for chips and callouts
         *   line    - the border that goes with `soft`
         *   ink     - text dark enough to read on `soft` (AA or better)
         *   dark    - the same idea on a dark surface: light enough to read
         *             against near-black, since `ink` would disappear there
         */
        // Note: white text on solid `good` is only 3.35:1, which fails AA for
        // body text. Use `good-ink` on `good-soft` (6.06:1) for anything with
        // words in it; reserve the solid fill for shapes - a ring stroke, a
        // dot, a progress bar - where nothing is written on top.
        good: {
          DEFAULT: '#0ca30c',
          soft: '#E8F7E8',
          line: '#BFE6BF',
          ink: '#0A6B0A',
          dark: '#5FD65F',
        },
        warning: {
          DEFAULT: '#fab219',
          soft: '#FEF6E4',
          line: '#F7DFAB',
          ink: '#8A5D00',
          dark: '#F5C65A',
        },
        serious: {
          DEFAULT: '#ec835a',
          soft: '#FDF0EA',
          line: '#F6CDB8',
          ink: '#9C4620',
          dark: '#F3A27F',
        },
        critical: {
          DEFAULT: '#d03b3b',
          soft: '#FBEAEA',
          line: '#F0C3C3',
          ink: '#9B2626',
          dark: '#F08585',
        },

        /**
         * Neutrals for chrome: page background, panels, borders, muted text.
         *
         * A true grey ramp, not Tailwind's `slate`, which carries a blue tint
         * that fights the aubergine primary. Named `ink` so it cannot collide
         * with Tailwind's own `neutral` scale.
         *
         * Dark mode does NOT simply invert this. The 950/975 steps below are
         * near-black surfaces with a faint warm cast, because a pure inversion
         * of a light grey ramp reads as flat charcoal with no depth between
         * the page and the cards sitting on it.
         */
        ink: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E7E7E9',
          300: '#D4D4D6',
          400: '#A2A2A6',
          500: '#737377',
          600: '#55555A',
          700: '#414145',
          800: '#2A2A2D',
          900: '#191919',
          950: '#141416',
          975: '#0E0E10',
        },
      },
    },
  },
  plugins: [],
};
