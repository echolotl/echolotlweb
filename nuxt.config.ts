// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'monokai',
            light: 'catppuccin-latte',
          },
          langs: ['javascript', 'html', 'css', 'bash', 'json', 'vue'],
        }
      }
    }
  },
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxtjs/mdc'],
  components: {
    global: true,
    dirs: [
      '~/components',
      '~/components/content'
    ]
  },
  app: {
    head: {
      title: 'echolotl',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/images/favicon-light.ico'
        }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
})