import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kokmmisgrgbgyrnwbjjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva21taXNncmdiZ3lybndiampkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzQ2NjksImV4cCI6MjA5NzcxMDY2OX0.pVhE7eECdAtUug7goabD22LQdGYtxJECwbn4gxz101w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
