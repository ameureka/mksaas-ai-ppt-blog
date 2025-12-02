'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { useSocialLinks } from '@/config/social-config';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations('Marketing.footer');
  const socialLinks = useSocialLinks();

  return (
    <footer className={cn('border-t bg-background', className)}>
      <Container className="px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section - 2 columns */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Logo />
              <span className="text-xl font-bold">PPTHub</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {t('tagline')}
            </p>
            
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {t('description')}
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-xs mb-4">
              <span className="text-muted-foreground">
                📊 100,000+ {t('stats.templates')}
              </span>
              <span className="text-muted-foreground">
                ⬇️ 500,000+ {t('stats.downloads')}
              </span>
              <span className="text-muted-foreground">
                👥 50,000+ {t('stats.users')}
              </span>
            </div>
            
            {/* Social Icons */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.title}
                    href={link.href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.title}
                    className="border border-border inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span className="sr-only">{link.title}</span>
                    {link.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-sm">{t('categories.title')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <LocaleLink 
                  href="/ppt/category/business" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.business')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/category/education" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.education')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/category/year-end" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.yearEnd')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/category/proposal" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.proposal')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/category/marketing" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.marketing')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/category/report" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('categories.report')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/ppt/categories" 
                  className="text-primary hover:underline font-medium"
                >
                  {t('categories.viewAll')} →
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-sm">{t('resources.title')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <LocaleLink 
                  href="/blog" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('resources.blog')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/blog/category/tutorial" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('resources.tutorial')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/blog/category/tips" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('resources.tips')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/changelog" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('resources.changelog')}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-sm">{t('support.title')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <LocaleLink 
                  href="/contact" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('support.contact')}
                </LocaleLink>
              </li>
              <li>
                <a 
                  href="mailto:support@ppthub.shop"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('support.email')}
                </a>
              </li>
            </ul>
          </div>

          {/* About Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-sm">{t('about.title')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <LocaleLink 
                  href="/about" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('about.aboutUs')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/privacy-policy" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('about.privacy')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink 
                  href="/terms" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('about.terms')}
                </LocaleLink>
              </li>
              <li>
                <a 
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('about.sitemap')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Partners Section */}
        <div className="border-t mt-8 pt-8">
          <h4 className="text-sm font-semibold mb-4 text-muted-foreground">
            {t('partners.title')}
          </h4>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <a 
              href="https://www.microsoft.com/powerpoint" 
              target="_blank" 
              rel="nofollow noopener"
              className="hover:text-primary transition-colors"
            >
              Microsoft PowerPoint
            </a>
            <a 
              href="https://www.canva.com" 
              target="_blank" 
              rel="nofollow noopener"
              className="hover:text-primary transition-colors"
            >
              Canva
            </a>
            <a 
              href="https://www.figma.com" 
              target="_blank" 
              rel="nofollow noopener"
              className="hover:text-primary transition-colors"
            >
              Figma
            </a>
            <a 
              href="https://www.google.com/slides" 
              target="_blank" 
              rel="nofollow noopener"
              className="hover:text-primary transition-colors"
            >
              Google Slides
            </a>
          </div>
        </div>

        {/* Copyright & Keywords */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div>
              {t('copyright')}
            </div>
            
            {/* Keywords Cloud */}
            <div className="flex flex-wrap items-center gap-2">
              <span>{t('keywords.title')}:</span>
              <LocaleLink 
                href="/ppt?q=免费PPT模板" 
                className="hover:text-primary transition-colors"
              >
                {t('keywords.free')}
              </LocaleLink>
              <span>·</span>
              <LocaleLink 
                href="/ppt?q=商务PPT" 
                className="hover:text-primary transition-colors"
              >
                {t('keywords.business')}
              </LocaleLink>
              <span>·</span>
              <LocaleLink 
                href="/ppt?q=教育PPT" 
                className="hover:text-primary transition-colors"
              >
                {t('keywords.education')}
              </LocaleLink>
              <span>·</span>
              <LocaleLink 
                href="/ppt?q=AI生成PPT" 
                className="hover:text-primary transition-colors"
              >
                {t('keywords.ai')}
              </LocaleLink>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
