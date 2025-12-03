export const ADSENSE_CONFIG = {
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  testMode: process.env.NODE_ENV === 'development',

  // Ad slot IDs - configure after AdSense approval
  slots: {
    blogBanner: process.env.NEXT_PUBLIC_ADSENSE_BLOG_BANNER || '',
    blogSidebar: process.env.NEXT_PUBLIC_ADSENSE_BLOG_SIDEBAR || '',
    homeBanner: process.env.NEXT_PUBLIC_ADSENSE_HOME_BANNER || '',
    vertical: process.env.NEXT_PUBLIC_ADSENSE_VERTICAL || '',
    outstream: process.env.NEXT_PUBLIC_ADSENSE_OUTSTREAM || '',
    multiplex: process.env.NEXT_PUBLIC_ADSENSE_MULTIPLEX || '',
    anchor: process.env.NEXT_PUBLIC_ADSENSE_ANCHOR || '',
  },
};
