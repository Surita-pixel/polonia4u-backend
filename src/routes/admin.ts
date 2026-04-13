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
function getAdminClient() {
  return supabase;
}
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
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // En Supabase, el cierre de sesión se maneja principalmente en el cliente
    // Pero podemos notificar al servidor para auditoría si fuera necesario.
    const { error } = await supabase.auth.signOut();
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ message: "Sessão encerrada com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro interno ao sair" });
  }
});

// Lógica para el Backend (Express/Node)
router.post("/create-user", async (req: Request, res: Response) => {
  const { email, password, name, whatsapp, leadId, role = "user" } = req.body;

  // Validación básica
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: "E-mail e senha válida (min 8 caracteres) são obrigatórios." });
  }

  try {
    const adminSupabase = getAdminClient(); // Debe usar la Service Role Key

    // 1. Crear usuario en Supabase Auth sin loguearlo
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, whatsapp }
    });

    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData.user) return res.status(500).json({ error: "Erro ao criar registro de autenticação." });

    // 2. Sincronizar con la tabla de Perfiles (Profiles)
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        name: name || '',
        whatsapp: whatsapp || '',
        role: role,
        gdpr_consent: true,
        consent_date: new Date().toISOString(),
        lead_id: leadId || null
      });

    if (profileError) {
      console.error("Profile Error:", profileError);
    }

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso.",
      user: { id: authData.user.id, email }
    });

  } catch (err: any) {
    console.error("Admin Create User Error:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;

