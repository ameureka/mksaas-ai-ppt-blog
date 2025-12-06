import { websiteConfig } from '@/config/website';
import { getMessagesForLocale } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { render } from '@react-email/render';
import type { Locale, Messages } from 'next-intl';
import { ResendProvider } from './provider/resend';
import {
  type EmailTemplate,
  EmailTemplates,
  type MailProvider,
  type SendRawEmailParams,
  type SendTemplateParams,
} from './types';

/**
 * No-op mail provider for local/dev when no provider key is configured.
 * Logs and pretends success so flows (e.g., signup) don't crash during development.
 */
class NoopMailProvider implements MailProvider {
  public getProviderName() {
    return 'noop';
  }

  public async sendTemplate(
    params: SendTemplateParams
  ): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    console.warn(
      '[mail] Noop provider in use; template email not sent',
      params.template
    );
    return { success: true, messageId: 'noop-template' };
  }

  public async sendRawEmail(
    params: SendRawEmailParams
  ): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    console.warn('[mail] Noop provider in use; raw email not sent', {
      to: params.to,
      subject: params.subject,
    });
    return { success: true, messageId: 'noop-raw' };
  }
}

/**
 * Global mail provider instance
 */
let mailProvider: MailProvider | null = null;

/**
 * Get the mail provider
 * @returns current mail provider instance
 * @throws Error if provider is not initialized
 */
export const getMailProvider = (): MailProvider => {
  if (!mailProvider) {
    return initializeMailProvider();
  }
  return mailProvider;
};

/**
 * Initialize the mail provider
 * @returns initialized mail provider
 */
export const initializeMailProvider = (): MailProvider => {
  if (mailProvider) return mailProvider;

  const isDev =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true';

  // 在本地/演示环境直接使用 Noop，避免网络/域名配置问题导致 500
  if (isDev) {
    console.warn('[mail] Using NoopMailProvider in dev/demo environment.');
    mailProvider = new NoopMailProvider();
    return mailProvider;
  }

  if (websiteConfig.mail.provider === 'resend') {
    if (!process.env.RESEND_API_KEY || !websiteConfig.mail.fromEmail) {
      console.warn(
        '[mail] RESEND_API_KEY or fromEmail not set; using NoopMailProvider (emails will not be sent).'
      );
      mailProvider = new NoopMailProvider();
    } else {
      mailProvider = new ResendProvider();
    }
  } else {
    throw new Error(`Unsupported mail provider: ${websiteConfig.mail.provider}`);
  }

  return mailProvider;
};

/**
 * Send email using the configured mail provider
 *
 * @param params Email parameters
 * @returns Success status
 */
export async function sendEmail(
  params: SendTemplateParams | SendRawEmailParams
) {
  const provider = getMailProvider();

  if ('template' in params) {
    // This is a template email
    const result = await provider.sendTemplate(params);
    return result.success;
  }
  // This is a raw email
  const result = await provider.sendRawEmail(params);
  return result.success;
}

/**
 * Get rendered email for given template, context, and locale
 */
export async function getTemplate<T extends EmailTemplate>({
  template,
  context,
  locale = routing.defaultLocale,
}: {
  template: T;
  context: Record<string, any>;
  locale?: Locale;
}) {
  const mainTemplate = EmailTemplates[template];
  const messages = await getMessagesForLocale(locale);

  const email = mainTemplate({
    ...(context as any),
    locale,
    messages,
  });

  // Get the subject from the messages
  const subject =
    'subject' in messages.Mail[template as keyof Messages['Mail']]
      ? messages.Mail[template].subject
      : '';

  const html = await render(email);
  const text = await render(email, { plainText: true });

  return { html, text, subject };
}
