'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { VibecodeLogo } from '@/components/vibecode-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Product', href: '#features' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-full border border-transparent px-4 py-2.5 transition-all duration-300',
          scrolled &&
            'border-border bg-background/70 backdrop-blur-xl glow-border',
        )}
      >
        <Link href="/" aria-label="Vibecode Inc. home">
          <VibecodeLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            variant="ghost"
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="rounded-full bg-primary font-medium text-primary-foreground hover:opacity-90"
          >
            Get started
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
