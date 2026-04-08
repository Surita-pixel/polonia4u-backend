import express, { Request, Response } from 'express';
import { createPaymentIntent } from '../modules/payment';
import { emitEvent } from '../modules/events';

const router = express.Router();

// Scaffold: Crear un pago
router.post('/', async (req: Request, res: Response) => {
  try {
    const { leadId, amount, currency, description } = req.body;
    const payment = createPaymentIntent({ leadId, amount, currency, description });
    await emitEvent({ type: 'payment_created', data: { paymentId: payment.id, leadId } });
    res.status(201).json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
