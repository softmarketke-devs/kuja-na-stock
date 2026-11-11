import type { Metadata } from 'next'
import { BRAND_NAME } from './brand'

/**
 * Unique title, description, canonical and share tags for one page, so no page
 * inherits the home page's. Pages that must stay out of search results pass noindex.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string
  description: string
  path: string
  noindex?: boolean
}): Metadata {
  const fullTitle = `${title} | ${BRAND_NAME}`
  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, type: 'website' },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
