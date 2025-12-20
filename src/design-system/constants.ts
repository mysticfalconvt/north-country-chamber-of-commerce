/**
 * Design System Constants
 * Centralized design tokens for the North Country Chamber of Commerce website
 */

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const CONTAINER_MAX_WIDTH = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
} as const

export const SPACING = {
  section: {
    mobile: 'py-12',
    tablet: 'md:py-16',
    desktop: 'lg:py-24',
  },
  container: {
    mobile: 'px-4',
    tablet: 'md:px-6',
    desktop: 'lg:px-8',
  },
} as const

/**
 * Consistent transition utilities for animations
 */
export const TRANSITIONS = {
  default: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
} as const

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const
