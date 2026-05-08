export interface Character {
  slug: string;
  name: string;
  species: string;
  age: number;
  height: string;
  created_date: string;
  last_modified: string;
  pronouns: string;
  friends?: { slug: string; name: string }[];
  likes?: string[];
  dislikes?: string[];
  enemies?: { slug: string; name: string }[];
  clan: string;
  short_description?: string;
  theme_color: string;
  theme_color_light?: string;
  color_palette?: string[];
  image?: {
    type: "artwork" | "url";
    url?: string;
    slug?: string;
  };
  image_description?: string;
  category?: string;
}

export interface Art {
  slug: string;
  created_at: string;
  modified_at: string;
  character?: string;
  related_characters?: string[];   // The character's slug
  title: string;
  description?: string;
  tags?: string[];
  pinned: boolean;
  artist_name?: string;
  images: ArtImage[]; // At least one per schema
  sketch?: boolean;
}

export interface ArtImageVariant {
  image_url: string;
  thumbnail_url?: string;
  label?: string;
  alt?: string;
}

export interface ArtImage {
  id?: string;
  title?: string;
  image_url: string;
  thumbnail_url?: string;
  alt?: string;
  variants?: ArtImageVariant[];
}
