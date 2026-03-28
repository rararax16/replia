// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/tailwind.css'],

  app: {
    head: {
      title: 'Replia',
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4003353824515477',
          async: true,
          crossorigin: 'anonymous'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&display=swap'
        },
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'shortcut icon', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' }
      ]
    }
  },

  runtimeConfig: {
    appBaseUrl: process.env.APP_BASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
    metaAppId: process.env.META_APP_ID,
    metaAppSecret: process.env.META_APP_SECRET,
    metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
    metaApiVersion: process.env.META_API_VERSION || 'v24.0',
    metaOauthScopes: process.env.META_OAUTH_SCOPES ||
      'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID,
    public: {
      adsenseAdSlot: process.env.ADSENSE_AD_SLOT || ''
    }
  },

  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt'],

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  }
})
