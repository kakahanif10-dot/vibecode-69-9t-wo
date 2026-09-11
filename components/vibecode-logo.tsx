import { cn } from '@/lib/utils'

export function VibecodeMark({ className }: { className?: string }) {
  return (
    <img
      src="/vibecode-logo.png"
      alt="Vibecode"
      className={cn('inline-block object-contain', className)}
    />
  )
}

export function VibecodeLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <VibecodeMark className={cn('h-8 w-8', markClassName)} />
      {wordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Vibecode
          <span className="text-muted-foreground"> Inc.</span>
        </span>
      )}
    </span>
  )
}
