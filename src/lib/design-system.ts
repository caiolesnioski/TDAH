/**
 * Design system tokens — fonte única de verdade para uso em código JS/TS.
 *
 * Para uso em classes Tailwind, prefira os utilitários gerados automaticamente
 * (bg-primary, text-muted-foreground, border-border, etc.).
 * Use estes tokens apenas quando precisar de valores inline em style props,
 * canvas, SVG ou bibliotecas de terceiros que não aceitam classes CSS.
 */

export const ds = {
  colors: {
    /* Superfícies */
    background: '#0F172A',
    surface: '#1A2236',
    surfaceHover: '#1E2A3F',

    /* Bordas */
    border: '#2A3A55',
    borderStrong: '#3A4A65',

    /* Primária (indigo) */
    primary: '#6366F1',
    primaryHover: '#4F46E5',

    /* Semânticas */
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',

    /* Texto */
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#4A6080',
  },

  /* Opacidades de fundo para badges/pills */
  badgeAlpha: {
    primary: 'rgba(99, 102, 241, 0.15)',
    success: 'rgba(16, 185, 129, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
    danger: 'rgba(239, 68, 68, 0.15)',
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  /* Font sizes — mínimo 13px em toda a interface */
  fontSize: {
    min: '0.8125rem',  /* 13px */
    sm: '0.875rem',    /* 14px */
    base: '1rem',      /* 16px */
    lg: '1.125rem',    /* 18px */
    xl: '1.25rem',     /* 20px */
    '2xl': '1.5rem',   /* 24px */
  },
} as const;

export type ColorToken = keyof typeof ds.colors;
