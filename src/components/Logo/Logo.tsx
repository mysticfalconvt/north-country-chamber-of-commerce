import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="North Country Chamber of Commerce"
      width={60}
      height={60}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('w-[60px] h-[60px]', className)}
      src="/north-country-chamber-logo.png"
    />
  )
}
