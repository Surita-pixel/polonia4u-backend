export type PortalAccess = 'pending' | 'active' | 'suspended';

export function getPortalData(userId: string) {
  // Placeholder for portal data retrieval.
  return {
    userId,
    access: 'pending' as PortalAccess,
    documents: [],
    tasks: [],
    updated_at: new Date().toISOString(),
  };
}

export function updatePortalAccess(userId: string, access: PortalAccess) {
  // Placeholder for portal access control.
  console.log('[PORTAL] Updating access for', userId, 'to', access);
  return {
    userId,
    access,
    updated_at: new Date().toISOString(),
  };
}

export function portalStateSummary(userId: string) {
  return {
    userId,
    stage: 'contract',
    next: ['payment', 'portal'],
    updated_at: new Date().toISOString(),
  };
}
