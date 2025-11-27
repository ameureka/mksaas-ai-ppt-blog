import SearchHomePage from '@/app/[locale]/(marketing)/ppt/page';
import type { Locale } from 'next-intl';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

/**
 * Home page now directly renders the PPT search page
 * PPT is the main landing page of the site
 */
export default function HomePage(props: HomePageProps) {
  // Directly render the PPT search page component
  return <SearchHomePage />;
}
