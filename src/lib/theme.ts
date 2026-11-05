import type React from 'react';

const THEME_KEYS: [string, string][] = [
  ['primaryColor', '--cobalt'],
  ['secondaryColor', '--cobalt-2'],
  ['surfaceColor', '--wash'],
  ['backgroundColor', '--milk'],
  ['accentColor', '--mustard'],
  ['textColor', '--ink'],
  ['mutedTextColor', '--muted'],
];

/** Maps the CMS design system (globalData colours) onto the storefront's CSS tokens. */
export function themeStyle(global: Record<string, any> | undefined): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const [k, v] of THEME_KEYS) {
    const val = global?.[k];
    if (typeof val === 'string' && /^#|^rgb|^hsl|^oklch/.test(val)) style[v] = val;
  }
  return style as React.CSSProperties;
}
