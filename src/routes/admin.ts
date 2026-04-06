import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { isAdmin } from "../middleware/auth";

const router = express.Router();

// CONFIGURACIÓN CORREGIDA: persistSession: false es vital en el backend
const supabase = createClient<Database>(
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

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Autenticación del usuario
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const userId = data.user.id;
    console.log("ID de usuario autenticado:", userId);

    // 2. Consulta de perfil con manejo de errores detallado
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    // Depuración en consola
    if (profileError) {
      console.error("Error al consultar tabla profiles:", {
        code: profileError.code,
        message: profileError.message,
        hint: profileError.hint
      });
    }

    console.log("Resultado de la consulta de perfil:", profile);

    // 3. Verificación de rol
    if (!profile || profile.role !== "admin") {
      console.log(`Acceso denegado para el ID: ${userId}. Rol encontrado: ${profile?.role || 'null'}`);
      return res
        .status(403)
        .json({ error: "No tienes permisos de administrador en la tabla de perfiles" });
    }

    // Login exitoso
    res.json({ 
      token: data.session?.access_token, 
      user: data.user 
    });

  } catch (err) {
    console.error("Error inesperado en el servidor:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;