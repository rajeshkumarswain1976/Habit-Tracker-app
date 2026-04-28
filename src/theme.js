export const theme = {
  colors: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#ec4899',
    secondaryLight: '#f472b6',
    tertiary: '#14b8a6',
    tertiaryLight: '#2dd4bf',
    
    background: '#0f172a',
    backgroundLight: '#1e293b',
    surface: '#1e293b',
    surfaceLight: '#334155',
    surfaceLighter: '#475569',
    
    success: '#22c55e',
    successLight: '#4ade80',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    error: '#ef4444',
    errorLight: '#f87171',
    
    white: '#ffffff',
    black: '#000000',
    
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    
    border: '#334155',
    borderLight: '#475569',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    secondary: ['#ec4899', '#f472b6'],
    success: ['#22c55e', '#4ade80'],
    background: ['#0f172a', '#1e1b4b'],
    card: ['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)'],
    gold: ['#f59e0b', '#fbbf24'],
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
