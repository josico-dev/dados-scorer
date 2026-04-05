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
    appBg:        'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 40%, #f5f0ff 100%)',
    headerBg:     'rgba(255,255,255,0.9)',
    scorecardBg:  'rgba(255,255,255,0.95)',
    scorecardBorder: 'rgba(99,102,241,0.25)',
    rowEven:      'rgba(0,0,0,0.03)',
    rowOdd:       'transparent',
    text:         '#0f172a',
    textMuted:    'rgba(0,0,0,0.45)',
    textFaint:    'rgba(0,0,0,0.25)',
    cellBg:       'rgba(0,0,0,0.04)',
    inputBg:      'rgba(0,0,0,0.06)',
    borderSubtle: 'rgba(0,0,0,0.08)',
    sectionBg:    'rgba(0,0,0,0.06)',
    bodyBg:       '#dde3f5',
  },
}

const THEME_KEY = 'dados-scorer-theme'
export const loadTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' } }
export const saveTheme = t => { try { localStorage.setItem(THEME_KEY, t) } catch {} }
