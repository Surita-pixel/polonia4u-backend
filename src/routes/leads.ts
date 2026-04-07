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
router.put('/:id/schedule', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { schedule_date, schedule_time, reason } = req.body;

  try {
    // 1. Obtenemos el lead actual para preservar triage_answers previos
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('triage_answers')
      .eq('id', Array.isArray(id) ? id[0] : id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Mezclamos datos
    const currentAnswers = (lead.triage_answers as object) || {};
    const updatedAnswers = {
      ...currentAnswers,
      schedule: {
        date: schedule_date,
        time: schedule_time,
        reason: reason,
        updated_at: new Date().toISOString()
      }
    };

    // 3. Guardamos
    const leadId = Array.isArray(id) ? id[0] : id;
    const { data, error } = await supabase
      .from('leads')
      .update({ triage_answers: updatedAnswers })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error al agendar:", err);
    res.status(500).json({ error: err.message || "Error al actualizar agendamiento" });
  }
});
export default router;