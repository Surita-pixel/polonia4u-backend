export type ProposalState = 'pending' | 'approved' | 'rejected' | 'sent';

export type ProposalPayload = {
  leadId: string;
  proposalDetails: Record<string, any>;
};

export function createProposal(payload: ProposalPayload) {
  // Placeholder for proposal creation logic.
  return {
    id: `proposal_${Date.now()}`,
    leadId: payload.leadId,
    details: payload.proposalDetails,
    status: 'pending' as ProposalState,
    created_at: new Date().toISOString(),
  };
}

export function updateProposalStatus(proposalId: string, status: ProposalState) {
  // Placeholder for update logic and state machine transition.
  console.log('[PROPOSAL] Updating proposal', proposalId, 'to', status);
  return {
    id: proposalId,
    status,
    updated_at: new Date().toISOString(),
  };
}

export function proposalStateMachine(leadId: string) {
  // State machine skeleton for lead → proposal → contract.
  return {
    leadId,
    current: 'proposal',
    transitions: ['proposal', 'contract', 'payment', 'portal'],
  };
}
