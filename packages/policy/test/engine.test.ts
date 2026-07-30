import { describe, expect, it } from 'vitest';
import { evaluatePermission } from '../src/engine.js';
import { POLICY_V1 } from '../src/catalogue.js';
import type { EvaluationInput } from '../src/types.js';

const NOW = new Date('2026-07-30T12:00:00Z');

function base(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    actor: { id: 'actor_res', type: 'user', authenticated: true, authStrength: 'password' },
    action: 'participant.view-assigned',
    resource: {
      type: 'ParticipantRecord',
      id: 'pt_1',
      state: 'Active',
      ownerParticipantId: 'pt_1',
      organisationId: 'org_1',
      researchProjectId: 'rp_1',
      protectedExistence: false,
    },
    roleAssignments: [
      { role: 'Researcher', state: 'Active', organisationId: 'org_1', researchProjectId: 'rp_1' },
    ],
    relationships: [],
    consents: [{ scope: 'study-participation', decision: 'Granted' }],
    purposeCode: 'research-operations',
    context: { organisationId: 'org_1', researchProjectId: 'rp_1' },
    blocks: [],
    explicitDenies: [],
    now: NOW,
    ...overrides,
  };
}

describe('happy path', () => {
  it('allows an in-scope researcher with consent and purpose', () => {
    const result = evaluatePermission(POLICY_V1, base());
    expect(result.outcome).toBe('Allow');
    expect(result.policyVersion).toBe(POLICY_V1.policyVersion);
    expect(result.trace.length).toBeGreaterThan(3);
  });
});

describe('deny by default', () => {
  it('denies unauthenticated actors', () => {
    const result = evaluatePermission(POLICY_V1, base({ actor: { id: 'x', type: 'user', authenticated: false } }));
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('actor-not-authenticated');
  });

  it('denies actions not in the catalogue', () => {
    const result = evaluatePermission(POLICY_V1, base({ action: 'nonexistent.action' }));
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('unknown-action');
  });
});

describe('mandatory negative: role-only permission bypass (Doc 4 §negative tests)', () => {
  it('role alone is insufficient when consent is missing', () => {
    const result = evaluatePermission(POLICY_V1, base({ consents: [] }));
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('consent-missing');
  });

  it('role alone is insufficient when purpose is missing', () => {
    const input = base();
    delete (input as { purposeCode?: string }).purposeCode;
    const result = evaluatePermission(POLICY_V1, input);
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('purpose-required');
  });

  it('incompatible purpose is denied', () => {
    const result = evaluatePermission(POLICY_V1, base({ purposeCode: 'marketing' }));
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('purpose-not-permitted');
  });
});

describe('mandatory negative: withdrawn / expired consent', () => {
  it('withdrawn consent denies even with a valid role', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({ consents: [{ scope: 'study-participation', decision: 'Withdrawn' }] }),
    );
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('consent-withdrawn');
  });

  it('expired consent yields ReConsentRequired, not silent access', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        consents: [
          { scope: 'study-participation', decision: 'Granted', expiresAt: new Date('2026-01-01T00:00:00Z') },
        ],
      }),
    );
    expect(result.outcome).toBe('ReConsentRequired');
  });

  it('restricted consent produces field restrictions, not full access', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        consents: [
          { scope: 'study-participation', decision: 'Restricted', restrictions: ['exclude:contact-details'] },
        ],
      }),
    );
    expect(result.outcome).toBe('AllowWithFieldRestrictions');
    expect(result.fieldRestrictions).toContain('exclude:contact-details');
  });
});

describe('role scope', () => {
  it('a role scoped to another organisation does not apply (cross-project access)', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        roleAssignments: [
          { role: 'Researcher', state: 'Active', organisationId: 'org_OTHER', researchProjectId: 'rp_OTHER' },
        ],
      }),
    );
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('no-granting-role');
  });

  it('expired role assignments do not grant', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        roleAssignments: [
          {
            role: 'Researcher',
            state: 'Active',
            organisationId: 'org_1',
            researchProjectId: 'rp_1',
            expiresAt: new Date('2026-01-01T00:00:00Z'),
          },
        ],
      }),
    );
    expect(result.outcome).toBe('Deny');
  });

  it('revoked role assignments do not grant', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({ roleAssignments: [{ role: 'Researcher', state: 'Revoked', organisationId: 'org_1' }] }),
    );
    expect(result.outcome).toBe('Deny');
  });
});

describe('mandatory negative: protected existence (ADR-050)', () => {
  it('denial on a protected resource hides existence', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        consents: [],
        resource: { ...base().resource, protectedExistence: true },
      }),
    );
    expect(result.outcome).toBe('DenyAndHideExistence');
  });
});

describe('explicit deny overrides allow (conflict rule 1)', () => {
  it('deny wins even when everything else passes', () => {
    const result = evaluatePermission(POLICY_V1, base({ explicitDenies: ['governance-hold'] }));
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('explicit-deny');
  });
});

