import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Necesario para crear usuarios sin que ellos pongan password
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

const router = express.Router();

// 1. LOGIN MANUAL PARA EL PORTAL
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: "Credenciais inválidas." });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "user") {
      return res.status(403).json({ error: "Acesso restrito ao Portal." });
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
  const { email, name, leadId } = req.body;
  
  try {
    const tempPassword = "Password123Test"; 

    // 1. Crear en Supabase Auth (Service Role)
    // Al ejecutarse esto, el TRIGGER saltará e insertará un perfil básico.
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, lead_id: leadId }
    });

    if (authError) throw authError;

    // 2. USAR UPSERT PARA EVITAR EL ERROR DE DUPLICADO
    // Si el trigger ya insertó el perfil, esto lo ACTUALIZA con el lead_id y name.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authUser.user.id, 
        name,
        email,
        role: "user",
        lead_id: leadId // Aquí vinculamos el lead correctamente
      }, { 
        onConflict: 'id' // Si el ID ya existe, sobreescribe los datos
      });

    if (profileError) throw profileError;

    // 3. Actualizar el status del lead a finalizado
    await supabase
      .from("leads")
      .update({ status: 'finalizado' })
      .eq('id', leadId);

    // 4. Loguear inmediatamente para devolver el token de sesión
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (loginError) throw loginError;

    // 5. Devolver datos para el localStorage del Frontend
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
    res.status(500).json({ error: err.message });
  }
});
export default router;