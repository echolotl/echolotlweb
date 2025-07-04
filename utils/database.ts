import { createClient } from '@supabase/supabase-js';
import type {Art} from '~/types'; 

class Database {
    private supabase;
    
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    getSupabase() {
        return this.supabase;
    }

    getAllArt() {
        return this.supabase
            .from('art')
            .select('*')
            .order('created_at', { ascending: false });
    }

    // Get all character art (character is not null)
    getAllCharacterArt(): Promise<Art[]> {
        return this.supabase
            .from('art')
            .select('*')
            .not('character', 'is', null)
            .order('created_at', { ascending: false }) as unknown as Promise<Art[]>;
    }

    // Get all art for a specific character
    getCharacterArt(characterId: string): Promise<Art[]> {
        return this.supabase
            .from('art')
            .select('*')
            .eq('character', characterId)
            .order('created_at', { ascending: false }) as unknown as Promise<Art[]>;
    }

    // Get pinned art
    getPinnedArt() {
        return this.supabase
            .from('art')
            .select('*')
            .eq('pinned', true)
            .order('created_at', { ascending: false });
    }

    // Get art by tags
    getArtByTags(tags: string[]) {
        return this.supabase
            .from('art')
            .select('*')
            .overlaps('tags', tags)
            .order('created_at', { ascending: false });
    }

    // Get art where character appears (either as main character or related)
    getArtWithCharacter(characterId: string) {
        return this.supabase
            .from('art')
            .select('*')
            .or(`character.eq.${characterId},related_characters.cs.{${characterId}}`)
            .order('created_at', { ascending: false });
    }

    // Create new art entry
    createArt(artData: {
        title: string;
        description?: string;
        character?: string;
        related_characters?: string[];
        tags?: string[];
        pinned?: boolean;
        image_url?: string;
        thumbnail_url?: string;
        artist_name?: string;
        sketch?: boolean;
    }) {
        return this.supabase
            .from('art')
            .insert([artData])
            .select();
    }

    // Update art entry
    updateArt(id: string, updates: {
        title?: string;
        description?: string;
        character?: string;
        related_characters?: string[];
        tags?: string[];
        pinned?: boolean;
        image_url?: string;
        thumbnail_url?: string;
        artist_name?: string;
        art_type?: string;
    }) {
        return this.supabase
            .from('art')
            .update(updates)
            .eq('id', id)
            .select();
    }

    // Toggle pinned status
    togglePinned(id: string) {
        return this.supabase
            .rpc('toggle_pinned', { art_id: id });
    }

    // Search art by title or description
    searchArt(query: string) {
        return this.supabase
            .from('art')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order('created_at', { ascending: false });
    }
}

export default new Database();
