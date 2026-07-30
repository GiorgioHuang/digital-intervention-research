-- Up Migration
-- M17 Life Story and Personal Archive (Doc 8 §2.4, ADR-023/024).

CREATE SCHEMA IF NOT EXISTS life_story;

CREATE TABLE life_story.archives (
  id             text PRIMARY KEY,
  participant_id text NOT NULL UNIQUE,
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE life_story.items (
  id             text PRIMARY KEY,
  archive_id     text NOT NULL REFERENCES life_story.archives (id),
  title          text NOT NULL,
  item_state     text NOT NULL DEFAULT 'Draft' CHECK (item_state IN
                   ('Draft', 'Active', 'Hidden', 'Restricted', 'Withdrawn', 'Archived', 'Deleted')),
  -- Visibility is a separate dimension from lifecycle state. Private by
  -- default (ADR-023). Internet Public is rejected at the database layer
  -- for the first Pilot (ADR-020) — the column constraint IS the flag.
  visibility     text NOT NULL DEFAULT 'Private' CHECK (visibility IN
                   ('Private', 'Selected People', 'Connections', 'Community', 'Platform Public')),
  current_version_id text,
  withdrawn_at   timestamptz,
  record_version integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Item content versions: content immutable once written; only the testimony
-- confirmation fields may change (AI Draft -> Participant Testimony happens
-- by explicit confirmation of the EXACT version, ADR-024 / ATR-007).
CREATE TABLE life_story.item_versions (
  id              text PRIMARY KEY,
  item_id         text NOT NULL REFERENCES life_story.items (id),
  version_number  integer NOT NULL,
  content_text    text NOT NULL,
  source_type     text NOT NULL CHECK (source_type IN
                    ('ParticipantAuthored', 'AIDraft', 'SupporterContribution', 'Transcription', 'Translation')),
  authored_by_actor_id text NOT NULL,
  testimony_state text NOT NULL DEFAULT 'NotTestimony'
                  CHECK (testimony_state IN ('NotTestimony', 'ParticipantTestimony')),
  confirmed_by_participant_id text,
  confirmed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, version_number),
  -- Testimony implies participant confirmation fields are present.
  CHECK (testimony_state = 'NotTestimony' OR (confirmed_by_participant_id IS NOT NULL AND confirmed_at IS NOT NULL))
);

CREATE OR REPLACE FUNCTION life_story.protect_version_content()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.content_text <> OLD.content_text
     OR NEW.source_type <> OLD.source_type
     OR NEW.authored_by_actor_id <> OLD.authored_by_actor_id THEN
    RAISE EXCEPTION 'item_versions: version content and authorship are immutable';
  END IF;
  IF OLD.testimony_state = 'ParticipantTestimony' AND NEW.testimony_state = 'NotTestimony' THEN
    RAISE EXCEPTION 'item_versions: confirmed testimony cannot be silently unconfirmed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER item_versions_content_immutable
  BEFORE UPDATE ON life_story.item_versions
  FOR EACH ROW EXECUTE FUNCTION life_story.protect_version_content();

CREATE TABLE life_story.contributions (
  id                   text PRIMARY KEY,
  archive_id           text NOT NULL REFERENCES life_story.archives (id),
  item_id              text REFERENCES life_story.items (id),
  contributor_actor_id text NOT NULL,
  content_text         text NOT NULL,
  contribution_state   text NOT NULL DEFAULT 'Proposed' CHECK (contribution_state IN
                         ('Proposed', 'In Review', 'Accepted', 'Rejected', 'Withdrawn', 'Superseded')),
  record_version       integer NOT NULL DEFAULT 1,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Selected People sharing grants (visibility scope support).
CREATE TABLE life_story.access_grants (
  id               text PRIMARY KEY,
  item_id          text NOT NULL REFERENCES life_story.items (id),
  grantee_actor_id text NOT NULL,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz
);

CREATE UNIQUE INDEX access_grants_active_unique
  ON life_story.access_grants (item_id, grantee_actor_id) WHERE revoked_at IS NULL;

-- Down Migration
DROP TABLE life_story.access_grants;
DROP TABLE life_story.contributions;
DROP TRIGGER item_versions_content_immutable ON life_story.item_versions;
DROP FUNCTION life_story.protect_version_content();
DROP TABLE life_story.item_versions;
DROP TABLE life_story.items;
DROP TABLE life_story.archives;
DROP SCHEMA life_story;
