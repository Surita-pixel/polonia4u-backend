import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No se proporcionó token" });

    const token = authHeader.replace('Bearer ', '');

    // 1. Validar el usuario con Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "Token inválido o expirado" });

    // 2. Verificar rol en la tabla 'profiles'
    const { data: profile, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || profile?.role !== 'admin') {
      return res.status(403).json({ error: "Acceso restringido: Se requiere privilegios de Admin" });
    }

    // Si todo está bien, pasamos a la siguiente función
    next();
  } catch (error) {
    res.status(500).json({ error: "Error interno en el middleware de seguridad" });
  }
};