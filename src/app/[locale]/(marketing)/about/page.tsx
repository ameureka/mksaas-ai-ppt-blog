import { Button } from '@/components/ui/button';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: PageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AboutPage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AboutPage(props: PageProps) {
  const { locale } = await props.params;
  // Enable static rendering
  unstable_setRequestLocale(locale);
  
  const t = await getTranslations({ locale, namespace: 'AboutPage' });

  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
          {t('title')}
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          {t('introduction')}
        </p>
        
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/contact">{t('talkWithMe')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="https://x.com/your_handle" target="_blank" rel="noopener noreferrer">
              {t('followMe')}
            </Link>
          </Button>
        </div>

        <div className="mt-16 rounded-xl border bg-card p-8 text-left shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10" />
            <div>
              <h3 className="font-semibold">{t('authorName')}</h3>
              <p className="text-sm text-muted-foreground">{t('authorBio')}</p>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>
    </div>
  );
}
