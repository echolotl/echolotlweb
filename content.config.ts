import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    characters: defineCollection({
      source: "characters/*.md",
      type: "page",
      schema: z.object({
        id: z.string(),
        name: z.string(),
        species: z.string(),
        age: z.number(),
        height: z.string(),
        created_date: z.string().date(),
        last_modified: z.string().date(),
        pronouns: z.string(),
        friends: z.array(z.string()).optional(),
        enemies: z.array(z.string()).optional(),
        clan: z.string(),
        short_description: z.string().optional(),
        theme_color: z.string().startsWith("#").length(7),
        image: z.string().optional(),
        image_description: z.string().optional(),
        title_image: z.string().optional(),
        background_texture: z.string().optional(),
        icon_image: z.string().optional(),
        banner_image: z.string().optional(),
      }),
    }),
  },
});
