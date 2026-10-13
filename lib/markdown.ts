import 'server-only'
import { cacheLife } from 'next/cache'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

/**
 * Renders the admin-authored project description.
 *
 * Even though the only author is the site owner, the output still goes through
 * DOMPurify with an explicit allow-list before it reaches
 * `dangerouslySetInnerHTML`. The database is the one place an attacker could
 * reach if a session ever leaked, and a stored-XSS there would run on every
 * visitor's browser - so the renderer does not get to trust its input.
 *
 * Allowed: headings, paragraphs, emphasis, lists, links, inline and block
 * code, blockquotes, horizontal rules. Not allowed: raw HTML blocks, images,
 * scripts, iframes, styles, event handlers.
 */

marked.setOptions({ gfm: true, breaks: true })

const ALLOWED_TAGS = [
  'h2',
  'h3',
  'h4',
  'p',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'hr',
  'br',
]

export async function renderMarkdown(source: string): Promise<string> {
  /**
   * Cached, and not only for speed. DOMPurify reads `new Date()` deep inside
   * its jsdom window shim, which `cacheComponents` rejects during prerender
   * as an unstable value. Rendering is a pure function of `source`, so a cache
   * scope is both the sanctioned fix and the correct semantics - the same
   * markdown always produces the same HTML.
   */
  'use cache'
  cacheLife('max')

  if (!source.trim()) return ''

  const html = await marked.parse(source)

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title'],
    // Only safe link schemes; blocks javascript: and data: URLs.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
    ADD_ATTR: ['target', 'rel'],
  })
}

/** Plain-text preview, e.g. for meta descriptions. */
export function stripMarkdown(source: string, maxLength = 160): string {
  const text = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}
