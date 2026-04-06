import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export const getSupabaseUserClient = (token: string) => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!, // USAR ANON_KEY PARA RESPETAR RLS
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`, // Esto inyecta el user_id en la sesión de Postgres
        },
      },
    }
  );
};