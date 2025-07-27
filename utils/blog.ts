import type { BlogPost } from '~/types';

/**
 * Get all blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return await queryCollection('blog').order('created_date', 'DESC').all();
}

/**
 * Get a set amount of blog posts
 * @param limit - Number of blog posts to retrieve
 * @param page - Page number for pagination (optional)
 */
export async function getBlogPosts(limit: number, page?: number): Promise<BlogPost[]> {
  let query = queryCollection('blog').order('created_date', 'DESC').limit(limit);
  if (page) {
    query = query.skip((page - 1) * limit);
  }
  return await query.all();
}

/**
 * Get pinned blog posts only
 */
export async function getPinnedBlogPosts(): Promise<BlogPost[]> {
  return await queryCollection('blog').where('pinned', '=', true).all();
}

/**
 * Get blog posts by type
 */
export async function getBlogPostsByType(type: 'blog' | 'lore' | 'site_update'): Promise<BlogPost[]> {
  return await queryCollection('blog')
    .where('type', '=', type)
    .order('created_date', 'DESC')
    .all();
}

/**
 * Get blog posts by tag
 */
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  return await queryCollection('blog')
    .where('tags', 'LIKE', `%${tag}%`)
    .order('created_date', 'DESC')
    .all();
}

/**
 * Get blog posts by character
 */
export async function getBlogPostsByCharacter(characterSlug: string): Promise<BlogPost[]> {
  return await queryCollection('blog')
    .where('related_characters', 'LIKE', `%${characterSlug}%`)
    .order('created_date', 'DESC')
    .all();
}

/**
 * Search blog posts by title or content
 */
export async function searchBlogPosts(searchTerm: string): Promise<BlogPost[]> {
  return await queryCollection('blog')
    .orWhere(query =>
      query
        .where('title', 'LIKE', `%${searchTerm}%`)
        .where('abstract', 'LIKE', `%${searchTerm}%`)
    )
    .order('created_date', 'DESC')
    .all();
}
