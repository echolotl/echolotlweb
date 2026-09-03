const CharacterCategory = {
    Main: "main",
    Sonas: "sonas",
    Other: "other",
} as const;

export type CharacterCategory = (typeof CharacterCategory)[keyof typeof CharacterCategory];

export type CharacterReference = {
    collection: "characters";
    id: string;
}

export type Art = {
    slug: string;
    created_at: string;
    modified_at: string;
    character?: CharacterReference;
    related_characters?: CharacterReference[];
    title: string;
    description?: string;
    tags?: string[];
    pinned: boolean;
    artist?: string;
    images: GalleryImage[];
    sketch?: boolean;
}

export type Character = {
    slug: string;
    name: string;
    species: string;
    age: number;
    height: string;
    created_at: string;
    modified_at: string;
    pronouns: string;
    friends?: string[];
    likes?: string[];
    dislikes?: string[];
    enemies?: string[];
    category: CharacterCategory;
    short_description?: string;
    theme_color: string;
    theme_color_light?: string;
    color_palette?: string[];
    portrait?: Image;
}

export type GalleryImage = {
    id?: string;
    title?: string;
    image: Image;
    thumbnail: Image;
    variants?: ImageVariant[];
}

export type ImageVariant = {
    image: Image;
    label?: string;
}

export type Image = {
    src: string;
    alt?: string;
}
