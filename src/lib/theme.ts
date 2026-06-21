export type ThemeId = 'night' | 'slate' | 'steel' | 'light' | 'warm'

export interface Theme {
  id: ThemeId
  label: string
  dark: boolean
  // backgrounds
  bgPage: string
  bgPanel: string
  bgElevated: string
  bgInput: string
  // borders
  border: string
  border2: string
  // text
  text: string
  text2: string
  text3: string
  // accent
  accent: string
  accentHover: string
  accentText: string
  // status
  green: string
  red: string
  orange: string
}

export const THEMES: Theme[] = [
  {
    id: 'night', label: '🌑 Night', dark: true,
    bgPage: '#0f1117', bgPanel: '#161820', bgElevated: '#1e2030', bgInput: '#1e2030',
    border: '#2a2d45', border2: '#343760',
    text: '#e2e4f0', text2: '#9098c0', text3: '#5a6080',
    accent: '#5b6af0', accentHover: '#6b7af0', accentText: '#7c8bff',
    green: '#3ecf8e', red: '#f06060', orange: '#f0a050',
  },
  {
    id: 'slate', label: '🌒 Slate', dark: true,
    bgPage: '#0f1f35', bgPanel: '#0a1628', bgElevated: '#1a3050', bgInput: '#1a3050',
    border: '#2d4a6e', border2: '#3a5a80',
    text: '#e2e8f0', text2: '#94afc8', text3: '#4a6888',
    accent: '#60a5fa', accentHover: '#7ab8ff', accentText: '#93c5fd',
    green: '#34d399', red: '#f87171', orange: '#fbbf24',
  },
  {
    id: 'steel', label: '⚙️ Steel', dark: true,
    bgPage: '#14161a', bgPanel: '#1c1f24', bgElevated: '#252830', bgInput: '#252830',
    border: '#30343d', border2: '#3d4250',
    text: '#d8dce8', text2: '#7a8098', text3: '#4a5068',
    accent: '#7c8bff', accentHover: '#8c9bff', accentText: '#a0acff',
    green: '#4ade80', red: '#f87171', orange: '#fb923c',
  },
  {
    id: 'light', label: '☀️ Light', dark: false,
    bgPage: '#f5f6fa', bgPanel: '#ffffff', bgElevated: '#eef0f7', bgInput: '#f5f6fa',
    border: '#d0d4e8', border2: '#b8bedd',
    text: '#1a1d2e', text2: '#5060a0', text3: '#8090c0',
    accent: '#4f5de0', accentHover: '#3a4cd0', accentText: '#4f5de0',
    green: '#1aa870', red: '#d04040', orange: '#d08030',
  },
  {
    id: 'warm', label: '🌅 Warm', dark: false,
    bgPage: '#faf8f4', bgPanel: '#ffffff', bgElevated: '#f2ede5', bgInput: '#f5f0e8',
    border: '#d8cfc0', border2: '#c0b4a0',
    text: '#251e14', text2: '#806040', text3: '#a08060',
    accent: '#c06030', accentHover: '#a04820', accentText: '#c06030',
    green: '#3a8c50', red: '#c04040', orange: '#c07030',
  },
]

const KEY = 'gantt_theme'

export function getStoredTheme(): ThemeId {
  return (localStorage.getItem(KEY) as ThemeId) ?? 'night'
}

export function applyTheme(id: ThemeId) {
  const t = THEMES.find(th => th.id === id) ?? THEMES[0]
  const r = document.documentElement
  r.setAttribute('data-theme', id)
  Object.entries({
    '--g-bg-page':    t.bgPage,
    '--g-bg-panel':   t.bgPanel,
    '--g-bg-elev':    t.bgElevated,
    '--g-bg-input':   t.bgInput,
    '--g-border':     t.border,
    '--g-border2':    t.border2,
    '--g-text':       t.text,
    '--g-text2':      t.text2,
    '--g-text3':      t.text3,
    '--g-accent':     t.accent,
    '--g-accent-h':   t.accentHover,
    '--g-accent-t':   t.accentText,
    '--g-green':      t.green,
    '--g-red':        t.red,
    '--g-orange':     t.orange,
  }).forEach(([k, v]) => r.style.setProperty(k, v))
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(KEY, id)
  applyTheme(id)
}
