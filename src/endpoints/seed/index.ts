import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'news',
  'forms',
  'form-submissions',
  'search',
  'businesses',
  'events',
]

const globals: GlobalSlug[] = ['header', 'footer']

const categories = [
  { name: 'Retail & Shopping', slug: 'retail-shopping' },
  { name: 'Food & Beverage', slug: 'food-beverage' },
  { name: 'Accommodations', slug: 'accommodations' },
  { name: 'Health & Wellness', slug: 'health-wellness' },
  { name: 'Professional Services', slug: 'professional-services' },
  { name: 'Home & Garden', slug: 'home-garden' },
  { name: 'Arts & Entertainment', slug: 'arts-entertainment' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Construction & Trades', slug: 'construction-trades' },
  { name: 'Real Estate', slug: 'real-estate' },
]

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database (skip globals if they don't exist yet)
  // Only clear header and footer which have navItems
  await Promise.all(
    globals
      .filter((global) => global === 'header' || global === 'footer')
      .map(async (global) => {
        try {
          await payload.updateGlobal({
            slug: global,
            data: {
              navItems: [],
            },
            depth: 0,
            context: {
              disableRevalidate: true,
            },
          })
        } catch (_error) {
          // Globals may not exist yet on first migration, that's ok
          payload.logger.info(`Skipping clear of ${global} (may not exist yet)`)
        }
      }),
  )

  // Delete collections sequentially to avoid deadlocks from foreign key constraints
  // Delete dependent collections first, then the ones they depend on
  // Order: email-campaigns, posts, pages, events, event-applications, businesses, announcements, memberships (depend on media/categories)
  //        then: mailing-list, media, categories, forms, form-submissions, users, search, redirects
  const deletionOrder = [
    'email-campaigns', // references announcements, events
    'posts', // references media
    'pages', // references media, posts
    'events', // references media, businesses
    'event-applications', // references events
    'memberships', // references businesses
    'businesses', // references media, categories
    'announcements', // references media
    'form-submissions', // references forms
    'mailing-list', // no references
    'media', // referenced by others
    'categories', // referenced by others
    'forms', // referenced by form-submissions
    'users', // referenced by posts
    'search',
    'redirects',
  ]

  // Delete in order, filtering to only collections that exist
  for (const collection of deletionOrder) {
    if (collections.includes(collection as CollectionSlug)) {
      try {
        await payload.db.deleteMany({ collection: collection as CollectionSlug, req, where: {} })
      } catch (error) {
        payload.logger.warn(
          `Failed to delete ${collection}, continuing anyway: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  // Delete versions - catch errors in case schema is out of sync
  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map(async (collection) => {
        try {
          await payload.db.deleteVersions({ collection, req, where: {} })
        } catch (error) {
          // If version deletion fails (e.g., schema mismatch), log and continue
          // This can happen if migrations haven't been run yet
          payload.logger.warn(
            `Failed to delete versions for ${collection}, continuing anyway: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      }),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'admin@northcountrychamber.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  payload.logger.info(`— Seeding categories...`)

  const categoryDocs = await Promise.all(
    categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: {
          name: category.name,
          slug: category.slug,
        },
      }),
    ),
  )

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Chamber Admin',
        email: 'admin@northcountrychamber.com',
        password: 'password',
        role: 'admin',
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),
  ])

  payload.logger.info(`— Seeding businesses...`)

  const [_business1, business2, _business3] = await Promise.all([
    payload.create({
      collection: 'businesses',
      data: {
        name: 'Mountain View Inn',
        slug: 'mountain-view-inn',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'A cozy inn nestled in the heart of the North Country, offering comfortable accommodations and breathtaking mountain views.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: [categoryDocs[2].id], // Accommodations
        address: '123 Main Street, Newport, VT 05855',
        phone: '(802) 555-1234',
        email: 'info@mountainviewinn.com',
        website: 'https://mountainviewinn.com',
        memberSince: '2020-01-15',
        membershipTier: 'silver',
        membershipExpires: new Date('2026-01-15').toISOString(),
        featured: true,
        membershipStatus: 'active',
        approvalStatus: 'approved',
        approvedAt: '2020-01-15',
      } as any,
    }),
    payload.create({
      collection: 'businesses',
      data: {
        name: 'North Country Coffee Roasters',
        slug: 'north-country-coffee-roasters',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Locally roasted coffee and fresh pastries. A community gathering place in downtown Newport.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: [categoryDocs[1].id], // Food & Beverage
        address: '45 Main Street, Newport, VT 05855',
        phone: '(802) 555-5678',
        email: 'hello@nccroasters.com',
        website: 'https://nccroasters.com',
        memberSince: '2018-06-01',
        membershipTier: 'gold',
        membershipExpires: new Date('2025-06-01').toISOString(),
        featured: true,
        membershipStatus: 'active',
        approvalStatus: 'approved',
        approvedAt: '2018-06-01',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/nccroasters' },
          { platform: 'instagram', url: 'https://instagram.com/nccroasters' },
        ],
      } as any,
    }),
    payload.create({
      collection: 'businesses',
      data: {
        name: 'Green Mountain Hardware',
        slug: 'green-mountain-hardware',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Your local hardware store serving the community since 1965. Tools, paint, plumbing, and friendly advice.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: [categoryDocs[5].id], // Home & Garden
        address: '78 Coventry Street, Newport, VT 05855',
        phone: '(802) 555-9012',
        email: 'sales@greenmountainhardware.com',
        memberSince: '2015-03-20',
        membershipTier: 'bronze',
        membershipExpires: new Date('2025-03-20').toISOString(),
        featured: false,
        membershipStatus: 'active',
        approvalStatus: 'approved',
        approvedAt: '2015-03-20',
      } as any,
    }),
    payload.create({
      collection: 'businesses',
      data: {
        name: 'Lakeside Cafe',
        slug: 'lakeside-cafe',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'New waterfront cafe offering fresh sandwiches, salads, and locally roasted coffee with stunning lake views.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: [categoryDocs[1].id], // Food & Beverage
        address: '12 Waterfront Drive, Newport, VT 05855',
        phone: '(802) 555-2468',
        email: 'contact@lakesidecafe.com',
        website: 'https://lakesidecafe.com',
        membershipTier: 'bronze',
        membershipStatus: 'pending',
        approvalStatus: 'pending',
        applicationDate: new Date().toISOString(),
      } as any,
    }),
  ])

  payload.logger.info(`— Seeding events...`)

  await Promise.all([
    payload.create({
      collection: 'events',
      data: {
        title: 'Monthly Business Networking Breakfast',
        slug: 'monthly-business-networking-breakfast',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Join fellow chamber members for coffee, networking, and a brief presentation on business topics relevant to our community.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        date: new Date('2025-01-15').toISOString(),
        startTime: '8:00 AM',
        endTime: '9:30 AM',
        location: 'North Country Coffee Roasters',
        business: business2.id,
        featured: true,
        eventStatus: 'published',
      },
    }),
    payload.create({
      collection: 'events',
      data: {
        title: 'Winter Festival',
        slug: 'winter-festival',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Annual winter celebration featuring ice sculptures, sledding, hot chocolate, and local vendors.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        date: new Date('2025-02-08').toISOString(),
        startTime: '10:00 AM',
        endTime: '4:00 PM',
        location: 'Downtown Newport',
        featured: true,
        eventStatus: 'published',
      },
    }),
  ])

  payload.logger.info(`— Seeding news items...`)

  await Promise.all([
    payload.create({
      collection: 'news',
      draft: false,
      data: {
        title: 'Chamber Annual Meeting - Save the Date',
        slug: 'chamber-annual-meeting-save-the-date',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Our annual meeting will be held on March 15th at the Newport Opera House. More details coming soon!',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        publishDate: new Date().toISOString(),
        featured: true,
      },
    }),
    payload.create({
      collection: 'news',
      draft: false,
      data: {
        title: 'New Member Spotlight: Mountain View Inn',
        slug: 'new-member-spotlight-mountain-view-inn',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Please join us in welcoming Mountain View Inn to the North Country Chamber of Commerce!',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        publishDate: new Date().toISOString(),
        featured: false,
      },
    }),
  ])

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage, aboutPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: contactPageData({ contactForm: contactForm }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: {
        title: 'About Us',
        slug: 'about',
        hero: {
          type: 'none',
        },
        layout: [
          {
            blockType: 'content',
            columns: [
              {
                size: 'full',
                richText: {
                  root: {
                    type: 'root',
                    children: [
                      {
                        type: 'heading',
                        tag: 'h1',
                        children: [
                          {
                            type: 'text',
                            text: 'About North Country Chamber of Commerce',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'heading',
                        tag: 'h2',
                        children: [
                          {
                            type: 'text',
                            text: 'Hours of Operation',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: 'Monday - Friday: 9:00 AM - 5:00 PM',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: 'Saturday - Sunday: Closed',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: 'Note: Hours may vary during holidays. Please call ahead.',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'heading',
                        tag: 'h2',
                        children: [
                          {
                            type: 'text',
                            text: 'Our Mission',
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: "The North Country Chamber of Commerce serves Vermont's Northeast Kingdom by supporting local businesses, fostering economic development, and strengthening our community.",
                          },
                        ],
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                },
              },
            ],
          },
        ],
        _status: 'published',
      },
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  // Seed membership tiers first
  await payload.updateGlobal({
    slug: 'membershipTiers',
    data: {
      tiers: [
        {
          name: 'Platinum',
          slug: 'platinum',
          annualPrice: 750,
          sortOrder: 1,
          displayBadge: true,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Our premium tier for established businesses seeking maximum visibility and benefits',
                    },
                  ],
                },
              ],
            },
          },
          features: [
            { feature: 'All benefits included' },
            { feature: 'Priority event registration' },
            { feature: 'Featured business listing with platinum badge' },
            { feature: 'Unlimited event promotions' },
            { feature: 'Premium advertising opportunities' },
            { feature: 'Quarterly spotlight feature' },
          ],
          active: true,
        },
        {
          name: 'Gold',
          slug: 'gold',
          annualPrice: 500,
          sortOrder: 2,
          displayBadge: true,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Enhanced membership for growing businesses looking to expand their reach',
                    },
                  ],
                },
              ],
            },
          },
          features: [
            { feature: 'All standard benefits' },
            { feature: 'Priority event registration' },
            { feature: 'Featured business listing with gold badge' },
            { feature: 'Monthly event promotions' },
            { feature: 'Standard advertising opportunities' },
          ],
          active: true,
        },
        {
          name: 'Silver',
          slug: 'silver',
          annualPrice: 275,
          sortOrder: 3,
          displayBadge: true,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Great value for small businesses committed to community involvement',
                    },
                  ],
                },
              ],
            },
          },
          features: [
            { feature: 'Business directory listing with silver badge' },
            { feature: 'Event registration' },
            { feature: 'Networking opportunities' },
            { feature: 'Quarterly event promotions' },
            { feature: 'Newsletter feature' },
          ],
          active: true,
        },
        {
          name: 'Bronze',
          slug: 'bronze',
          annualPrice: 150,
          sortOrder: 4,
          displayBadge: false,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Essential membership for sole proprietors and small businesses',
                    },
                  ],
                },
              ],
            },
          },
          features: [
            { feature: 'Business directory listing' },
            { feature: 'Event registration' },
            { feature: 'Networking opportunities' },
            { feature: 'Annual event promotion' },
          ],
          active: true,
        },
      ],
    } as any,
  })

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Businesses',
              url: '/businesses',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Events',
              url: '/events',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'News',
              url: '/news',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'About',
              url: '/about',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Businesses',
              url: '/businesses',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Events',
              url: '/events',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'News',
              url: '/news',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'About',
              url: '/about',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
        ],
        contactInfo: {
          address: '150 Main Street, Newport, VT 05855',
          phone: '(802) 334-7782',
          email: 'info@northcountrychamber.com',
        },
        socialLinks: [{ platform: 'facebook', url: 'https://facebook.com/vnccoc' }],
        copyright: '© 2025 North Country Chamber of Commerce. All rights reserved.',
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
