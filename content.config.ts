import { defineCollection, defineContentConfig, z } from "@nuxt/content";
import { asSitemapCollection } from '@nuxtjs/sitemap/content'

const imageVariant = z.object({
  image_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  label: z.string().optional(),
  alt: z.string().optional(),
});

const galleryImage = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  image_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  alt: z.string().optional(),
  variants: z.array(imageVariant).optional(),
});

export default defineContentConfig({
  collections: {
    characters: defineCollection(asSitemapCollection({
      source: "characters/*.md",
      type: "page",
      schema: z.object({
        slug: z.string(),
        name: z.string(),
        species: z.string(),
        age: z.number(),
        height: z.string(),
        created_date: z.string().date(),
        last_modified: z.string().date(),
        pronouns: z.string(),
            friends: z.array(z.object({
          slug: z.string(),
          name: z.string()
        })).optional(),
        enemies: z.array(z.object({
          slug: z.string(),
          name: z.string()
        })).optional(),
        clan: z.string(),
        short_description: z.string().optional(),
        theme_color: z.string().startsWith("#").length(7),
        image: z.string().optional(),
        image_description: z.string().optional(),
        title_image: z.string().optional(),
        background_texture: z.string().optional(),
        icon_image: z.string().optional(),
        icon_image_hover: z.string().optional(),
        banner_image: z.string().optional(),
      }),
    })),
    blog: defineCollection(asSitemapCollection({
      source: "blog/*.md",
      type: "page",
      schema: z.object({
        slug: z.string(),
        type: z.enum(["blog", "lore", "site_update"]),
        title: z.string(),
        author: z.string(),
        created_date: z.string().date(),
        last_modified: z.string().date().optional(),
        abstract: z.string().optional(),
        thumbnail_image: z.string().optional(),
        thumbnail_image_description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        related_characters: z.array(z.object({
          slug: z.string(),
          name: z.string()
        })).optional(),
        pinned: z.boolean().optional(),
      }),
    })),
    art: defineCollection(asSitemapCollection({
      source: "art/**/*.{json,yml,yaml}",
      type: "data",
      schema: (z.object({
        slug: z.string(),
        created_at: z.string().datetime(),
        modified_at: z.string().datetime(),
        character: z.string().optional(),
        related_characters: z.array(z.string()).optional(),
        title: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean(),
        artist_name: z.string().optional(),
        images: z.array(galleryImage).min(1, 'At least one image required'),
        sketch: z.boolean().optional(),
      })) as any,
    }))
  },
});
