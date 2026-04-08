export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';

export type ContractPayload = {
  leadId: string;
  contractTerms: Record<string, any>;
};

export function createContractDraft(payload: ContractPayload) {
  // Placeholder for contract generation.
  return {
    id: `contract_${Date.now()}`,
    leadId: payload.leadId,
    terms: payload.contractTerms,
    status: 'draft' as ContractStatus,
    created_at: new Date().toISOString(),
  };
}

export function sendContractForSignature(contractId: string) {
  // Placeholder for Clicksign or e-signature webhook integration.
  console.log('[CONTRACT] Sending contract for signature', contractId);
  return {
    contractId,
    status: 'sent' as ContractStatus,
    sent_at: new Date().toISOString(),
  };
}

export function signContract(contractId: string) {
  // Placeholder for contract signing callback.
  return {
    contractId,
    status: 'signed' as ContractStatus,
    signed_at: new Date().toISOString(),
  };
}
