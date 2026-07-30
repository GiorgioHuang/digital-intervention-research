-- Up Migration
-- M18 messaging (canonical Message dual state machines) + M16 provider ops.
-- M16 may reference M18 message IDs but never updates M18 tables (ADR-033).

CREATE TABLE community_social.conversation_threads (
  id               text PRIMARY KEY,
  basis_type       text NOT NULL CHECK (basis_type IN
                     ('ActiveConnection', 'AuthorisedRelationship', 'InterventionSession', 'ModeratedCommunity')),
  basis_reference  text NOT NULL,
  participant_a_id text NOT NULL,
  participant_b_id text NOT NULL,
  thread_state     text NOT NULL DEFAULT 'Active' CHECK (thread_state IN
                     ('Active', 'Paused', 'Closed', 'Blocked', 'Expired', 'Archived')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_a_id <> participant_b_id)
);

CREATE TABLE community_social.messages (
  id                    text PRIMARY KEY,
  thread_id             text NOT NULL REFERENCES community_social.conversation_threads (id),
  sender_participant_id text NOT NULL,
  content_text          text NOT NULL,
  message_version       integer NOT NULL DEFAULT 1,
  lifecycle_state       text NOT NULL DEFAULT 'Draft' CHECK (lifecycle_state IN
                          ('Draft', 'Confirmed for Send', 'Queued', 'Sending', 'Sent', 'Withdrawn', 'Cancelled', 'Expired', 'Archived')),
  delivery_state        text NOT NULL DEFAULT 'Not Submitted' CHECK (delivery_state IN
                          ('Not Submitted', 'Queued', 'Sent to Provider', 'Provider Accepted', 'Delivered',
                           'Delivery Failed', 'Delivery Unknown', 'Cancelled', 'Expired')),
  recipient_set_hash    text,
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Draft implies no delivery activity (Doc 18 §118).
  CHECK (lifecycle_state <> 'Draft' OR delivery_state = 'Not Submitted')
);

CREATE TABLE community_social.message_send_confirmations (
  id                 text PRIMARY KEY,
  message_id         text NOT NULL REFERENCES community_social.messages (id),
  message_version    integer NOT NULL,
  recipient_set_hash text NOT NULL,
  confirmed_by_participant_id text NOT NULL,
  confirmed_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, message_version)
);

CREATE TABLE community_social.message_delivery_attempts (
  id                 text PRIMARY KEY,
  message_id         text NOT NULL REFERENCES community_social.messages (id),
  attempt_seq        integer NOT NULL,
  provider           text NOT NULL,
  provider_reference text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, attempt_seq),
  UNIQUE (provider, provider_reference)
);

CREATE SCHEMA IF NOT EXISTS integration_ops;

CREATE TABLE integration_ops.provider_callback_records (
  id                 text PRIMARY KEY,
  provider           text NOT NULL,
  provider_reference text NOT NULL,
  replay_key         text NOT NULL UNIQUE,
  signature_valid    boolean NOT NULL,
  raw_status         text NOT NULL,
  mapped_state       text,
  outcome            text NOT NULL,
  received_at        timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE integration_ops.provider_callback_records;
DROP SCHEMA integration_ops;
DROP TABLE community_social.message_delivery_attempts;
DROP TABLE community_social.message_send_confirmations;
DROP TABLE community_social.messages;
DROP TABLE community_social.conversation_threads;
