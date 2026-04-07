import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { isAdmin } from "../middleware/auth";
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
const router = express.Router();
router.post("/user/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Autenticación en Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: "Credenciais inválidas ou conta não verificada." });
    }

    const userId = data.user.id;

    // 2. Consulta de perfil para verificar rol 'user'
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name") // Traemos el nombre para personalizar el portal
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.role !== "user") {
      console.log(`Acesso bloqueado: ID ${userId} tentou entrar no portal sem ser 'user'.`);
      return res.status(403).json({ error: "Acesso restrito ao Portal do Cliente." });
    }

    // Login exitoso para cliente
    res.json({ 
      token: data.session?.access_token, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.name
      } 
    });

  } catch (err) {
    console.error("Error en login de usuario:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});