// Liquid-asset bucket selector (§6.2). Switches which accounts feed the runway
// calculation. Same calm segmented-control pattern as the chart mode toggle.

import { motion, useReducedMotion } from 'framer-motion'
import { ASSET_BUCKETS, type AssetBucket } from './assets'

interface AssetSelectorProps {
  value: AssetBucket
  onChange: (b: AssetBucket) => void
  className?: string
}

export function AssetSelector({ value, onChange, className }: AssetSelectorProps) {
  const reduce = useReducedMotion()
  return (
    <div className={className}>
      <div className="inline-flex rounded-[10px] border border-kanal-line bg-kanal-surf p-0.5">
        {ASSET_BUCKETS.map(({ key, label }) => {
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className="relative rounded-[8px] px-3 py-1.5 text-[12px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
            >
              {active && (
                <motion.span
                  layoutId="asset-bucket-indicator"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[8px] border border-kanal-line bg-kanal-surf2"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 320, damping: 30 }
                  }
                />
              )}
              <span
                className={`relative z-10 whitespace-nowrap ${active ? 'text-kanal-fg' : 'text-kanal-fg3'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
