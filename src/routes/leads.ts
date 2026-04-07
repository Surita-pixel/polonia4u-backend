import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '../middleware/auth';
import { Database } from '../types/database.types'; 

const router = express.Router();

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CONFIGURACIÓN DE ESTADOS (Sincronizado con Frontend)
 */
const VALID_STATUSES = ['nuevo', 'contactado', 'en_proceso', 'finalizado'];

/**
 * ENDPOINT PÚBLICO: Captura de Lead
 */
router.post('/', async (req: Request, res: Response) => {
  const { full_name, email, whatsapp, metadata } = req.body;

  if (!full_name || !email || !whatsapp) {
    return res.status(400).json({ error: "Datos de contacto obligatorios" });
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: full_name,
        email: email,
        whatsapp: whatsapp,
        triage_answers: metadata,
        status: 'nuevo', // Estado inicial por defecto
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

// Obtener todos los leads
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

// Obtener un lead específico
router.get('/:id', isAdmin, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(404).json({ error: "Lead no encontrado" });
  }
});

// Actualizar Status (Kanban Drag & Drop)
router.put('/:id', isAdmin, async (req: Request, res: Response) => {
  const { status } = req.body;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // Validación de seguridad para evitar estados no deseados
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` 
    });
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error al actualizar status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Agendar Reunión (Actualiza triage_answers sin borrar lo anterior)
router.put('/:id/schedule', isAdmin, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { schedule_date, schedule_time, reason } = req.body;

  try {
    // 1. Obtener datos actuales
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('triage_answers')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Mezclar el nuevo agendamiento con las respuestas existentes
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

    // 3. Guardar cambios
    const { data, error } = await supabase
      .from('leads')
      .update({ triage_answers: updatedAnswers })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error al agendar:", err);
    res.status(500).json({ error: err.message || "Error al actualizar agendamiento" });
  }
});

// Eliminar Lead
router.delete('/:id', isAdmin, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: "Lead eliminado" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;