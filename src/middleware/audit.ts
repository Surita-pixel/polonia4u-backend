import { Request, Response, NextFunction } from 'express';
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

/**
 * Asegúrate de que esta función esté correctamente definida y devuelva el cliente.
 */
const getAdminClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
};

export const auditLog = (action: string, resourceType?: string) => 
  async (req: Request, res: Response, next: NextFunction) => {
    
    const adminId = req.user?.id;
    // Normalizamos el ID para evitar errores de tipo string | string[]
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ip = req.ip || 'unknown';

    // Registro de Auditoría: Exigencia de LGPD/GDPR para datos sensibles
    if (req.user?.role === 'admin' && adminId) {
      try {
        const adminSupabase = getAdminClient(); // Ahora TypeScript sabe que esto devuelve el cliente
        
        await adminSupabase.from("access_logs").insert({
          admin_id: adminId,
          target_user_id: targetUserId || null,
          action: action,
          resource_type: resourceType || 'general',
          ip_address: ip
        });
      } catch (dbError) {
        // No bloqueamos el 'next()' si falla el log, pero lo reportamos
        console.error("Critical: Failed to save audit log to DB", dbError);
      }
    }

    console.log(`[AUDIT] Action: ${action} | Admin: ${adminId || 'System'} | Target: ${targetUserId || 'N/A'}`);
    next();
};