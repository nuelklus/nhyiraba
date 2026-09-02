import { createClient } from '@supabase/supabase-js';
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_BUCKET } from './env';

export const BUCKET_NAME = NEXT_PUBLIC_SUPABASE_BUCKET;

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  
  return supabaseClient;
}

export async function uploadImageToSupabase(file: File): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('⚠️ Supabase credentials not configured. Image upload disabled.');
      return null;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 14)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('❌ Failed to upload image to Supabase:', error);
    return null;
  }
}

export async function deleteImageFromSupabase(url: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('⚠️ Supabase credentials not configured. Image delete disabled.');
      return false;
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }

    console.log('✅ Image deleted successfully:', fileName);
    return true;

  } catch (error) {
    console.error('❌ Failed to delete image from Supabase:', error);
    return false;
  }
}
