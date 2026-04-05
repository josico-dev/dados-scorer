// ─── Sistema de tema claro/oscuro ────────────────────────────────────────────

export const THEMES = {
  dark: {
    appBg:        'linear-gradient(135deg, #0d0221 0%, #0a0f2e 40%, #060d1f 100%)',
    headerBg:     'rgba(10,8,30,0.85)',
    scorecardBg:  'rgba(15,12,40,0.85)',
    scorecardBorder: 'rgba(99,102,241,0.2)',
    rowEven:      'rgba(255,255,255,0.03)',
    rowOdd:       'transparent',
    text:         '#f1f5f9',
    textMuted:    'rgba(255,255,255,0.4)',
    textFaint:    'rgba(255,255,255,0.2)',
    cellBg:       'rgba(255,255,255,0.05)',
    inputBg:      'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    sectionBg:    'rgba(0,0,0,0.3)',
    bodyBg:       '#060918',
  },
  light: {
    appBg:           'linear-gradient(135deg, #e8ecff 0%, #f0eaff 50%, #e4f0ff 100%)',
    headerBg:        'rgba(255,255,255,0.95)',
    scorecardBg:     '#ffffff',
    scorecardBorder: 'rgba(99,102,241,0.35)',
    rowEven:         'rgba(99,102,241,0.05)',
    rowOdd:          'transparent',
    text:            '#0f172a',          // negro casi puro
    textMuted:       '#374151',          // gris oscuro legible
    textFaint:       '#6b7280',          // gris medio
    cellBg:          'rgba(0,0,0,0.05)',
    inputBg:         'rgba(0,0,0,0.07)',
    borderSubtle:    'rgba(0,0,0,0.12)',
    sectionBg:       'rgba(0,0,0,0.05)',
    bodyBg:          '#c7d2fe',
  },
}

const THEME_KEY = 'dados-scorer-theme'
export const loadTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' } }
export const saveTheme = t => { try { localStorage.setItem(THEME_KEY, t) } catch {} }
