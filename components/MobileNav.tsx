'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import NavItems from '@/components/NavItems'

const MobileNav = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden relative">
      <button
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[min(92vw,24rem)]">
          <div className="rounded-xl border bg-card text-card-foreground shadow-lg max-h-[70vh] overflow-y-auto">
            <NavItems initialStocks={initialStocks} />
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileNav
