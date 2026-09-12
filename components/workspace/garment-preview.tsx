'use client'

import { motion } from 'framer-motion'
import type { DesignSpec } from '@/lib/design'

/**
 * Renders the garment as inline SVG so the "clothing preview" is a real,
 * frontend-only render engine — the color, cut, and printed slogan all update
 * live from the design spec with no external service.
 */
export function GarmentPreview({ spec }: { spec: DesignSpec }) {
  const { garment, garmentColor, textColor, slogan } = spec

  return (
    <motion.svg
      key={garment + garmentColor}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      viewBox="0 0 220 240"
      className="h-full max-h-[300px] w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
      role="img"
      aria-label={`${garment} preview in ${garmentColor} with the slogan ${slogan}`}
    >
      <Body garment={garment} fill={garmentColor} />
      <SloganText text={slogan} color={textColor} garment={garment} />
    </motion.svg>
  )
}

function Body({ garment, fill }: { garment: string; fill: string }) {
  const stroke = 'rgba(255,255,255,0.14)'

  if (garment === 'hoodie') {
    return (
      <g stroke={stroke} strokeWidth={1.5}>
        {/* Sleeves */}
        <path d="M60 55 L15 95 L34 128 L60 108 Z" fill={fill} />
        <path d="M160 55 L205 95 L186 128 L160 108 Z" fill={fill} />
        {/* Body */}
        <path
          d="M70 52 Q110 74 150 52 L168 74 L156 108 L156 220 L64 220 L64 108 L52 74 Z"
          fill={fill}
        />
        {/* Hood */}
        <path d="M78 50 Q110 82 142 50 Q128 30 110 30 Q92 30 78 50 Z" fill={fill} />
        {/* Pocket */}
        <path d="M80 168 L140 168 L134 198 L86 198 Z" fill="rgba(0,0,0,0.15)" />
        {/* Drawstrings */}
        <line x1="102" y1="52" x2="100" y2="86" stroke={stroke} strokeWidth={2} />
        <line x1="118" y1="52" x2="120" y2="86" stroke={stroke} strokeWidth={2} />
      </g>
    )
  }

  if (garment === 'tank') {
    return (
      <g stroke={stroke} strokeWidth={1.5}>
        <path
          d="M84 44 Q110 40 136 44 L150 62 L142 82 L142 220 L78 220 L78 82 L70 62 Z"
          fill={fill}
        />
        {/* Neck scoop */}
        <path d="M92 44 Q110 68 128 44" fill="rgba(0,0,0,0.18)" />
      </g>
    )
  }

  // tshirt (default)
  return (
    <g stroke={stroke} strokeWidth={1.5}>
      {/* Sleeves */}
      <path d="M74 46 L34 74 L52 104 L74 90 Z" fill={fill} />
      <path d="M146 46 L186 74 L168 104 L146 90 Z" fill={fill} />
      {/* Body */}
      <path
        d="M74 46 Q110 66 146 46 L160 70 L150 96 L150 220 L70 220 L70 96 L60 70 Z"
        fill={fill}
      />
      {/* Collar */}
      <path d="M90 46 Q110 62 130 46 Q110 40 90 46 Z" fill="rgba(0,0,0,0.18)" />
    </g>
  )
}

function SloganText({
  text,
  color,
  garment,
}: {
  text: string
  color: string
  garment: string
}) {
  const y = garment === 'hoodie' ? 138 : 132
  // Scale font down as the slogan gets longer so it stays on the chest.
  const size = text.length > 12 ? 12 : text.length > 8 ? 15 : 19

  return (
    <text
      x="110"
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-geist-mono), monospace"
      fontWeight={700}
      fontSize={size}
      letterSpacing={1.5}
      fill={color}
    >
      {text}
    </text>
  )
}
