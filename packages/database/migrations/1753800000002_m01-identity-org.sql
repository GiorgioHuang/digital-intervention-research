-- Up Migration
-- M01 Identity and Organisation Administration (Doc 8 §2.1, Doc 16 identity_org).

CREATE SCHEMA IF NOT EXISTS identity_org;

CREATE TABLE identity_org.user_accounts (
  id               text PRIMARY KEY,
  display_name     text NOT NULL,
  account_state    text NOT NULL DEFAULT 'Active'
                   CHECK (account_state IN ('Invited', 'Active', 'Restricted', 'Suspended', 'Closed')),
  actor_type       text NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'service-account')),
  record_version   integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity_org.organisations (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  organisation_state text NOT NULL DEFAULT 'Active'
                   CHECK (organisation_state IN ('Active', 'Suspended', 'Archived')),
  record_version   integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity_org.organisation_memberships (
  id               text PRIMARY KEY,
  organisation_id  text NOT NULL REFERENCES identity_org.organisations (id),
  user_account_id  text NOT NULL REFERENCES identity_org.user_accounts (id),
  membership_state text NOT NULL DEFAULT 'Active'
                   CHECK (membership_state IN ('Active', 'Suspended', 'Ended')),
  record_version   integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- One active membership per (organisation, account).
CREATE UNIQUE INDEX organisation_memberships_active_unique
  ON identity_org.organisation_memberships (organisation_id, user_account_id)
  WHERE membership_state = 'Active';

CREATE TABLE identity_org.role_assignments (
  id                   text PRIMARY KEY,
  user_account_id      text NOT NULL REFERENCES identity_org.user_accounts (id),
  role                 text NOT NULL CHECK (role IN (
                         'Participant', 'Supporter', 'InformalCaregiver', 'ProfessionalCaregiver',
                         'ResearchCoordinator', 'Researcher', 'DataAnalyst', 'ResearchApprover',
                         'EvidenceReviewer', 'SafetyReviewer', 'PrivacyReviewer',
                         'OrganisationAdministrator', 'SystemAdministrator')),
  -- Explicit scope (Doc 4: role assignments require explicit scope; NULL = platform-wide,
  -- only meaningful for SystemAdministrator).
  organisation_id      text REFERENCES identity_org.organisations (id),
  research_project_id  text,
  assignment_state     text NOT NULL DEFAULT 'Active'
                       CHECK (assignment_state IN
                         ('Proposed', 'PendingApproval', 'Active', 'Suspended', 'Expired', 'Revoked', 'Rejected')),
  expires_at           timestamptz,
  assigned_by_actor_id text NOT NULL,
  revoked_at           timestamptz,
  revoked_by_actor_id  text,
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- No duplicate active assignment of the same role in the same scope.
CREATE UNIQUE INDEX role_assignments_active_unique
  ON identity_org.role_assignments
     (user_account_id, role, coalesce(organisation_id, ''), coalesce(research_project_id, ''))
  WHERE assignment_state = 'Active';

CREATE INDEX role_assignments_account_idx
  ON identity_org.role_assignments (user_account_id) WHERE assignment_state = 'Active';

-- Down Migration
DROP TABLE identity_org.role_assignments;
DROP TABLE identity_org.organisation_memberships;
DROP TABLE identity_org.organisations;
DROP TABLE identity_org.user_accounts;
DROP SCHEMA identity_org;
