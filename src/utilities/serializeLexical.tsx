import React, { Fragment } from 'react'

type Node = {
  type: string
  children?: Node[]
  text?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  tag?: string
  listType?: string
  url?: string
  newTab?: boolean
  [key: string]: unknown
}

interface LexicalContent {
  root?: {
    children?: Node[]
  }
  children?: Node[]
}

export function serializeLexical(content: LexicalContent | null | undefined): React.ReactNode {
  if (!content || typeof content !== 'object') {
    return null
  }

  const root = content.root || content
  if (!root || !root.children) {
    return null
  }

  return <>{root.children.map((node: Node, i: number) => serializeNode(node, i))}</>
}

function serializeNode(node: Node, key: number): React.ReactNode {
  if (node.text !== undefined) {
    let text: React.ReactNode = node.text

    if (node.bold) {
      text = <strong key={key}>{text}</strong>
    }
    if (node.italic) {
      text = <em key={key}>{text}</em>
    }
    if (node.underline) {
      text = <u key={key}>{text}</u>
    }
    if (node.strikethrough) {
      text = <s key={key}>{text}</s>
    }
    if (node.code) {
      text = <code key={key}>{text}</code>
    }

    return <Fragment key={key}>{text}</Fragment>
  }

  const children = node.children ? node.children.map((child, i) => serializeNode(child, i)) : null

  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>

    case 'heading':
      const HeadingTag = `h${node.tag}` as keyof React.JSX.IntrinsicElements
      return <HeadingTag key={key}>{children}</HeadingTag>

    case 'list':
      if (node.listType === 'bullet') {
        return <ul key={key}>{children}</ul>
      }
      if (node.listType === 'number') {
        return <ol key={key}>{children}</ol>
      }
      return <ul key={key}>{children}</ul>

    case 'listitem':
      return <li key={key}>{children}</li>

    case 'quote':
      return <blockquote key={key}>{children}</blockquote>

    case 'link':
      return (
        <a
          key={key}
          href={node.url}
          target={node.newTab ? '_blank' : undefined}
          rel={node.newTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )

    case 'linebreak':
      return <br key={key} />

    default:
      return <Fragment key={key}>{children}</Fragment>
  }
}
