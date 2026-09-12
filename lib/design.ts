export type AppType = 'mobile' | 'saas' | 'landing' | 'ecommerce'
export type ColorScheme =
  | 'monochrome'
  | 'cyberpunk'
  | 'enterprise'
  | 'emerald'

export type DesignSpec = {
  appName: string
  appType: AppType
  colorScheme: ColorScheme
  tagline: string
  description: string
  features: string[]
  primaryAction: string
  // false = neutral "awaiting blueprint" state (nothing generated yet)
  hasContent: boolean
}

export const DEFAULT_SPEC: DesignSpec = {
  appName: 'VIBECODE INC.',
  appType: 'mobile',
  colorScheme: 'monochrome',
  tagline: '',
  description: '',
  features: [],
  primaryAction: '',
  hasContent: false,
}

export const APP_TYPE_OPTIONS: { value: AppType; label: string }[] = [
  { value: 'mobile', label: 'Mobile App (APK)' },
  { value: 'saas', label: 'SaaS Dashboard (Web)' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'ecommerce', label: 'E-Commerce Website' },
]

export const COLOR_SCHEME_OPTIONS: {
  value: ColorScheme
  label: string
}[] = [
  { value: 'monochrome', label: 'Minimal Monochrome' },
  { value: 'cyberpunk', label: 'Cyberpunk Neon' },
  { value: 'enterprise', label: 'Enterprise Blue' },
  { value: 'emerald', label: 'Emerald Nature' },
]

export type Palette = {
  bg: string
  surface: string
  border: string
  text: string
  muted: string
  accent: string
  accentText: string
  swatch: string
}

export const PALETTES: Record<ColorScheme, Palette> = {
  monochrome: {
    bg: '#0a0a0a',
    surface: '#171717',
    border: 'rgba(255,255,255,0.10)',
    text: '#fafafa',
    muted: '#a3a3a3',
    accent: '#fafafa',
    accentText: '#0a0a0a',
    swatch: '#e5e5e5',
  },
  cyberpunk: {
    bg: '#0a0613',
    surface: '#170d28',
    border: 'rgba(255,64,196,0.22)',
    text: '#f4e9ff',
    muted: '#b28fe0',
    accent: '#ff2fb9',
    accentText: '#0a0613',
    swatch: '#ff2fb9',
  },
  enterprise: {
    bg: '#0b1220',
    surface: '#131f36',
    border: 'rgba(147,197,253,0.18)',
    text: '#eef2ff',
    muted: '#93a4c4',
    accent: '#3b82f6',
    accentText: '#ffffff',
    swatch: '#3b82f6',
  },
  emerald: {
    bg: '#061410',
    surface: '#0d241b',
    border: 'rgba(52,211,153,0.20)',
    text: '#e7f6ee',
    muted: '#84c3a4',
    accent: '#10b981',
    accentText: '#04140d',
    swatch: '#10b981',
  },
}
