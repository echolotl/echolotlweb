import type { Art, ArtImage } from "./types";
import { readdir, readFile } from "fs/promises";
import { resolve } from "node:path";
import { load } from "js-yaml";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
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
  site: { url: "https://www.echolotl.lol", name: "echolotl" },
  sitemap: {
    urls: async () => {
      const artDir = resolve(__dirname, "content", "art");

      async function getAllArtFiles(dir: string): Promise<string[]> {
        const files = await readdir(dir, { withFileTypes: true });
        let artFiles: string[] = [];
        for (const file of files) {
          const res = resolve(dir, file.name);
          if (file.isDirectory()) {
            artFiles = artFiles.concat(await getAllArtFiles(res));
          } else if (file.name.endsWith(".yml")) {
            artFiles.push(res);
          }
        }
        return artFiles;
      }

      try {
        const artFiles = await getAllArtFiles(artDir);
        const artUrls = [];
        for (const filePath of artFiles) {
          try {
            const fileContent = await readFile(filePath, "utf8");
            const data = load(fileContent) as Art;
            if (data && data.slug) {
              artUrls.push({
                loc: `/art/${data.slug}`,
                priority: data.pinned ? (0.8 as const) : (0.6 as const),
                changefreq: "monthly" as const,
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
                          loc: `https://echolotl.lol${img.image_url}`,
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
            console.warn(`Could not parse YAML for ${filePath}:`, e);
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
  },
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/image",
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
  runtimeConfig: {
    public: {
      underConstruction: true,
    },
  },
});
