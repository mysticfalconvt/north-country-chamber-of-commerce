import React from 'react'
import { Container } from '@/design-system/Container'

export default function NewsPage() {
  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">News & Announcements</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Stay up to date with the latest news, updates, and announcements from the North Country
            Chamber of Commerce.
          </p>
        </div>

        {/* Placeholder for announcements list */}
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">News and announcements coming soon...</p>
        </div>
      </div>
    </Container>
  )
}

export function generateMetadata() {
  return {
    title: 'News & Announcements | North Country Chamber of Commerce',
    description:
      "Read the latest news and announcements from the North Country Chamber of Commerce in Vermont's Northeast Kingdom.",
  }
}
