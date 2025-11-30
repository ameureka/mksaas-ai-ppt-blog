import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: PageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicyPage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PrivacyPolicyPage(props: PageProps) {
  const { locale } = await props.params;
  // Enable static rendering
  unstable_setRequestLocale(locale);
  
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicyPage' });
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
          {t('title')}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {t('description')}
        </p>
        
        <div className="space-y-8 text-base leading-7 text-foreground">
          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t('sections.collection.title')}
            </h2>
            <p>{t('sections.collection.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t('sections.cookies.title')}
            </h2>
            <p>{t('sections.cookies.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t('sections.thirdParty.title')}
            </h2>
            <p>{t('sections.thirdParty.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              {t('sections.rights.title')}
            </h2>
            <p>{t('sections.rights.content')}</p>
          </section>

          <div className="mt-12 border-t pt-8 text-sm text-muted-foreground">
            {t('lastUpdated', { date: currentDate })}
          </div>
        </div>
      </div>
    </div>
  );
}
