import { describe, expect, it } from 'vitest';
import { assertTenantPermission, AuthorizationError, memberCan } from '../src/lib/auth/permissions';
import type { DealershipMember } from '../src/lib/domain/types';

const member = (over: Partial<DealershipMember> = {}): DealershipMember => ({
  id: 'yard-a_u1', dealershipId: 'yard-a', userId: 'u1', role: 'dealer_sales',
  permissions: [], status: 'active', createdAt: new Date(), updatedAt: new Date(), ...over,
});

describe('role matrix', () => {
  it('gives sales staff inventory and leads but not billing or team management', () => {
    const m = member();
    expect(memberCan(m, 'inventory:write')).toBe(true);
    expect(memberCan(m, 'leads:write')).toBe(true);
    expect(memberCan(m, 'billing:manage')).toBe(false);
    expect(memberCan(m, 'team:manage')).toBe(false);
  });
  it('honours explicit per-user grants on top of the role', () => {
    expect(memberCan(member({ permissions: ['analytics:read'] }), 'analytics:read')).toBe(true);
  });
  it('treats revoked members as having no access', () => {
    expect(memberCan(member({ status: 'revoked', role: 'dealer_owner' }), 'inventory:read')).toBe(false);
  });
});

describe('tenant isolation', () => {
  const actor = { uid: 'u1', platformRole: 'buyer' as const, membership: member({ role: 'dealer_owner' }) };

  it('allows a dealer to act on their own dealership', () => {
    expect(() => assertTenantPermission(actor, 'yard-a', 'inventory:write')).not.toThrow();
  });

  it("blocks Dealer A from touching Dealer B's records", () => {
    expect(() => assertTenantPermission(actor, 'yard-b', 'inventory:write')).toThrow(AuthorizationError);
  });

  it('blocks a signed-in buyer with no membership', () => {
    expect(() => assertTenantPermission({ uid: 'u9', platformRole: 'buyer', membership: null }, 'yard-a', 'leads:read')).toThrow(AuthorizationError);
  });

  it('lets a super admin cross tenants', () => {
    expect(() => assertTenantPermission({ uid: 'admin', platformRole: 'super_admin', membership: null }, 'yard-b', 'inventory:delete')).not.toThrow();
  });
});
