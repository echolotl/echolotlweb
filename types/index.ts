export interface Character {
  name: string;
  species: string;
  age: number;
  height: string;
  created_date: number;
  last_modified: number;
  pronouns: string;
  friends?: string[];
  enemies?: string[];
  clan: string;
  short_description?: string;
  theme_color: string;
  image?: string;
  image_description?: string;
  title_image?: string;
  background_texture?: string;
  icon_image?: string;
  banner_image?: string;
}

