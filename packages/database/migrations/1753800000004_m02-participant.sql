-- Up Migration
-- M02 Participant Profile and Preferences (minimal P3 slice; Doc 8 §2.2).

CREATE SCHEMA IF NOT EXISTS participant_profile;

CREATE TABLE participant_profile.participants (
  id                text PRIMARY KEY,
  -- A Participant may exist without a login (Doc 8 §2.2).
  user_account_id   text,
  display_name      text NOT NULL,
  participant_state text NOT NULL DEFAULT 'Active'
                    CHECK (participant_state IN ('Active', 'Paused', 'Withdrawn', 'Archived')),
  record_version    integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX participants_account_unique
  ON participant_profile.participants (user_account_id) WHERE user_account_id IS NOT NULL;

-- Accessibility preferences: explicit Participant choice > inference (Doc 5).
CREATE TABLE participant_profile.accessibility_preferences (
  id              text PRIMARY KEY,
  participant_id  text NOT NULL REFERENCES participant_profile.participants (id),
  preference_type text NOT NULL,
  preference_value text NOT NULL,
  source          text NOT NULL CHECK (source IN
                    ('ExplicitChoice', 'SavedPreference', 'TaskRequirement', 'SupporterAssisted', 'ObservedDifficulty', 'SystemSuggestion')),
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  superseded_at   timestamptz
);

CREATE INDEX accessibility_preferences_participant_idx
  ON participant_profile.accessibility_preferences (participant_id) WHERE superseded_at IS NULL;

-- Down Migration
DROP TABLE participant_profile.accessibility_preferences;
DROP TABLE participant_profile.participants;
DROP SCHEMA participant_profile;
