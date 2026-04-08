import express, { Request, Response } from 'express';
import { createContractDraft } from '../modules/contract';
import { emitEvent } from '../modules/events';

const router = express.Router();

// Scaffold: Crear un contrato
router.post('/', async (req: Request, res: Response) => {
  try {
    const { leadId, contractTerms } = req.body;
    const contract = createContractDraft({ leadId, contractTerms });
    await emitEvent({ type: 'contract_created', data: { contractId: contract.id, leadId } });
    res.status(201).json({ success: true, contract });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
