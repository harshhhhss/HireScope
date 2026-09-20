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
  theme: {
    /**
     * One radius, for every rectangular surface in the app: panels, inputs,
     * buttons, chips. The audit found four values (rounded-lg, -md, -xl and
     * -full) applied with no rule behind which went where.
     *
     * This replaces the default scale rather than extending it, so `rounded-ui`
     * is now the only radius that exists.
     */
    borderRadius: {
      ui: '10px',
    },

    /**
     * A type scale with actual steps in it.
     *
     * The audit found 48 of ~75 size classes were `text-sm`, which is why every
     * element used to read with the same importance. These six sizes are
     * deliberately far enough apart to build a hierarchy from, and they are the
     * only sizes that exist now.
     */
    fontSize: {
      // The score when it is the headline of a card. Proportional figures,
      // because it is read as a statement rather than scanned down a column.
      display: ['2.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
      // Page titles (one per page).
      title: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
      // Section headings inside a page.
      heading: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      // Default body copy. 15px, a step up from the 14px everything used to be.
      body: ['0.9375rem', { lineHeight: '1.6' }],
      // Secondary text: helper copy, counts, timestamps.
      meta: ['0.8125rem', { lineHeight: '1.5' }],
      // Eyebrows and table column headers, used uppercase.
      label: ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.06em', fontWeight: '600' }],
    },

    extend: {
      /**
       * One entrance animation, used on the landing page only.
       *
       * Applied through the `motion-safe:` variant, so anyone who has asked
       * their OS for reduced motion gets the content immediately with no
       * movement. `both` fill mode means the element is simply visible when
       * the animation does not run.
       */
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
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
         * Status colours. These carry meaning, so they are never decoration:
         * every use is paired with a word, and nothing relies on colour alone.
         *
         * Each has three roles:
         *   DEFAULT - the solid colour, for fills and indicator strokes
         *   soft    - a tinted background for chips and callouts
         *   line    - the border that goes with `soft`
         *   ink     - text dark enough to read on `soft` (AA or better)
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
        },
        warning: {
          DEFAULT: '#fab219',
          soft: '#FEF6E4',
          line: '#F7DFAB',
          ink: '#8A5D00',
        },
        serious: {
          DEFAULT: '#ec835a',
          soft: '#FDF0EA',
          line: '#F6CDB8',
          ink: '#9C4620',
        },
        critical: {
          DEFAULT: '#d03b3b',
          soft: '#FBEAEA',
          line: '#F0C3C3',
          ink: '#9B2626',
        },

        /**
         * Neutrals for chrome: page background, panels, borders, muted text.
         *
         * A true grey ramp, not Tailwind's `slate`, which carries a blue tint
         * that fights the aubergine primary. Named `ink` so it cannot collide
         * with Tailwind's own `neutral` scale.
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
        },
      },
    },
  },
  plugins: [],
};
