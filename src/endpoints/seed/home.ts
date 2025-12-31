import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
}

export const home: (args: HomeArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  heroImage,
  metaImage,
}) => {
  return {
    slug: 'home',
    _status: 'published',
    title: 'Home',
    hero: {
      type: 'highImpact',
      richText: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              tag: 'h2',
              type: 'heading',
              format: 'start',
              indent: 0,
              version: 1,
              children: [
                {
                  mode: 'normal',
                  text: "Visiting Vermont's North Country",
                  type: 'text',
                  style: '',
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: null,
            },
            {
              tag: 'h4',
              type: 'heading',
              format: 'start',
              indent: 0,
              version: 1,
              children: [
                {
                  mode: 'normal',
                  text: 'Our Visitor Center in Newport, VT will guide you in the right direction.',
                  type: 'text',
                  style: '',
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: null,
            },
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [],
              direction: null,
              textStyle: '',
              textFormat: 0,
            },
          ],
          direction: 'ltr',
        },
      },
      links: [
        {
          link: {
            type: 'custom',
            newTab: null,
            url: '/contact',
            label: 'Become a Member',
            appearance: 'default',
          },
        },
        {
          link: {
            type: 'custom',
            newTab: null,
            url: '/businesses',
            label: 'Explore Businesses',
            appearance: 'outline',
          },
        },
      ],
      media: heroImage.id,
    },
    layout: [
      {
        blockName: 'Content Block',
        columns: [
          {
            size: 'full',
            richText: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'paragraph',
                    format: 'start',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'Our helpful staff and volunteers provide our visitors with a wealth of information on local attractions, dining and lodging, back roads and byways, current happenings and shopping opportunities.',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 0,
                        version: 1,
                      },
                    ],
                    direction: null,
                    textStyle: '',
                    textFormat: 0,
                  },
                  {
                    type: 'paragraph',
                    format: 'start',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'We also have a variety of maps, travel guides and informational pamphlets available so you can make the most of your time here',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 1,
                        version: 1,
                      },
                      {
                        mode: 'normal',
                        text: '.',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 0,
                        version: 1,
                      },
                    ],
                    direction: null,
                    textStyle: '',
                    textFormat: 0,
                  },
                  {
                    type: 'paragraph',
                    format: 'start',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'We offer free internet access for our visitors and free use of our conference room by appointment.',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 0,
                        version: 1,
                      },
                    ],
                    direction: null,
                    textStyle: '',
                    textFormat: 0,
                  },
                ],
                direction: 'ltr',
              },
            },
            enableLink: null,
            link: {
              type: 'reference',
              newTab: null,
              url: null,
              label: null,
              appearance: 'default',
            },
          },
        ],
        blockType: 'content',
      },
      {
        richText: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                tag: 'h3',
                type: 'heading',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'Ready to Join?',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
              },
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: "Become a member of the North Country Chamber of Commerce and connect with the Northeast Kingdom's vibrant business community.",
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                textFormat: 0,
              },
            ],
            direction: 'ltr',
          },
        },
        blockName: 'CTA',
        links: [
          {
            link: {
              type: 'custom',
              newTab: null,
              url: '/contact',
              label: 'Become a Member',
              appearance: 'default',
            },
          },
        ],
        blockType: 'cta',
      },
    ],
    meta: {
      title: 'North Country Chamber of Commerce',
      image: metaImage.id,
      description:
        "Supporting business growth and community vitality in Vermont's Northeast Kingdom. Join the North Country Chamber of Commerce.",
    },
  }
}
