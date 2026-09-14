// VIBECODE INC. — Universal Context-Aware UI/UX design model.
// A single generation returns an industry-aware spec: the AI detects the
// industry from the prompt, picks a functional multi-page `template`, and
// emits a matching hex `palette` + an industry-specific `catalog`.

export type Template = 'government' | 'food' | 'ecommerce' | 'generic'

export type Palette = {
  bg: string
  surface: string
  border: string
  text: string
  muted: string
  accent: string
  accentText: string
}

// One row in the industry catalog: a menu item, a product, or a public service.
export type CatalogItem = {
  name: string
  price: number // currency amount (0 = free / not priced)
  meta: string // category, subtitle or short descriptor
}

export type DesignSpec = {
  appName: string
  industry: string // human label of the detected industry, e.g. "Government / Tax"
  template: Template // drives which interactive multi-page UI renders
  palette: Palette // industry-appropriate colors (hex)
  currency: string // symbol prefixing prices, e.g. "Rp", "$"
  tagline: string
  description: string
  primaryAction: string
  categories: string[] // filter chips / quick sections (up to 5)
  catalog: CatalogItem[] // menu items / products / services (up to 6)
  hasContent: boolean // false = neutral "awaiting blueprint" state
}

// Strong, industry-appropriate palette defaults per template. The AI may
// override individual hex values; anything invalid falls back to these so the
// preview is always coherent for the detected industry.
export const TEMPLATE_PALETTES: Record<Template, Palette> = {
  // Institutional: navy authority + steel + orange tax-warning accent.
  government: {
    bg: '#0a1626',
    surface: '#12253c',
    border: 'rgba(148,163,184,0.20)',
    text: '#eaf1f9',
    muted: '#93a7c4',
    accent: '#f97316',
    accentText: '#0a1626',
  },
  // Warm earth tones: espresso, cream, forest green.
  food: {
    bg: '#1b130d',
    surface: '#291d14',
    border: 'rgba(206,170,124,0.22)',
    text: '#f4e9dd',
    muted: '#c2a988',
    accent: '#3f9c5f',
    accentText: '#04140b',
  },
  // Bright, high-conversion marketplace energy (Shopee/Amazon-like).
  ecommerce: {
    bg: '#0e1421',
    surface: '#1a2333',
    border: 'rgba(255,255,255,0.10)',
    text: '#f6f8fc',
    muted: '#9fb0cc',
    accent: '#ff5a1f',
    accentText: '#ffffff',
  },
  // Neutral fallback for anything else.
  generic: {
    bg: '#0a0a0a',
    surface: '#171717',
    border: 'rgba(255,255,255,0.10)',
    text: '#fafafa',
    muted: '#a3a3a3',
    accent: '#6366f1',
    accentText: '#ffffff',
  },
}

export const TEMPLATES: readonly Template[] = [
  'government',
  'food',
  'ecommerce',
  'generic',
] as const

export const TEMPLATE_LABELS: Record<Template, string> = {
  government: 'Government / Public Service',
  food: 'Food & Beverage',
  ecommerce: 'E-Commerce / Marketplace',
  generic: 'Universal App',
}

export const DEFAULT_SPEC: DesignSpec = {
  appName: 'VIBECODE INC.',
  industry: '',
  template: 'generic',
  palette: TEMPLATE_PALETTES.generic,
  currency: '$',
  tagline: '',
  description: '',
  primaryAction: '',
  categories: [],
  catalog: [],
  hasContent: false,
}
