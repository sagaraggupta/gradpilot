import { createClient } from '@supabase/supabase-js';

// 1. We grab your secret keys from the .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 2. We create a single connection cable that we can use anywhere in the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);