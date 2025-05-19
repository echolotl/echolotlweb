import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    characters: defineCollection({
      source: "characters/*.json",
      type: "data",
      schema: z.object({
        name: z.string(),
        species: z.string(),
        age: z.number(),
        height: z.string(),
        created_date: z.number(),
        last_modified: z.number(),
        pronouns: z.string(),
        friends: z.array(z.string()).optional(),
        enemies: z.array(z.string()).optional(),
        clan: z.string(),
        short_description: z.string().optional(),
        theme_color: z.string(),
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
