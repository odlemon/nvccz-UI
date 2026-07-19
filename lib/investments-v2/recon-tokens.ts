/**
 * Theme-aware recon surface tokens.
 * Resolve via .investments-terminal.dark | .light CSS variables.
 */
export const R = {
  page: 'var(--background)',
  card: 'var(--card)',
  cardBorder: 'var(--border)',
  muted: 'var(--muted-foreground)',
  muted2: 'var(--muted-foreground)',
  text: 'var(--foreground)',
  control: 'var(--secondary)',
  controlBorder: 'var(--input)',
  blue: 'var(--primary)',
  blueLink: 'var(--primary)',
  green: 'var(--chart-4)',
  greenSoft: 'var(--chart-4)',
  amber: 'var(--chart-5)',
  yellow: 'var(--chart-5)',
  red: 'var(--destructive)',
  purple: 'var(--chart-2)',
  indigo: 'var(--chart-2)',
  rowBorder: 'var(--border)',
  tabBorder: 'var(--border)',
  select: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  selectBorder: 'var(--primary)',
  doc: 'var(--muted)',
} as const

/** Status / accent hex kept for charts & pills that need solid colors in both themes */
export const ReconAccent = {
  blue: '#3B82F6',
  blueSoft: '#60A5FA',
  green: '#22C55E',
  greenSoft: '#4ADE80',
  amber: '#F59E0B',
  amberSoft: '#FBBF24',
  red: '#EF4444',
  redSoft: '#F87171',
  purple: '#A855F7',
  purpleSoft: '#C084FC',
  yellow: '#EAB308',
} as const
