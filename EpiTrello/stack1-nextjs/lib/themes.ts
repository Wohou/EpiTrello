// Theme definitions
export const themes = {
  default: {
    name: 'Gradient Bleu',
    background: 'linear-gradient(to bottom, #373B44, #4286f4)',
    primary: '#4286f4',
    secondary: '#373B44',
    accent: '#667eea',
  },
  purple: {
    name: 'Violet Mystique',
    background: 'linear-gradient(to bottom, #360033, #0b8793)',
    primary: '#0b8793',
    secondary: '#360033',
    accent: '#667eea',
  },
  sunset: {
    name: 'Coucher de Soleil',
    background: 'linear-gradient(to bottom, #ff6e7f, #bfe9ff)',
    primary: '#ff6e7f',
    secondary: '#bfe9ff',
    accent: '#ff8a80',
  },
  forest: {
    name: 'Forêt Enchantée',
    background: 'linear-gradient(to bottom, #134e5e, #71b280)',
    primary: '#71b280',
    secondary: '#134e5e',
    accent: '#52c234',
  },
  ocean: {
    name: 'Océan Profond',
    background: 'linear-gradient(to bottom, #2e3192, #1bffff)',
    primary: '#1bffff',
    secondary: '#2e3192',
    accent: '#4facfe',
  },
  rose: {
    name: 'Rose Élégant',
    background: 'linear-gradient(to bottom, #e61e4d, #f79cbd)',
    primary: '#e61e4d',
    secondary: '#f79cbd',
    accent: '#ff4081',
  },
  dark: {
    name: 'Nuit Étoilée',
    background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)',
    primary: '#302b63',
    secondary: '#0f0c29',
    accent: '#5f72bd',
  },
  mint: {
    name: 'Menthe Fraîche',
    background: 'linear-gradient(to bottom, #00b4db, #0083b0)',
    primary: '#00b4db',
    secondary: '#0083b0',
    accent: '#00d4ff',
  },
}

export type ThemeKey = keyof typeof themes
export type Theme = typeof themes[ThemeKey]
