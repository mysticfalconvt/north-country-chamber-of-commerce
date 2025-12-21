import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
  'businesses',
  'events',
  'announcements',
  'signature-events',
]

const globals: GlobalSlug[] = ['header', 'footer']

const categories = [
  { name: 'Retail & Shopping', slug: 'retail-shopping', icon: 'store' },
  { name: 'Food & Beverage', slug: 'food-beverage', icon: 'utensils' },
  { name: 'Accommodations', slug: 'accommodations', icon: 'bed' },
  { name: 'Health & Wellness', slug: 'health-wellness', icon: 'heart-pulse' },
  { name: 'Professional Services', slug: 'professional-services', icon: 'briefcase' },
  { name: 'Home & Garden', slug: 'home-garden', icon: 'home' },
  { name: 'Arts & Entertainment', slug: 'arts-entertainment', icon: 'palette' },
  { name: 'Automotive', slug: 'automotive', icon: 'car' },
  { name: 'Construction & Trades', slug: 'construction-trades', icon: 'hammer' },
  { name: 'Real Estate', slug: 'real-estate', icon: 'building' },
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
  await Promise.all(
    globals.map(async (global) => {
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
      } catch (error) {
        // Globals may not exist yet on first migration, that's ok
        payload.logger.info(`Skipping clear of ${global} (may not exist yet)`)
      }
    }),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

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
          icon: category.icon,
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

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: demoAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: demoAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: demoAuthor }),
  })

  // update each post with related posts
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    context: {
      disableRevalidate: true,
    },
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    context: {
      disableRevalidate: true,
    },
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    context: {
      disableRevalidate: true,
    },
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

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
        featured: true,
        membershipStatus: 'active',
      },
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
        featured: true,
        membershipStatus: 'active',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/nccroasters' },
          { platform: 'instagram', url: 'https://instagram.com/nccroasters' },
        ],
      },
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
        featured: false,
        membershipStatus: 'active',
      },
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
        category: 'networking',
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
        category: 'community',
        featured: true,
        eventStatus: 'published',
      },
    }),
  ])

  payload.logger.info(`— Seeding announcements...`)

  await Promise.all([
    payload.create({
      collection: 'announcements',
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
      collection: 'announcements',
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

  payload.logger.info(`— Seeding signature events...`)

  await Promise.all([
    payload.create({
      collection: 'signature-events',
      data: {
        name: 'Hot Rod ChiliFest',
        slug: 'hot-rod-chilifest',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Annual chili cook-off and car show featuring classic cars, delicious chili, and family fun.',
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
        year: 2025,
        eventStatus: 'upcoming',
        schedule: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '10:00 AM - Gates Open' },
                ],
                version: 1,
              },
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '11:00 AM - Chili Tasting Begins' },
                ],
                version: 1,
              },
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '2:00 PM - Awards Ceremony' },
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
    }),
    payload.create({
      collection: 'signature-events',
      data: {
        name: 'AquaFest',
        slug: 'aquafest',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Celebrate summer on Lake Memphremagog with water activities, live music, food vendors, and fireworks.',
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
        year: 2025,
        eventStatus: 'upcoming',
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

  const [_, contactPage] = await Promise.all([
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
  ])

  payload.logger.info(`— Seeding globals...`)

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
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/vnccoc' }

        ],
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
