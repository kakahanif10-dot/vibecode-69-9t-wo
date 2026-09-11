import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { Showcase } from '@/components/landing/showcase'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PricingCta } from '@/components/landing/pricing-cta'
import { SiteFooter } from '@/components/landing/site-footer'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Showcase />
      <Features />
      <HowItWorks />
      <PricingCta />
      <SiteFooter />
    </main>
  )
}
