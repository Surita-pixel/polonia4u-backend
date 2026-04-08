export type State = 'lead' | 'proposal' | 'contract' | 'payment' | 'portal';

export type Transition = {
  from: State;
  to: State;
  event: string;
  conditions?: (data: any) => boolean;
};

export const stateMachine: Transition[] = [
  { from: 'lead', to: 'proposal', event: 'lead_created' },
  { from: 'proposal', to: 'contract', event: 'proposal_approved' },
  { from: 'contract', to: 'payment', event: 'contract_signed' },
  { from: 'payment', to: 'portal', event: 'payment_completed' },
];

export function getNextStates(currentState: State): State[] {
  return stateMachine
    .filter(transition => transition.from === currentState)
    .map(transition => transition.to);
}

export function canTransition(from: State, to: State, data?: any): boolean {
  const transition = stateMachine.find(t => t.from === from && t.to === to);
  if (!transition) return false;
  if (transition.conditions) return transition.conditions(data);
  return true;
}

export function transitionState(currentState: State, event: string, data?: any): State | null {
  const transition = stateMachine.find(t => t.from === currentState && t.event === event);
  if (!transition || (transition.conditions && !transition.conditions(data))) return null;
  return transition.to;
}