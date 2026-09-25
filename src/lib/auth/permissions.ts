/**
 * Role → permission matrix and server-side guards.
 * Frontend hiding is cosmetic; every mutation path calls assertCan* below.
 */
import type { DealerPermission, DealerRole, DealershipMember, PlatformRole } from '@/lib/domain/types';

export const ROLE_PERMISSIONS: Record<DealerRole, DealerPermission[]> = {
  dealer_owner: [
    'inventory:read', 'inventory:write', 'inventory:publish', 'inventory:delete',
    'leads:read', 'leads:write', 'analytics:read',
    'dealership:edit', 'team:manage', 'billing:manage',
  ],
  dealer_manager: [
    'inventory:read', 'inventory:write', 'inventory:publish',
    'leads:read', 'leads:write', 'analytics:read', 'dealership:edit',
  ],
  dealer_sales: ['inventory:read', 'inventory:write', 'leads:read', 'leads:write'],
};

export function permissionsFor(member: Pick<DealershipMember, 'role' | 'permissions'>): Set<DealerPermission> {
  return new Set([...(ROLE_PERMISSIONS[member.role] ?? []), ...(member.permissions ?? [])]);
}

export function memberCan(
  member: Pick<DealershipMember, 'role' | 'permissions' | 'status'> | null | undefined,
  permission: DealerPermission,
): boolean {
  if (!member || member.status !== 'active') return false;
  return permissionsFor(member).has(permission);
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(message = 'You do not have permission to do this.') { super(message); }
}

export interface ActorContext {
  uid: string;
  platformRole: PlatformRole;
  /** Loaded server-side from dealership_members — NEVER from a client-supplied dealerId. */
  membership: DealershipMember | null;
}

export const isSuperAdmin = (actor: ActorContext) => actor.platformRole === 'super_admin';

/**
 * The only sanctioned way to authorise a tenant-scoped write.
 * `dealershipId` must come from the persisted resource, not the request body.
 */
export function assertTenantPermission(
  actor: ActorContext,
  dealershipId: string,
  permission: DealerPermission,
): void {
  if (isSuperAdmin(actor)) return;
  if (!actor.membership || actor.membership.dealershipId !== dealershipId) {
    throw new AuthorizationError('This record belongs to another dealership.');
  }
  if (!memberCan(actor.membership, permission)) throw new AuthorizationError();
}

export function assertSuperAdmin(actor: ActorContext): void {
  if (!isSuperAdmin(actor)) throw new AuthorizationError('Super admin only.');
}
