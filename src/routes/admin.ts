import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { isAdmin } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = express.Router();

const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_STATUSES = ['nuevo', 'contactado', 'en_proceso', 'finalizado'];

/**
 * HELPER: Normaliza el ID
 * Asegura que sea un string simple, tomando el primer elemento si es un array.
 */
const getSafeId = (id: string | string[]): string => Array.isArray(id) ? id[0] : id;

// 1. OBTENER LEADS
router.get('/', isAdmin, auditLog('LIST_LEADS'), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, whatsapp, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. OBTENER UN LEAD
router.get('/:id', async (req: Request, res: Response) => {
  // Corregimos la asignación forzando el tipo string
  const id = getSafeId(req.params.id);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, status')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Lead no encontrado" });

    if (data.status === 'finalizado') {
      return res.status(400).json({ error: "Este pedido já foi processado." });
    }

    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "Error interno" });
  }
});

// 3. ACTUALIZAR WIZARD
router.put('/:id/wizard', async (req: Request, res: Response) => {
  const id = getSafeId(req.params.id);
  const { identity_data, children_count, relatives, gdpr_consent } = req.body;

  if (!gdpr_consent) {
    return res.status(400).json({ error: "El consentimiento de privacidad es obligatorio." });
  }

  try {
    const { data: lead } = await supabaseAdmin.from('leads').select('triage_answers').eq('id', id).single();
    const currentAnswers = (lead?.triage_answers as Record<string, any>) || {};

    const updatedAnswers = {
      ...currentAnswers,
      wizard_identity: identity_data,
      wizard_family: {
        children_count,
        relatives,
        consent_accepted: true,
        completed_at: new Date().toISOString()
      }
    };

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ triage_answers: updatedAnswers })
      .eq('id', id)
      .select('id, triage_answers')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ELIMINAR LEAD
router.delete('/:id', isAdmin, auditLog('DELETE_LEAD'), async (req: Request, res: Response) => {
  const id = getSafeId(req.params.id);
  try {
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: "Datos eliminados permanentemente." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;