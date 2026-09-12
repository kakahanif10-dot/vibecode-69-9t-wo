'use client'

import { motion } from 'framer-motion'
import {
  LayoutGrid,
  BarChart3,
  ShoppingBag,
  Rocket,
  Home,
  Search,
  User,
  Bell,
} from 'lucide-react'
import { PALETTES, type DesignSpec } from '@/lib/design'

/**
 * Fully client-side render of the generated product. The layout adapts to
 * spec.appType and the palette adapts to spec.colorScheme, so the device
 * preview reflects whatever Gemini returns — no cloud render service.
 */
export function AppPreview({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]

  if (!spec.hasContent) {
    return <AwaitingState />
  }

  return (
    <motion.div
      key={`${spec.appType}-${spec.colorScheme}-${spec.appName}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex h-full w-full flex-col"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {spec.appType === 'mobile' && <MobileLayout spec={spec} />}
      {spec.appType === 'saas' && <SaasLayout spec={spec} />}
      {spec.appType === 'landing' && <LandingLayout spec={spec} />}
      {spec.appType === 'ecommerce' && <EcommerceLayout spec={spec} />}
    </motion.div>
  )
}

function AwaitingState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-8 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
          <span className="h-5 w-5 rounded-md bg-white/80" />
        </div>
        <p className="text-sm font-semibold tracking-[0.25em] text-white/90">
          VIBECODE INC.
        </p>
      </motion.div>
      <p className="max-w-[15rem] text-xs leading-relaxed text-white/45">
        Awaiting your design blueprint. Type a prompt on the left to witness the
        genesis of your native application.
      </p>
      <span className="mt-1 h-1 w-10 animate-pulse rounded-full bg-white/25" />
    </div>
  )
}

function AppHeader({
  spec,
  icon,
}: {
  spec: DesignSpec
  icon: React.ReactNode
}) {
  const p = PALETTES[spec.colorScheme]
  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderBottom: `1px solid ${p.border}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: p.accent, color: p.accentText }}
        >
          {icon}
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">
          {spec.appName}
        </span>
      </div>
      <Bell className="h-4 w-4" style={{ color: p.muted }} />
    </div>
  )
}

function MobileLayout({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  return (
    <div className="flex h-full flex-col">
      <AppHeader spec={spec} icon={<LayoutGrid className="h-3.5 w-3.5" />} />
      <div className="flex-1 space-y-3 overflow-hidden px-5 py-4">
        <p className="text-lg font-semibold leading-tight text-balance">
          {spec.tagline}
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: p.muted }}>
          {spec.description}
        </p>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {spec.features.map((f, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-3"
              style={{
                backgroundColor: p.surface,
                border: `1px solid ${p.border}`,
              }}
            >
              <span
                className="mb-2 block h-5 w-5 rounded-md"
                style={{ backgroundColor: p.accent, opacity: 0.85 }}
              />
              <span className="text-[11px] font-medium leading-tight">{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 pb-3">
        <CtaButton spec={spec} />
      </div>
      <BottomNav spec={spec} />
    </div>
  )
}

function SaasLayout({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  const bars = [55, 80, 40, 95, 65, 72]
  return (
    <div className="flex h-full flex-col">
      <AppHeader spec={spec} icon={<BarChart3 className="h-3.5 w-3.5" />} />
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
        <p className="text-sm font-semibold">{spec.tagline}</p>
        <div className="grid grid-cols-2 gap-2">
          {spec.features.slice(0, 2).map((f, i) => (
            <div
              key={i}
              className="rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: p.surface,
                border: `1px solid ${p.border}`,
              }}
            >
              <p className="text-[9px] uppercase tracking-wide" style={{ color: p.muted }}>
                {f}
              </p>
              <p className="text-base font-bold" style={{ color: p.accent }}>
                {[248, 92, 1360, 74][i] ?? 128}
                {i === 1 ? '%' : ''}
              </p>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg px-3 pb-3 pt-2.5"
          style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        >
          <p className="mb-2 text-[9px] uppercase tracking-wide" style={{ color: p.muted }}>
            {spec.features[2] ?? 'Activity'}
          </p>
          <div className="flex h-20 items-end justify-between gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, backgroundColor: p.accent, opacity: 0.85 }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <CtaButton spec={spec} />
      </div>
    </div>
  )
}

function LandingLayout({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  return (
    <div className="flex h-full flex-col">
      <AppHeader spec={spec} icon={<Rocket className="h-3.5 w-3.5" />} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span
          className="rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
          style={{ backgroundColor: p.surface, color: p.muted, border: `1px solid ${p.border}` }}
        >
          {spec.appName}
        </span>
        <p className="text-xl font-bold leading-tight text-balance">
          {spec.tagline}
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: p.muted }}>
          {spec.description}
        </p>
        <div className="pt-1">
          <CtaButton spec={spec} />
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {spec.features.map((f, i) => (
            <span
              key={i}
              className="rounded-full px-2.5 py-1 text-[10px]"
              style={{ backgroundColor: p.surface, color: p.text, border: `1px solid ${p.border}` }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EcommerceLayout({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  const prices = ['$24', '$48', '$32', '$60']
  return (
    <div className="flex h-full flex-col">
      <AppHeader spec={spec} icon={<ShoppingBag className="h-3.5 w-3.5" />} />
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
        <p className="text-sm font-semibold">{spec.tagline}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {spec.features.map((f, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
            >
              <div
                className="h-14 w-full"
                style={{
                  background: `linear-gradient(135deg, ${p.accent}, ${p.surface})`,
                  opacity: 0.9,
                }}
              />
              <div className="px-2.5 py-2">
                <p className="truncate text-[11px] font-medium">{f}</p>
                <p className="text-[11px] font-bold" style={{ color: p.accent }}>
                  {prices[i]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <CtaButton spec={spec} />
      </div>
    </div>
  )
}

function CtaButton({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  return (
    <button
      className="w-full rounded-xl py-2.5 text-xs font-semibold"
      style={{ backgroundColor: p.accent, color: p.accentText }}
    >
      {spec.primaryAction}
    </button>
  )
}

function BottomNav({ spec }: { spec: DesignSpec }) {
  const p = PALETTES[spec.colorScheme]
  const icons = [Home, Search, LayoutGrid, User]
  return (
    <div
      className="flex items-center justify-around py-2.5"
      style={{ borderTop: `1px solid ${p.border}` }}
    >
      {icons.map((Icon, i) => (
        <Icon
          key={i}
          className="h-4 w-4"
          style={{ color: i === 0 ? p.accent : p.muted }}
        />
      ))}
    </div>
  )
}
