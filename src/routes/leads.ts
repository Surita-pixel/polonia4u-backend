
import express, { Request, Response } from 'express';
import { createLead as triageCreateLead } from '../modules/triage';
import { isAdmin } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const router = express.Router();

// Instancia de Supabase para uso de servicio (Service Role)
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
  const { full_name, email, whatsapp, metadata, source } = req.body;
  if (!full_name || !email || !whatsapp) {
    return res.status(400).json({ error: "Datos de contacto obligatorios" });
  }
  try {
    const data = await triageCreateLead({ full_name, email, whatsapp, metadata, source });
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
router.get('/', async (_req: Request, res: Response) => {
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

router.get('/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('name, email, status') // Solo traemos lo necesario para el Checkout
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    // Opcional: Validar que el lead no haya pagado ya (status !== 'finalizado')
    if (data.status === 'finalizado') {
      return res.status(400).json({ error: "Este pedido já foi processado." });
    }

    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno no servidor" });
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

// Actualizar Agendamiento sin borrar triage previo
router.put('/:id/schedule', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { schedule_date, schedule_time, reason } = req.body;

  try {
    // 1. Obtener datos actuales de triage_answers
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('triage_answers')
      .eq('id', id)
      .single();

    if (fetchError || !lead) throw new Error("Lead não encontrado");

    // 2. Mezclar el nuevo objeto 'schedule' dentro del JSON existente
    const currentAnswers = (lead.triage_answers as Record<string, any>) || {};
    
    const updatedAnswers = {
      ...currentAnswers, // Mantiene lo que ya estaba (respuestas de triage, etc)
      schedule: {
        date: schedule_date,
        time: schedule_time,
        reason: reason,
        updated_at: new Date().toISOString()
      }
    };

    // 3. Actualizar en Supabase
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
    res.status(500).json({ error: err.message || "Erro ao atualizar agendamento" });
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
// Actualizar datos del Wizard (Identidad, Hijos, Familiares) sin borrar lo anterior
router.put('/:id/wizard', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { identity_data, children_count, relatives } = req.body;

  try {
    // 1. Obtener el lead actual para no perder datos previos
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('triage_answers')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Preparar el objeto mezclado
    const currentAnswers = (lead.triage_answers as object) || {};
    
    const updatedAnswers = {
      ...currentAnswers,
      wizard_identity: identity_data, // CPF/RG
      wizard_family: {
        children_count: children_count,
        relatives: relatives, // Array de {name, email, whatsapp}
        completed_at: new Date().toISOString()
      }
    };

    // 3. Guardar en la base de datos
    const { data, error } = await supabase
      .from('leads')
      .update({ triage_answers: updatedAnswers })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error al actualizar wizard:", err);
    res.status(500).json({ error: err.message || "Error al actualizar datos" });
  }
});
export default router;