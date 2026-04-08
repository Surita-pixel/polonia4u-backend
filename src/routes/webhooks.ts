import express, { Request, Response } from 'express';
import { handlePaymentWebhook } from '../modules/payment';
import { signContract } from '../modules/contract';

const router = express.Router();

// Placeholder for Stripe webhook
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const event = req.body; // In production, verify signature
    console.log('[WEBHOOK] Stripe event received:', event.type);

    await handlePaymentWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Stripe error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Placeholder for Clicksign webhook
router.post('/clicksign', async (req: Request, res: Response) => {
  try {
    const event = req.body; // In production, verify signature
    console.log('[WEBHOOK] Clicksign event received:', event.event?.name);

    if (event.event?.name === 'auto_close') {
      // Contract signed
      const contractId = event.document?.key;
      if (contractId) {
        await signContract(contractId);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Clicksign error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;