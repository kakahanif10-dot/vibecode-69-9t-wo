'use client'

import { motion } from 'framer-motion'
import { Wifi, Signal, BatteryFull } from 'lucide-react'
import { GarmentPreview } from '@/components/workspace/garment-preview'
import type { DesignSpec } from '@/lib/design'

/**
 * Pure frontend Android phone simulator. Everything rendered here runs in the
 * browser — no cloud render service — so the clothing preview updates live as
 * the design spec changes.
 */
export function PhoneSimulator({
  spec,
  building,
}: {
  spec: DesignSpec
  building: boolean
}) {
  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex h-full items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative h-[620px] w-[300px] shrink-0 rounded-[2.75rem] border border-white/15 bg-black p-2.5 shadow-[0_0_0_2px_rgba(255,255,255,0.04),0_40px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-28 h-12 w-[3px] rounded-l bg-white/20" />
        <span className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l bg-white/20" />
        <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-white/20" />

        {/* Screen */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.25rem] bg-[oklch(0.16_0_0)]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-medium text-white/80">
            <span>{now}</span>
            <div className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Camera punch-hole */}
          <span className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          {/* App header */}
          <div className="mt-2 flex items-center justify-between px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-white">
                {spec.appName}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Live preview
              </p>
            </div>
            <span className="h-7 w-7 rounded-full bg-white/10" />
          </div>

          {/* Garment stage */}
          <div className="relative flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_50%_35%,oklch(0.24_0_0),oklch(0.12_0_0))] px-6">
            {building && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm"
              >
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-xs text-white/70">Rendering design…</p>
              </motion.div>
            )}
            <GarmentPreview spec={spec} />
          </div>

          {/* Product footer */}
          <div className="space-y-3 border-t border-white/10 bg-black/40 px-5 py-4">
            <p className="line-clamp-2 text-xs leading-relaxed text-white/60">
              {spec.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: spec.garmentColor }}
                />
                <span className="text-[11px] capitalize text-white/50">
                  {spec.garment === 'tshirt' ? 'T-Shirt' : spec.garment}
                </span>
              </div>
              <button
                className="rounded-full px-4 py-1.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: spec.textColor,
                  color: spec.garmentColor,
                }}
              >
                Add to cart
              </button>
            </div>
          </div>

          {/* Nav pill */}
          <div className="flex justify-center py-2">
            <span className="h-1 w-24 rounded-full bg-white/30" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
