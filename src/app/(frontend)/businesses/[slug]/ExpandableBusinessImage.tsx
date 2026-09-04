'use client'

import { useEffect, useState } from 'react'
import { ExpandIcon, XIcon } from 'lucide-react'

interface ExpandableBusinessImageProps {
  alt: string
  className: string
  src: string
}

export function ExpandableBusinessImage({ alt, className, src }: ExpandableBusinessImageProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  if (!src) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative block w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={`Expand image: ${alt}`}
      >
        <img src={src} alt={alt} className={className} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 group-focus-visible:bg-black/30 group-focus-visible:opacity-100">
          <ExpandIcon className="h-8 w-8 drop-shadow" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsOpen(false)}
            aria-label="Close expanded image"
          >
            <XIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[calc(100vh-2rem)] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
