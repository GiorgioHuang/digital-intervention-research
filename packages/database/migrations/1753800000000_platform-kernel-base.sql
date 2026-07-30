-- Up Migration
-- Transactional outbox / inbox / idempotency base tables (ADR-015, Doc 16 §54).
-- These are cross-cutting reliability tables; module schemas are created by
-- their owning modules in later migrations.

CREATE SCHEMA IF NOT EXISTS platform_kernel;

CREATE TABLE platform_kernel.outbox_messages (
  id                     uuid PRIMARY KEY,
  event_category         text NOT NULL CHECK (event_category IN ('Domain', 'Integration', 'Operational', 'Audit')),
  event_type             text NOT NULL,
  event_schema_version   integer NOT NULL DEFAULT 1 CHECK (event_schema_version >= 1),
  source_module          text NOT NULL CHECK (source_module ~ '^(M0[1-9]|M1[0-8]|kernel)$'),
  aggregate_type         text NOT NULL,
  aggregate_id           text NOT NULL,
  aggregate_version      bigint,
  occurred_at            timestamptz NOT NULL,
  purpose_code           text,
  data_classification    text,
  correlation_id         text,
  causation_id           text,
  trace_id               text,
  -- Minimum-necessary payload: references only. Never Life Story text,
  -- Message body, reporter identity, precise location or safety detail
  -- (Doc 15 §61; enforced additionally at the application layer).
  payload                jsonb NOT NULL DEFAULT '{}'::jsonb,
  publication_state      text NOT NULL DEFAULT 'Pending'
                         CHECK (publication_state IN ('Pending', 'Publishing', 'Published', 'Failed', 'DeadLettered')),
  attempt_count          integer NOT NULL DEFAULT 0,
  next_attempt_at        timestamptz,
  published_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_messages_pending_idx
  ON platform_kernel.outbox_messages (next_attempt_at NULLS FIRST, created_at)
  WHERE publication_state IN ('Pending', 'Failed');

CREATE INDEX outbox_messages_aggregate_idx
  ON platform_kernel.outbox_messages (aggregate_type, aggregate_id, created_at);

-- Consumer-side idempotency: one row per (consumer, message) — the unique
-- primary key is the at-least-once dedupe mechanism (Doc 16 §54).
CREATE TABLE platform_kernel.inbox_messages (
  consumer_name          text NOT NULL,
  message_id             uuid NOT NULL,
  event_type             text NOT NULL,
  received_at            timestamptz NOT NULL DEFAULT now(),
  processed_at           timestamptz,
  outcome                text CHECK (outcome IN ('Processed', 'Skipped', 'Failed')),
  failure_reason         text,
  PRIMARY KEY (consumer_name, message_id)
);

CREATE TABLE platform_kernel.dead_letter_records (
  id                     uuid PRIMARY KEY,
  source                 text NOT NULL,
  message_id             uuid,
  event_type             text,
  payload_reference      text,
  failure_reason         text NOT NULL,
  attempt_count          integer NOT NULL DEFAULT 0,
  dead_lettered_at       timestamptz NOT NULL DEFAULT now(),
  replayed_at            timestamptz,
  replay_authorised_by   text
);

-- Command idempotency records, scoped per Doc 15 §29:
-- actor + organisation + endpoint + target + key, with a request hash so
-- key reuse with a different body is detectable (IDEMPOTENCY_CONFLICT).
CREATE TABLE platform_kernel.idempotency_records (
  id                     uuid PRIMARY KEY,
  actor_id               text NOT NULL,
  organisation_id        text,
  endpoint               text NOT NULL,
  target                 text,
  idempotency_key        text NOT NULL,
  request_hash           text NOT NULL,
  response_snapshot      jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  expires_at             timestamptz NOT NULL
);

CREATE UNIQUE INDEX idempotency_records_scope_key
  ON platform_kernel.idempotency_records (actor_id, coalesce(organisation_id, ''), endpoint, idempotency_key);

CREATE INDEX idempotency_records_expiry_idx
  ON platform_kernel.idempotency_records (expires_at);

-- Down Migration
DROP TABLE platform_kernel.idempotency_records;
DROP TABLE platform_kernel.dead_letter_records;
DROP TABLE platform_kernel.inbox_messages;
DROP TABLE platform_kernel.outbox_messages;
DROP SCHEMA platform_kernel;
