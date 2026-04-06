import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '../middleware/auth';
// Importamos el tipo de la base de datos que subiste
import { Database } from '../types/database.types'; 

const router = express.Router();

// Tipamos el cliente de Supabase para que nos avise de errores en los nombres de columnas
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ENDPOINT PÚBLICO: Captura de Lead
 */
router.post('/', async (req: Request, res: Response) => {
  const { full_name, email, whatsapp, metadata } = req.body;

  if (!full_name || !email || !whatsapp) {
    return res.status(400).json({ error: "Datos de contacto obligatorios" });
  }

  try {
    // Al estar tipado, Supabase sabe que 'leads' tiene columnas específicas
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: full_name,           // Mapeo de 'full_name' a 'name' según tu DB
        email: email,
        whatsapp: whatsapp,
        triage_answers: metadata,  // Mapeo de 'metadata' a 'triage_answers'
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error("Error al guardar lead:", err);
    res.status(500).json({ error: err.message || "Error al guardar el lead" });
  }
});

/**
 * ENDPOINTS PROTEGIDOS (Solo Admins)
 */

router.get('/', isAdmin, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(404).json({ error: "Lead no encontrado" });
  }
});

router.delete('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (error) throw error;
    res.json({ success: true, message: "Lead eliminado" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id', isAdmin, async (req: Request, res: Response) => {
  const { status } = req.body;
  const { id } = req.params;
  const leadId = Array.isArray(id) ? id[0] : id;

  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .select();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;