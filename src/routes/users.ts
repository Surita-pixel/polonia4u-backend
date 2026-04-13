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
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Validación básica de entrada
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    // 2. Intento de autenticación
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      // Manejo específico de errores de Supabase Auth
      const message = authError.status === 400 ? "Credenciais inválidas." : "Erro na autenticação.";
      return res.status(401).json({ error: message });
    }

    if (!data.user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // 3. Consulta de perfil optimizada
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: "Perfil não configurado." });
    }

    // 4. Verificación de Rol (Seguridad)
    if (profile.role !== "user") {
      return res.status(403).json({ error: "Acesso restrito a usuários." });
    }

    // 5. Respuesta exitosa estructurada
    return res.status(200).json({ 
      success: true,
      token: data.session?.access_token, 
      user: { 
        id: data.user.id, 
        email: data.user.email, 
        name: profile.name,
        role: profile.role
      } 
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// 2. REGISTRO AUTOMÁTICO POST-PAGO
router.post("/register-after-payment", async (req: Request, res: Response) => {
  const adminSupabase = getAdminClient();
  const { email, name, leadId, gdpr_consent } = req.body;
  
  // VALIDACIÓN CRÍTICA GDPR/LGPD
  if (!gdpr_consent) {
    return res.status(400).json({ error: "O consentimento de dados é obrigatório para o registro." });
  }

  try {
    const tempPassword = "Password123Test"; 

    // 1. Crear usuario en Auth
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, gdpr_accepted: true }
    });

    if (authError) throw authError;

    // 2. Upsert en Profiles con sellos de tiempo de consentimiento
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: authUser.user.id, 
        name,
        email,
        role: "user",
        lead_id: leadId,
        gdpr_consent: true,
        consent_date: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    res.json({ success: true, user: authUser.user.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/update-password", async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  
  // Extraemos el token del header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No se proporcionó un token de sesión." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Establecer la sesión en el cliente de Supabase para que actúe como el usuario
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: "", // En este caso solo nos importa el access_token para la acción
    });

    if (sessionError) throw sessionError;

    // 2. Actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente.",
      user: data.user.email
    });

  } catch (err: any) {
    console.error("Error al cambiar contraseña:", err.message);
    res.status(400).json({ error: err.message || "No se pudo actualizar la contraseña" });
  }
});
/**
 * ENDPOINT: Supresión de Datos / Derecho al Olvido
 * Cumple GDPR Art. 17 y LGPD Art. 18
 */
router.post("/me/delete-account", async (req: Request, res: Response) => {
  const adminSupabase = getAdminClient();
  const userId = req.user?.id; // Obtenido del token

  if (!userId) return res.status(401).send();

  try {
    // 1. Anonimizar Perfil (Mantenemos el ID para integridad de FKs, pero borramos datos sensibles)
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        name: "USUARIO_ELIMINADO",
        email: `deleted_${userId}@internal.com`,
        whatsapp: null,
        cpf: null,
        rg: null,
        address: null,
        payment_status: 'archived'
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Borrar Documentos (Los archivos físicos en Storage deben ser borrados también)
    // Aquí llamarías a supabase.storage.emptyBucket o similar.
    await adminSupabase.from("documents").delete().eq("user_id", userId);

    // 3. Eliminar usuario de Auth (Ya no podrá loguearse)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    res.json({ success: true, message: "Dados anonimizados e conta encerrada." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, gdpr_consent, name, leadId, whatsapp } = req.body;

  // 1. VALIDACIÓN DE PRIVACIDAD
  if (!gdpr_consent) {
    return res.status(400).json({ 
      error: "Debe aceptar los términos de privacidad para registrarse." 
    });
  }

  // 2. VALIDACIÓN DE CONTRASEÑA
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasNumber || !hasLetter) {
    return res.status(400).json({ error: "A senha deve conter pelo menos uma letra e um número." });
  }

  try {
    // 3. Crear el usuario en la Auth de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          whatsapp: whatsapp || '',
          gdpr_accepted: true
        }
      }
    });

    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData.user) return res.status(500).json({ error: "Error al crear el usuario." });

    // 4. Sincronizar con la tabla Profiles
    // Usamos UPSERT en lugar de UPDATE por si el trigger auth -> profiles 
    // tarda milisegundos en ejecutarse, así evitamos errores de "registro no encontrado".
    const adminSupabase = getAdminClient();
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: authData.user.id, // Primary Key
        email: email,
        name: name || '',
        whatsapp: whatsapp || '',
        gdpr_consent: true,
        consent_date: new Date().toISOString(),
        role: "user",
        lead_id: leadId || null // <--- VÍNCULO CRÍTICO PARA EL AGENDAMIENTO
      }, { onConflict: 'id' });

    if (profileError) {
      console.error("Profile Sync Error:", profileError);
      // No bloqueamos el registro si falla el perfil, pero avisamos en logs
    }

    // 5. RESPUESTA
    // Incluimos el leadId en la respuesta para que el frontend lo tenga a mano
    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito.",
      user: { 
        id: authData.user.id, 
        email: authData.user.email,
        lead_id: leadId 
      }
    });

  } catch (err: any) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});
router.post("/confirm-payment-update", async (req: Request, res: Response) => {
  const adminSupabase = getAdminClient();
  const { userId, leadId, gdpr_consent } = req.body;
  
  // 1. Validación de consentimiento
  if (!gdpr_consent) {
    return res.status(400).json({ 
      error: "O consentimento de dados é obrigatório para prosseguir." 
    });
  }

  try {
    // 2. Actualizar el perfil del usuario ya existente
    // Usamos update con el ID del usuario logueado
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        lead_id: leadId,
        gdpr_consent: true,
        consent_date: new Date().toISOString(),
        // Opcional: podrías marcar aquí que el contrato fue firmado
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Actualizar el estatus del Lead para que aparezca como finalizado
    const { error: leadError } = await adminSupabase
      .from("leads")
      .update({ 
        status: "finished" 
      })
      .eq("id", leadId);

    if (leadError) throw leadError;

    // 4. Respuesta exitosa
    res.json({ 
      success: true, 
      message: "Perfil e lead atualizados com sucesso." 
    });

  } catch (err: any) {
    console.error("Erro no checkout update:", err.message);
    res.status(500).json({ error: err.message });
  }
});
export default router;