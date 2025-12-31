'use client'

import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { CMSLink } from '@/components/Link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Separator } from '@/components/ui/separator'

import type { Header as HeaderType } from '@/payload-types'

interface MobileNavProps {
  data: HeaderType
}

export function MobileNav({ data }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const navItems = data?.navItems || []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open mobile menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b">
            <SheetTitle>Menu</SheetTitle>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="flex flex-col space-y-1 px-2">
              {navItems.map(({ link }, i) => (
                <div key={i} onClick={() => setOpen(false)}>
                  <CMSLink
                    {...link}
                    appearance="link"
                    className="px-4 py-3 text-base font-medium text-foreground hover:bg-accent/50 transition-colors rounded-md block"
                  />
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Language Switcher & Theme Toggle */}
            <div
              className="px-2 flex items-center justify-between gap-4"
              onClick={() => setOpen(false)}
            >
              <LanguageSwitcher variant="mobile" />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
