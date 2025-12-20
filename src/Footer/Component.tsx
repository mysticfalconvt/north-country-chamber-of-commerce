import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react'

import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { Container } from '@/design-system/Container'
import { Separator } from '@/components/ui/separator'

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
}

export async function Footer() {
  const footerData: FooterType = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []
  const contactInfo = footerData?.contactInfo
  const socialLinks = footerData?.socialLinks || []
  const copyright = footerData?.copyright

  return (
    <footer className="mt-auto border-t bg-muted/50">
      <Container>
        <div className="py-12 md:py-16">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Logo and tagline */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <Logo className="h-10 w-auto" />
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                Supporting local businesses and fostering economic growth in Vermont&apos;s Northeast
                Kingdom.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
              <nav className="flex flex-col space-y-3">
                {navItems.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  />
                ))}
              </nav>
            </div>

            {/* Contact Info */}
            {contactInfo && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
                <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
                  {contactInfo.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-pre-line">{contactInfo.address}</span>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social, i) => {
                    const Icon = socialIcons[social.platform as keyof typeof socialIcons]
                    if (!Icon) return null

                    return (
                      <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label={`Follow us on ${social.platform}`}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{copyright || '© 2025 North Country Chamber of Commerce. All rights reserved.'}</p>
            <p className="text-xs">
              Built with <span className="text-red-500">♥</span> for Vermont
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
