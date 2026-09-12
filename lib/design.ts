export type Garment = 'tshirt' | 'hoodie' | 'tank'

export type DesignSpec = {
  appName: string
  garment: Garment
  garmentColor: string
  textColor: string
  slogan: string
  description: string
}

export const DEFAULT_SPEC: DesignSpec = {
  appName: 'Vibewear',
  garment: 'tshirt',
  garmentColor: '#111111',
  textColor: '#ffffff',
  slogan: 'VIBECODE',
  description:
    'A clean monochrome staple. Type a prompt or tweak the controls to redesign it live.',
}

export const GARMENT_OPTIONS: { value: Garment; label: string }[] = [
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'tank', label: 'Tank' },
]

export const SWATCHES = [
  '#111111',
  '#ffffff',
  '#6b7280',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#7c3aed',
]
