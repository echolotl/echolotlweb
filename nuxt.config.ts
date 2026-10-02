import type { ArtImage } from "./types";
import { resolve } from "node:path";
import { fixdata } from "./scripts/artcli/commands/fix-data";
import { regenpalette } from "./scripts/artcli/commands/regenpalette";
import { regenthumb } from "./scripts/artcli/commands/regenthumb";
import { getAllArts } from "./scripts/artcli/utils/art";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-06-15",
  css: ["~/assets/styles/main.scss"],
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: "monokai",
            light: "catppuccin-latte",
          },
          langs: ["javascript", "html", "css", "bash", "json", "vue"],
        },
      },
    },
  },
  site: { url: "https://echolotl.lol", name: "echolotl" },
  sitemap: {
    xsl: false,
    urls: async () => {
      try {
        const arts = getAllArts();
        const artUrls = [];
        for (const data of arts) {
          try {
            if (data && data.slug) {
              artUrls.push({
                loc: `/art/${data.slug}`,
                priority: data.pinned ? (0.8 as const) : (0.6 as const),
                changefreq: "never" as const,
                lastmod: data.modified_at || new Date().toISOString(),
                images: (() => {
                  const imgs: {
                    loc: string;
                    caption?: string;
                    title?: string;
                  }[] = [];
                  if (Array.isArray((data as any).images)) {
                    for (const img of (data as any).images as ArtImage[]) {
                      if (img?.image_url) {
                        imgs.push({
                          loc: img.image_url,
                          caption: (data as any).description,
                          title: img.title || (data as any).title,
                        });
                      }
                      if (Array.isArray(img?.variants)) {
                        for (const v of img.variants) {
                          if (v?.image_url) {
                            imgs.push({
                              loc: `https://echolotl.lol${v.image_url}`,
                              caption: (data as any).description,
                              title:
                                v.label || img.title || (data as any).title,
                            });
                          }
                        }
                      }
                    }
                  }
                  return imgs;
                })(),
              });
            }
          } catch (e) {
            console.warn(`Could not generate sitemap URL for ${data.slug}:`, e);
          }
        }
        console.log(
          `[sitemap] Added ${artUrls.length} art item(s) to sitemap at ${new Date().toISOString()}`,
        );
        return artUrls;
      } catch (error) {
        console.error("Error generating art URLs for sitemap:", error);
        return [];
      }
    },
    zeroRuntime: true,
  },
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxtjs/mdc",
  ],
  components: {
    global: true,
    dirs: ["~/components", "~/components/content"],
  },
  app: {
    head: {
      title: "echolotl",
      htmlAttrs: {
        lang: "en",
      },
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/images/favicon-light.ico",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
  future: {
    compatibilityVersion: 5,
  },
  runtimeConfig: {
    public: {
      underConstruction: true,
      backendUrl: process.env.BACKEND_URL || "",
      backendEnabled:
        process.env.BACKEND_ENABLED === "true" ||
        (process.env.BACKEND_ENABLED !== "false" &&
          Boolean(process.env.BACKEND_URL)),
    },
  },
  hooks: {
    "build:before": async () => {
      try {
        await fixdata();
        await Promise.all([regenpalette([]), regenthumb([])]);
      } catch (error) {
        console.error("Error during art build hooks:", error);
      }
    },
  },
  alias: {
    "@common": resolve(__dirname, "app/components/common"),
    "@art": resolve(__dirname, "app/components/art"),
    "@characters": resolve(__dirname, "app/components/characters"),
  },
});
