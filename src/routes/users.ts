import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

/**
 * CLIENTE ESTÁNDAR (Público)
 * Se usa para acciones que el usuario haría por sí mismo (como Login).
 * Respeta las políticas RLS.
 */
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // Usamos la anon key para el cliente normal
);

/**
 * CLIENTE ADMIN (Service Role)
 * Se usa para acciones del sistema (Registro, actualización de estados).
 * Se salta (Bypass) el RLS.
 */
const getAdminClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Llave maestra
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
};

const router = express.Router();

// 1. LOGIN MANUAL
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: "Credenciais inválidas." });

    // Consultamos el perfil con el cliente normal (el usuario ya está autenticado en este punto)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "user") {
      return res.status(403).json({ error: "Acesso restrito." });
    }

    res.json({ 
      token: data.session?.access_token, 
      user: { id: data.user.id, email: data.user.email, name: profile.name } 
    });
  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// 2. REGISTRO AUTOMÁTICO POST-PAGO
router.post("/register-after-payment", async (req: Request, res: Response) => {
  const adminSupabase = getAdminClient();
  const { email, name, leadId } = req.body;
  
  try {
    const tempPassword = "Password123Test"; 

    // 1. Crear usuario en Auth usando SERVICE ROLE
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, lead_id: leadId }
    });

    if (authError) throw authError;

    // 2. UPSERT en Profiles usando ADMIN (Bypass RLS)
    // Importante: El trigger de DB probablemente ya insertó una fila básica. 
    // Este upsert rellena el lead_id y asegura que el perfil esté completo.
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: authUser.user.id, 
        name,
        email,
        role: "user",
        lead_id: leadId
      }, { 
        onConflict: 'id' 
      });

    if (profileError) throw profileError;

    // 3. Actualizar el status del lead usando ADMIN
    const { error: leadError } = await adminSupabase
      .from("leads")
      .update({ status: 'finalizado' })
      .eq('id', leadId);

    if (leadError) console.error("Aviso: No se pudo actualizar el status del lead:", leadError.message);

    // 4. Loguear con el cliente NORMAL para obtener el token de acceso del usuario
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (loginError) throw loginError;

    res.json({
      success: true,
      token: sessionData.session?.access_token,
      user: { 
        id: authUser.user.id, 
        email: authUser.user.email, 
        name,
        role: "user"
      }
    });

  } catch (err: any) {
    console.error("Error en flujo de registro:", err);
    res.status(500).json({ error: err.message || "Erro no servidor" });
  }
});

export default router;