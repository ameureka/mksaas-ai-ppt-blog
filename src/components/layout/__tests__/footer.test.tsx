import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from '../footer';

// Mock dependencies
vi.mock('@/components/layout/container', () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/layout/logo', () => ({
  Logo: () => <div>Logo</div>,
}));

vi.mock('@/config/social-config', () => ({
  useSocialLinks: () => [
    { title: 'Twitter', href: 'https://twitter.com', icon: <span>T</span> },
    { title: 'GitHub', href: 'https://github.com', icon: <span>G</span> },
  ],
}));

vi.mock('@/i18n/navigation', () => ({
  LocaleLink: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      tagline: 'AI-powered PPT templates',
      description: 'Free PPT templates for everyone',
      'stats.templates': 'Templates',
      'stats.downloads': 'Downloads',
      'stats.users': 'Users',
      'categories.title': 'Categories',
      'categories.business': 'Business',
      'categories.education': 'Education',
      'categories.viewAll': 'View All',
      'resources.title': 'Resources',
      'resources.blog': 'Blog',
      'support.title': 'Support',
      'support.contact': 'Contact',
      'about.title': 'About',
      'about.aboutUs': 'About Us',
      'partners.title': 'Partners',
      copyright: '© 2024 PPTHub',
      'keywords.title': 'Keywords',
    };
    return translations[key] || key;
  },
}));

describe('Footer Component', () => {
  it('renders all navigation sections', () => {
    render(<Footer />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders brand section with logo and tagline', () => {
    render(<Footer />);

    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('PPTHub')).toBeInTheDocument();
    expect(screen.getByText('AI-powered PPT templates')).toBeInTheDocument();
  });

  it('renders statistics', () => {
    render(<Footer />);

    expect(screen.getByText(/Templates/)).toBeInTheDocument();
    expect(screen.getByText(/Downloads/)).toBeInTheDocument();
    expect(screen.getByText(/Users/)).toBeInTheDocument();
  });

  it('renders social icons when available', () => {
    render(<Footer />);

    const socialLinks = screen.getAllByRole('link', { name: /Twitter|GitHub/ });
    expect(socialLinks).toHaveLength(2);
  });

  it('applies correct Tailwind responsive classes', () => {
    const { container } = render(<Footer />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-6');
  });

  it('applies mobile-optimized font sizes', () => {
    const { container } = render(<Footer />);

    // 检查是否使用 text-sm (14px) 而非 text-xs (12px)
    const textElements = container.querySelectorAll('.text-sm');
    expect(textElements.length).toBeGreaterThan(0);

    // 确保没有 text-xs
    const smallTextElements = container.querySelectorAll('.text-xs');
    expect(smallTextElements.length).toBe(0);
  });

  it('applies correct spacing for links', () => {
    const { container } = render(<Footer />);

    // 检查链接列表使用 space-y-3 (12px)
    const linkLists = container.querySelectorAll('ul.space-y-3');
    expect(linkLists.length).toBeGreaterThan(0);

    // 确保没有使用旧的 space-y-2
    const oldSpacing = container.querySelectorAll('ul.space-y-2');
    expect(oldSpacing.length).toBe(0);
  });

  it('applies correct touch target size for social icons', () => {
    const { container } = render(<Footer />);

    // 检查社交图标使用 h-11 w-11 (44px)
    const socialIcons = container.querySelectorAll('.h-11.w-11');
    expect(socialIcons.length).toBeGreaterThan(0);
  });

  it('renders copyright section', () => {
    render(<Footer />);

    expect(screen.getByText('© 2024 PPTHub')).toBeInTheDocument();
  });

  it('renders partners section', () => {
    render(<Footer />);

    expect(screen.getByText('Partners')).toBeInTheDocument();
  });
});
