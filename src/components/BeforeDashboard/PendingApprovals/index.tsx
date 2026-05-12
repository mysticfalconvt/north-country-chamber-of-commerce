import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import './index.scss'

const baseClass = 'pending-approvals'

type PendingItem = {
  id: number | string
  title: string
  approveUrl: string
}

type PendingSection = {
  label: string
  items: PendingItem[]
  totalDocs: number
  moreUrl: string
}

const titleOrFallback = (value: unknown, id: number | string): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  return `Untitled (#${id})`
}

export const PendingApprovals: React.FC = async () => {
  const payload = await getPayload({ config })

  const [businesses, events, benefits] = await Promise.all([
    payload.find({
      collection: 'businesses',
      where: { approvalStatus: { equals: 'pending' } },
      limit: 10,
      sort: '-createdAt',
      depth: 0,
    }),
    payload.find({
      collection: 'events',
      where: { eventStatus: { equals: 'pending' } },
      limit: 10,
      sort: '-createdAt',
      depth: 0,
    }),
    payload.find({
      collection: 'benefits',
      where: { benefitStatus: { equals: 'pending' } },
      limit: 10,
      sort: '-createdAt',
      depth: 0,
    }),
  ])

  const sections: PendingSection[] = [
    {
      label: 'Businesses',
      totalDocs: businesses.totalDocs,
      moreUrl: '/admin/collections/businesses?where[approvalStatus][equals]=pending',
      items: businesses.docs.map((doc: any) => ({
        id: doc.id,
        title: titleOrFallback(doc.name, doc.id),
        approveUrl: `/approve/${doc.id}`,
      })),
    },
    {
      label: 'Events',
      totalDocs: events.totalDocs,
      moreUrl: '/admin/collections/events?where[eventStatus][equals]=pending',
      items: events.docs.map((doc: any) => ({
        id: doc.id,
        title: titleOrFallback(doc.title, doc.id),
        approveUrl: `/approve/event/${doc.id}`,
      })),
    },
    {
      label: 'Benefits',
      totalDocs: benefits.totalDocs,
      moreUrl: '/admin/collections/benefits?where[benefitStatus][equals]=pending',
      items: benefits.docs.map((doc: any) => ({
        id: doc.id,
        title: titleOrFallback(doc.title, doc.id),
        approveUrl: `/approve/benefit/${doc.id}`,
      })),
    },
  ]

  const totalPending = sections.reduce((sum, s) => sum + s.totalDocs, 0)

  return (
    <div className={baseClass}>
      <h4 className={`${baseClass}__heading`}>Pending Approvals</h4>
      {totalPending === 0 ? (
        <p className={`${baseClass}__empty`}>All caught up — no pending approvals.</p>
      ) : (
        sections
          .filter((section) => section.totalDocs > 0)
          .map((section) => (
            <section key={section.label} className={`${baseClass}__section`}>
              <h5 className={`${baseClass}__section-heading`}>
                {section.label} ({section.totalDocs})
              </h5>
              <ul className={`${baseClass}__list`}>
                {section.items.map((item) => (
                  <li key={item.id} className={`${baseClass}__item`}>
                    <Link
                      className={`${baseClass}__review`}
                      href={item.approveUrl}
                      prefetch={false}
                    >
                      Review
                    </Link>
                    <span className={`${baseClass}__title`}>{item.title}</span>
                  </li>
                ))}
                {section.totalDocs > section.items.length && (
                  <li className={`${baseClass}__more`}>
                    <Link href={section.moreUrl} prefetch={false}>
                      +{section.totalDocs - section.items.length} more
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          ))
      )}
    </div>
  )
}
