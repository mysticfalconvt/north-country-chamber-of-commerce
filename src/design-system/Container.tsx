import React from 'react'
import { cn } from '@/utilities/ui'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  noPadding?: boolean
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
}

/**
 * Container component for consistent page width and padding
 * Mobile-first with responsive breakpoints
 */
export function Container({ children, className, size = 'xl', noPadding = false }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        !noPadding && 'px-4 md:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
