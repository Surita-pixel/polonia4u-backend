import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

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

export type EventType = 'lead_created' | 'proposal_approved' | 'contract_signed' | 'payment_completed';

export type EventPayload = {
  type: EventType;
  data: Record<string, any>;
  retryCount?: number;
};

export async function emitEvent(payload: EventPayload) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      type: payload.type,
      payload: payload.data,
      status: 'pending',
      retry_count: payload.retryCount || 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[EVENTS] Error emitting event:', error);
    throw error;
  }

  console.log(`[EVENTS] Event ${payload.type} emitted with ID ${data?.id}`);
  return data;
}

export async function processQueuedEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[EVENTS] Error fetching queued events:', error);
    return;
  }

  for (const event of events || []) {
    try {
      await processEvent(event);
    } catch (err) {
      console.error(`[EVENTS] Error processing event ${event.id}:`, err);
      await retryEvent(event.id);
    }
  }
}

async function processEvent(event: any) {
  // Placeholder for event processing logic
  console.log(`[EVENTS] Processing event ${event.type} with payload:`, event.payload);

  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mark as processed
  await supabase
    .from('events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', event.id);
}

async function retryEvent(eventId: string) {
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !event) return;

  const newRetryCount = (event.retry_count || 0) + 1;
  const maxRetries = 3;

  if (newRetryCount >= maxRetries) {
    await supabase
      .from('events')
      .update({
        status: 'failed',
        error_log: `Max retries (${maxRetries}) exceeded`,
      })
      .eq('id', eventId);
    return;
  }

  await supabase
    .from('events')
    .update({
      retry_count: newRetryCount,
      status: 'queued', // Re-queue for retry
    })
    .eq('id', eventId);

  console.log(`[EVENTS] Event ${eventId} re-queued for retry (${newRetryCount}/${maxRetries})`);
}