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
  enemies?: { slug: string; name: string }[];
  clan: string;
  short_description?: string;
  theme_color: string;
  image?: string;
  image_description?: string;
  title_image?: string;
  background_texture?: string;
  icon_image?: string;
  icon_image_hover?: string;
  banner_image?: string;
}

export interface BlogPost {
  slug: string;
  type: 'blog' | 'lore' | 'site_update';
  title: string;
  author: string;
  created_date: string;
  last_modified?: string;
  abstract?: string;
  thumbnail_image?: string;
  thumbnail_image_description?: string;
  tags?: string[];
  related_characters?: { slug: string; name: string }[];
  pinned?: boolean;
}

export interface Art {
  id: string;
  created_at: string;
  modified_at: string;
  character?: string;
  related_characters?: string[];
  title: string;
  description?: string;
  tags?: string[];
  pinned: boolean;
  image_url?: string;
  thumbnail_url?: string;
  artist_name?: string;
  sketch?: boolean;
}