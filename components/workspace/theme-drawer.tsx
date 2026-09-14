'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelRightClose, PanelRightOpen, Pipette, RotateCcw, Check } from 'lucide-react'
import { TEMPLATE_PALETTES, type DesignSpec } from '@/lib/design'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Color math — HSV <-> RGB <-> hex. Pure, deterministic, SSR-safe.    */
/* ------------------------------------------------------------------ */

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function toHex(n: number) {
  return n.toString(16).padStart(2, '0').toUpperCase()
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

// Readable text color for a given accent swatch (relative luminance).
function readableText(hex: string) {
  const parsed = hexToHsv(hex)
  if (!parsed) return '#ffffff'
  const { r, g, b } = hsvToRgb(parsed.h, parsed.s, parsed.v)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0a0a0a' : '#ffffff'
}

/* ------------------------------------------------------------------ */
/* Preset palette matrix — high-density brand swatch grid.             */
/* ------------------------------------------------------------------ */

const PRESET_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#EE4D2D', name: 'Shopee Orange' },
  { hex: '#FF6B00', name: 'Transaction Amber' },
  { hex: '#10B981', name: 'Money Emerald' },
  { hex: '#3B82F6', name: 'Academic Blue' },
  { hex: '#8B5CF6', name: 'Product Violet' },
  { hex: '#14B8A6', name: 'Clinical Teal' },
  { hex: '#F43F5E', name: 'Signal Rose' },
  { hex: '#0A192F', name: 'Civic Navy' },
  { hex: '#EAB308', name: 'Premium Gold' },
  { hex: '#6366F1', name: 'Indigo Core' },
  { hex: '#22C55E', name: 'Fresh Green' },
  { hex: '#0EA5E9', name: 'Sky Cyan' },
]

/* ------------------------------------------------------------------ */
/* Pane 3 — Dynamic Layout Modifiers & 2D Color Area Canvas Matrix     */
/* ------------------------------------------------------------------ */

