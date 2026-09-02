

export const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'
}

export function validateSupabaseConfig() {
  if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
    throw new Error(
      'Supabase anon key not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables or update config/supabase.ts'
    )
  }
  return SUPABASE_CONFIG
}
