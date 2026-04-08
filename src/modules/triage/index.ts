import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';
import { emitEvent } from '../events';
import logger from '../../lib/logger';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export type TriagePayload = {
  full_name: string;
  email: string;
  whatsapp: string;
  metadata: Record<string, any>;
  source?: string;
};

export async function createLead(payload: TriagePayload) {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: payload.full_name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      triage_answers: payload.metadata,
      status: 'nuevo',
      source: payload.source || 'triage',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await emitLeadCreatedEvent(data.id);

  return data;
}

export function getTriageQuestionFlow() {
  return [
    {
      id: 'parentesco',
      question: 'Quem é o cidadão polonês na sua família?',
      options: ['Avô/Avó', 'Bisavô/Bisavó'],
    },
    {
      id: 'documentos',
      question: 'Você possui algum documento dessa pessoa?',
      options: ['Sim, tenho documentos', 'Não, preciso de ajuda'],
    },
  ];
}

export async function emitLeadCreatedEvent(leadId: string) {
  // Emit event using the event system
  await emitEvent({
    type: 'lead_created',
    data: { leadId },
  });

  logger.info('Lead created event emitted', { leadId });
  return {
    event: 'lead_created',
    leadId,
    timestamp: new Date().toISOString(),
  };
}
