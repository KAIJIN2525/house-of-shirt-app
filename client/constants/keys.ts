// Google Places API
export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() ?? "";
export const hasGooglePlacesConfig = () => Boolean(GOOGLE_PLACES_API_KEY);

// Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
export const hasSupabaseConfig = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Google OAuth (for Supabase Google Auth)
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
