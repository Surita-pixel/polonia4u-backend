
import { Database } from './src/types/database.types'; // Importa tus tipos de Supabase

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};