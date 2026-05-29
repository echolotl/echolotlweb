import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message:
        "Invalid color format. Must be a 7-character hex code (e.g., #RRGGBB).",
});

const image = z.object({
    src: z.string(),
    alt: z.string().optional(),
});

const imageVariant = z.object({
    image: image,
    label: z.string().optional(),
});

const galleryImage = z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    image: image,
    thumbnail: image,
    variants: z.array(imageVariant).optional(),
});

const characters = defineCollection({
    loader: glob({ base: "./src/content/characters", pattern: "**/*.md" }),
    schema: z.object({
        slug: z.string(),
        name: z.string(),
        species: z.string(),
        age: z.number(),
        height: z.string(),
        created_date: z.iso.date(),
        last_modified: z.iso.date(),
        pronouns: z.string(),
        friends: z.array(reference("characters")).optional(),
        likes: z.array(z.string()).optional(),
        dislikes: z.array(z.string()).optional(),
        enemies: z.array(reference("characters")).optional(),
        clan: z.string(),
        category: z.enum(["talrien", "sonas", "other"]),
        short_description: z.string().optional(),
        theme_color: color,
        theme_color_light: color.optional(),
        color_palette: z.array(color).optional(),
        portrait: z
            .object({
                src: z.string(),
                alt: z.string(),
            })
            .optional(),
    }),
});

const art = defineCollection({
    loader: glob({ base: "./src/content/art", pattern: "**/*.yml" }),
    schema: z.object({
        slug: z.string(),
        created_at: z.iso.datetime(),
        modified_at: z.iso.datetime(),
        character: reference("characters").optional(),
        related_characters: z.array(reference("characters")).optional(),
        title: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean(),
        artist_name: z.string().optional(),
        images: z.array(galleryImage).min(1, "At least one image required"),
        sketch: z.boolean().optional(),
    }),
});

export const collections = { characters, art };
