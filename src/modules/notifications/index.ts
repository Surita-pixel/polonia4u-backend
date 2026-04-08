export type NotificationType = 'email' | 'sms' | 'whatsapp' | 'in_app';

export function sendNotification(recipient: string, type: NotificationType, message: string) {
  // Placeholder for notification delivery logic.
  console.log(`[NOTIFICATIONS] Sending ${type} notification to ${recipient}: ${message}`);
  return {
    recipient,
    type,
    message,
    sent_at: new Date().toISOString(),
    status: 'queued',
  };
}

export function queueNotification(payload: { recipient: string; type: NotificationType; message: string }) {
  // Placeholder for a queue/retry system.
  console.log('[NOTIFICATIONS] Queueing notification', payload);
  return {
    ...payload,
    queued_at: new Date().toISOString(),
    retryCount: 0,
  };
}

export function retryNotification(notificationId: string) {
  console.log('[NOTIFICATIONS] Retrying notification', notificationId);
  return {
    notificationId,
    retried_at: new Date().toISOString(),
  };
}
