"use client"

import { useLanguage } from "@/lib/i18n/LanguageContext"
import { getSeoMeta, getHreflangLinks, SupportedLocale } from "@/lib/seo"

interface SeoHeadProps {
  title?: string
  description?: string
  path?: string
}

/**
 * SEO Head component for pages
 * Adds meta tags and hreflang links
 * 
 * Usage:
 * <SeoHead title="Escorts" path="/escorts" />
 */
export function SeoHead({ title, description, path = "/" }: SeoHeadProps) {
  const { locale } = useLanguage()
  const seoMeta = getSeoMeta(locale as SupportedLocale, title)
  const hreflangLinks = getHreflangLinks(path)
  
  return (
    <>
      {/* Primary Meta Tags */}
      <title>{seoMeta.title}</title>
      <meta name="title" content={seoMeta.title} />
      <meta name="description" content={description || seoMeta.description} />
      <meta name="keywords" content={seoMeta.keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seoMeta.title} />
      <meta property="og:description" content={description || seoMeta.description} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoMeta.title} />
      <meta name="twitter:description" content={description || seoMeta.description} />
      
      {/* hreflang links */}
      {hreflangLinks.map(({ locale, href }) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={href} />
      ))}
    </>
  )
}

export default SeoHead
