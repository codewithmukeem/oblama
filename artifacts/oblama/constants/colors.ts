/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0a0a0a',
    tint: '#5146c7',

    // Core surfaces
    background: '#ffffff',
    foreground: '#0a0a0a',

    // Cards / elevated surfaces
    card: '#f9f9f9',
    cardForeground: '#0a0a0a',

    // Primary action color (buttons, links, active states)
    primary: '#5146c7',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#f4f3f8',
    secondaryForeground: '#1a1a1a',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f4f3f8',
    mutedForeground: '#6d6b78',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#eeecff',
    accentForeground: '#1a1a1a',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e5e5e5',
    input: '#e5e5e5',
  },

  dark: {
    text: '#f7f7fa',
    tint: '#9c93ff',
    background: '#07070a',
    foreground: '#f7f7fa',
    card: '#121218',
    cardForeground: '#f7f7fa',
    primary: '#9c93ff',
    primaryForeground: '#121218',
    secondary: '#1b1a22',
    secondaryForeground: '#f7f7fa',
    muted: '#17161d',
    mutedForeground: '#aaa7b5',
    accent: '#24213d',
    accentForeground: '#e5e2ff',
    destructive: '#ff716d',
    destructiveForeground: '#210807',
    border: '#2b2932',
    input: '#302e38',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
