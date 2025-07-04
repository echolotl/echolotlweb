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
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image'],
  app: {
    head: {
      title: 'echolotl',
      htmlAttrs: {
        lang: 'en',
      }
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
})