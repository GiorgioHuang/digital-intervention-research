-- Up Migration
-- M18 part 2: Open Matching, MutualAcceptance, Connection (Doc 8 §2.5,
-- ADR-026..030; DB constraints per Doc 18 §118).

CREATE TABLE community_social.match_preferences (
  id              text PRIMARY KEY,
  participant_id  text NOT NULL,
  preference_state text NOT NULL DEFAULT 'Inactive'
                  CHECK (preference_state IN ('Inactive', 'Active', 'Paused', 'Expired')),
  declared_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  record_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX match_preferences_active_unique
  ON community_social.match_preferences (participant_id) WHERE preference_state = 'Active';

CREATE TABLE community_social.match_candidates (
  id               text PRIMARY KEY,
  participant_a_id text NOT NULL,
  participant_b_id text NOT NULL,
  candidate_version integer NOT NULL DEFAULT 1,
  candidate_state  text NOT NULL DEFAULT 'Available' CHECK (candidate_state IN
                     ('Generated', 'Available', 'Viewed', 'Expired', 'Withdrawn', 'Invalidated', 'Reported', 'Blocked')),
  match_explanation text NOT NULL,
  expires_at       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_a_id <> participant_b_id)
);

-- One current final decision per actor per candidate (exact ownership).
CREATE TABLE community_social.match_decisions (
  id                       text PRIMARY KEY,
  match_candidate_id       text NOT NULL REFERENCES community_social.match_candidates (id),
  candidate_version        integer NOT NULL,
  decided_by_participant_id text NOT NULL,
  decision                 text NOT NULL CHECK (decision IN
                             ('Interested', 'Not Now', 'Dismissed', 'Blocked', 'Reported', 'Expired')),
  decided_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_candidate_id, decided_by_participant_id)
);

CREATE TABLE community_social.mutual_acceptances (
  id                text PRIMARY KEY,
  match_candidate_id text NOT NULL REFERENCES community_social.match_candidates (id),
  participant_a_id  text NOT NULL,
  participant_b_id  text NOT NULL,
  acceptance_state  text NOT NULL DEFAULT 'Active' CHECK (acceptance_state IN
                      ('Recorded', 'Active', 'Consumed', 'Expired', 'Invalidated', 'Superseded', 'Archived')),
  policy_version    text NOT NULL,
  effective_until   timestamptz NOT NULL,
  connection_id     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Single use: consumed iff linked to exactly one Connection (Doc 18 §118).
  CHECK ((acceptance_state = 'Consumed') = (connection_id IS NOT NULL))
);
CREATE UNIQUE INDEX mutual_acceptances_connection_unique
  ON community_social.mutual_acceptances (connection_id) WHERE connection_id IS NOT NULL;

-- Exact source decisions (two compatible MatchDecisions for the first Pilot).
CREATE TABLE community_social.mutual_acceptance_sources (
  mutual_acceptance_id text NOT NULL REFERENCES community_social.mutual_acceptances (id),
  match_decision_id    text NOT NULL REFERENCES community_social.match_decisions (id),
  PRIMARY KEY (mutual_acceptance_id, match_decision_id)
);

CREATE TABLE community_social.connections (
  id                   text PRIMARY KEY,
  mutual_acceptance_id text NOT NULL UNIQUE REFERENCES community_social.mutual_acceptances (id),
  participant_a_id     text NOT NULL,
  participant_b_id     text NOT NULL,
  connection_state     text NOT NULL DEFAULT 'Active' CHECK (connection_state IN
                         ('Active', 'Muted', 'Paused', 'Disconnected', 'Blocked', 'Superseded', 'Archived')),
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE community_social.connections;
DROP TABLE community_social.mutual_acceptance_sources;
DROP TABLE community_social.mutual_acceptances;
DROP TABLE community_social.match_decisions;
DROP TABLE community_social.match_candidates;
DROP TABLE community_social.match_preferences;