export function ThemeDrawer({
  spec,
  open,
  onToggle,
  onApplyAccent,
  disabled,
}: {
  spec: DesignSpec
  open: boolean
  onToggle: () => void
  onApplyAccent: (hex: string) => void
  disabled: boolean
}) {
  const initial = hexToHsv(spec.palette.accent) ?? { h: 20, s: 0.85, v: 0.93 }
  const [hue, setHue] = useState(initial.h)
  const [sat, setSat] = useState(initial.s)
  const [val, setVal] = useState(initial.v)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  // Sync the cursor to the live accent whenever a new spec/theme lands
  // (generation, session switch) — but never mid-drag.
  useEffect(() => {
    if (dragging) return
    const parsed = hexToHsv(spec.palette.accent)
    if (parsed) {
      setHue(parsed.h)
      setSat(parsed.s)
      setVal(parsed.v)
    }
  }, [spec.palette.accent, dragging])

  const hex = hsvToHex(hue, sat, val)

  const setFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSat(clamp01((clientX - rect.left) / rect.width))
    setVal(1 - clamp01((clientY - rect.top) / rect.height))
  }, [])

  const commit = useCallback(
    (nextHex: string) => {
      if (disabled) return
      onApplyAccent(nextHex)
    },
    [disabled, onApplyAccent],
  )

  const applySwatch = (swatchHex: string) => {
    const parsed = hexToHsv(swatchHex)
    if (!parsed) return
    setHue(parsed.h)
    setSat(parsed.s)
    setVal(parsed.v)
    commit(swatchHex.toUpperCase())
  }

  const resetToTemplate = () => {
    const base = TEMPLATE_PALETTES[spec.template].accent
    applySwatch(base)
  }

  return (
    <motion.aside
      animate={{ width: open ? 300 : 52 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative z-10 hidden shrink-0 flex-col border-l border-white/10 bg-[oklch(0.14_0_0)] lg:flex"
    >
      {/* Header / collapse */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        <button
          onClick={onToggle}
          aria-label={open ? 'Collapse modifiers' : 'Expand modifiers'}
          className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {open ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
        {open && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-white">
            <Pipette className="h-4 w-4" />
            Layout Modifiers
          </span>
        )}
      </div>

      {/* Collapsed rail */}
      {!open && (
        <div className="flex flex-1 flex-col items-center gap-3 pt-4">
          <button
            onClick={onToggle}
            aria-label="Open theme matrix"
            className="h-7 w-7 rounded-full ring-2 ring-white/15"
            style={{ backgroundColor: spec.palette.accent }}
          />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4"
          >
            {/* 2D color area canvas — saturation (X) × value (Y) */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                2D Color Area Canvas
              </p>
              <div
                ref={areaRef}
                role="slider"
                aria-label="Saturation and brightness"
                aria-valuetext={hex}
                tabIndex={0}
                onPointerDown={(e) => {
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  setDragging(true)
                  setFromPointer(e.clientX, e.clientY)
                }}
                onPointerMove={(e) => {
                  if (dragging) setFromPointer(e.clientX, e.clientY)
                }}
                onPointerUp={() => {
                  setDragging(false)
                  commit(hsvToHex(hue, sat, val))
                }}
                className="relative h-40 w-full cursor-crosshair rounded-lg"
                style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
              >
                {/* white → transparent (saturation) */}
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-[linear-gradient(to_right,#fff,transparent)]" />
                {/* transparent → black (value) */}
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-[linear-gradient(to_top,#000,transparent)]" />
                {/* cursor selector */}
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                  style={{
                    left: `${sat * 100}%`,
                    top: `${(1 - val) * 100}%`,
                    backgroundColor: hex,
                  }}
                />
              </div>

              {/* Hue rail */}
              <input
                type="range"
                min={0}
                max={359}
                value={Math.round(hue)}
                onChange={(e) => setHue(Number(e.target.value))}
                onPointerUp={() => commit(hsvToHex(hue, sat, val))}
                aria-label="Hue"
                className="hue-rail h-3 w-full cursor-pointer appearance-none rounded-full"
              />

              {/* Live hex readout + apply */}
              <div className="flex items-center gap-2">
                <span
                  className="h-8 w-8 shrink-0 rounded-md ring-1 ring-white/15"
                  style={{ backgroundColor: hex }}
                />
                <code className="flex-1 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-white">
                  {hex}
                </code>
                <button
                  onClick={() => commit(hex)}
                  disabled={disabled}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: hex, color: readableText(hex) }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </button>
              </div>
            </section>

            {/* Preset palette matrix grid */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                Palette Matrix
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_SWATCHES.map((sw) => {
                  const active =
                    sw.hex.toUpperCase() === spec.palette.accent.toUpperCase()
                  return (
                    <button
                      key={sw.hex}
                      onClick={() => applySwatch(sw.hex)}
                      disabled={disabled}
                      title={`${sw.name} · ${sw.hex}`}
                      aria-label={`${sw.name} ${sw.hex}`}
                      className={cn(
                        'aspect-square rounded-md ring-1 ring-white/10 transition-transform hover:scale-110 disabled:opacity-40',
                        active && 'ring-2 ring-white',
                      )}
                      style={{ backgroundColor: sw.hex }}
                    />
                  )
                })}
              </div>
            </section>

            {/* Active token map */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                Active Theme Tokens
              </p>
              <div className="space-y-1">
                {(['bg', 'surface', 'accent', 'text'] as const).map((token) => (
                  <div
                    key={token}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1.5"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded ring-1 ring-white/15"
                      style={{ backgroundColor: spec.palette[token] }}
                    />
                    <span className="text-[11px] font-medium text-white/70">
                      {token}
                    </span>
                    <code className="ml-auto font-mono text-[10px] text-white/40">
                      {spec.palette[token]}
                    </code>
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={resetToTemplate}
              disabled={disabled}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to template palette
            </button>

            <p className="text-[10px] leading-relaxed text-white/40">
              Drag the selector to intercept a live hex, then apply to run a
              3.6s theme-hydration loop across the active simulator frame.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