describe('owner-permitted actions', () => {
  it('a Participant may act on their own record without staff roles', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        actor: { id: 'pt_1', type: 'user', authenticated: true, authStrength: 'password' },
        action: 'consent.record',
        roleAssignments: [{ role: 'Participant', state: 'Active' }],
        consents: [],
      }),
    );
    expect(result.outcome).toBe('Allow');
  });

  it('consent withdrawal is high-impact: AllowWithConfirmation', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        actor: { id: 'pt_1', type: 'user', authenticated: true },
        action: 'consent.withdraw',
        roleAssignments: [{ role: 'Participant', state: 'Active' }],
        consents: [],
      }),
    );
    expect(result.outcome).toBe('AllowWithConfirmation');
  });

  it('another Participant is NOT the owner and is denied', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        actor: { id: 'pt_2', type: 'user', authenticated: true },
        action: 'consent.record',
        roleAssignments: [{ role: 'Participant', state: 'Active' }],
        consents: [],
      }),
    );
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('not-resource-owner');
  });
});

describe('relationship-gated Supporter access', () => {
  const supporterBase = (): EvaluationInput =>
    base({
      actor: { id: 'actor_sup', type: 'user', authenticated: true },
      action: 'participant.view-shared',
      roleAssignments: [{ role: 'Supporter', state: 'Active' }],
      consents: [{ scope: 'supporter-involvement', decision: 'Granted' }],
    });

  it('active relationship + consent allows', () => {
    const result = evaluatePermission(POLICY_V1, {
      ...supporterBase(),
      relationships: [{ state: 'Active', participantId: 'pt_1', permittedActions: ['participant.view-shared'] }],
    });
    expect(result.outcome).toBe('Allow');
  });

  it('no relationship denies despite role + consent (relationship alone rule, inverted)', () => {
    const result = evaluatePermission(POLICY_V1, supporterBase());
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('relationship-required');
  });

  it('revoked relationship denies promptly', () => {
    const result = evaluatePermission(POLICY_V1, {
      ...supporterBase(),
      relationships: [{ state: 'Revoked', participantId: 'pt_1', permittedActions: ['participant.view-shared'] }],
    });
    expect(result.outcome).toBe('Deny');
  });

  it('pending verification yields RelationshipVerificationRequired', () => {
    const result = evaluatePermission(POLICY_V1, {
      ...supporterBase(),
      relationships: [
        { state: 'PendingVerification', participantId: 'pt_1', permittedActions: ['participant.view-shared'] },
      ],
    });
    expect(result.outcome).toBe('RelationshipVerificationRequired');
  });

  it('relationship consent withdrawn denies (consent and relationship both necessary)', () => {
    const result = evaluatePermission(POLICY_V1, {
      ...supporterBase(),
      relationships: [{ state: 'Active', participantId: 'pt_1', permittedActions: ['participant.view-shared'] }],
      consents: [{ scope: 'supporter-involvement', decision: 'Withdrawn' }],
    });
    expect(result.outcome).toBe('Deny');
  });
});

describe('block fails closed (ATR-016) for interaction actions', () => {
  it('active block denies interaction in either direction', () => {
    const config = {
      ...POLICY_V1,
      actionRequirements: {
        ...POLICY_V1.actionRequirements,
        'message.draft': { interaction: true },
      },
      rolePermissions: { ...POLICY_V1.rolePermissions, Participant: ['message.draft'] },
    };
    for (const [blocker, blocked] of [
      ['pt_1', 'actor_sender'],
      ['actor_sender', 'pt_1'],
    ] as const) {
      const result = evaluatePermission(config, {
        ...base({
          actor: { id: 'actor_sender', type: 'user', authenticated: true },
          action: 'message.draft',
          roleAssignments: [{ role: 'Participant', state: 'Active' }],
          consents: [],
        }),
        blocks: [{ blockerActorId: blocker, blockedActorId: blocked, state: 'Active' }],
      });
      expect(result.outcome).toBe('Deny');
      expect(result.reason).toBe('blocked-interaction');
    }
  });
});

describe('step-up authentication (Doc 14 §12)', () => {
  it('mfa-gated action with password-only session requires step-up', () => {
    const result = evaluatePermission(
      POLICY_V1,
      base({
        actor: { id: 'actor_appr', type: 'user', authenticated: true, authStrength: 'password' },
        action: 'protocol.approve',
        roleAssignments: [{ role: 'ResearchApprover', state: 'Active', organisationId: 'org_1' }],
        consents: [],
      }),
    );
    expect(result.outcome).toBe('StepUpAuthenticationRequired');
  });
});

describe('resource state gate', () => {
  it('deniedable state blocks action when allowedResourceStates set', () => {
    const config = {
      ...POLICY_V1,
      actionRequirements: {
        ...POLICY_V1.actionRequirements,
        'protocol.draft': { allowedResourceStates: ['Draft'] },
      },
    };
    const result = evaluatePermission(config, {
      ...base({
        action: 'protocol.draft',
        roleAssignments: [{ role: 'Researcher', state: 'Active', organisationId: 'org_1' }],
        consents: [],
      }),
      resource: { ...base().resource, type: 'ProtocolVersion', state: 'Approved' },
    });
    expect(result.outcome).toBe('Deny');
    expect(result.reason).toBe('resource-state-blocked');
  });
});

describe('determinism and explainability', () => {
  it('same input produces identical output', () => {
    const a = evaluatePermission(POLICY_V1, base());
    const b = evaluatePermission(POLICY_V1, base());
    expect(a).toEqual(b);
  });

  it('every decision records a trace ending in step 12', () => {
    const result = evaluatePermission(POLICY_V1, base({ consents: [] }));
    expect(result.trace.at(-1)?.step).toBe('12-record-decision');
  });
});
