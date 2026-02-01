'use client'

import { cn } from '@/utilities/ui'
import { Clock } from 'lucide-react'
import * as React from 'react'

const TimeInput: React.FC<
  {
    ref?: React.Ref<HTMLInputElement>
  } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ className, ref, ...props }) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Merge refs
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const handleIconClick = () => {
    // Try to open the native time picker
    inputRef.current?.showPicker?.()
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input
        className={cn(
          'flex h-10 w-full rounded border border-border bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Hide the native picker indicator
          '[&::-webkit-calendar-picker-indicator]:hidden',
          '[&::-webkit-calendar-picker-indicator]:appearance-none',
          className,
        )}
        ref={inputRef}
        type="time"
        {...props}
      />
      <button
        type="button"
        onClick={handleIconClick}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label="Open time picker"
      >
        <Clock className="h-4 w-4" />
      </button>
    </div>
  )
}

export { TimeInput }
