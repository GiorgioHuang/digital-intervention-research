-- Up Migration
-- B14 PublicProfile, minimal slice: what other people are shown.
--
-- Doc 20 §354 is a hard rule — the public profile and the participant
-- profile (the research one) are two different things and may NOT be
-- merged. Until now the platform had only the research record, so every
-- outward-facing name on the product came from it: the community feed,
-- a conversation, a connection. D-12 recorded that as a live cost and
-- said the question stays open until B14 exists.
--
-- The separation is structural rather than a convention: its own schema,
-- its own table, its own permission action, and nothing copies a value
-- between the two in either direction. The research record can hold
-- somebody's full name because the study office needs it; what other
-- people see is only ever what the person put here.
--
-- Absence is meaningful. A participant with no row here has not chosen a
-- public name, and the read side shows the uniform placeholder rather
-- than falling back to the research record (the C2 ruling, 2026-09-05).

CREATE SCHEMA IF NOT EXISTS public_profile;

CREATE TABLE public_profile.public_profiles (
  participant_id  text PRIMARY KEY REFERENCES participant_profile.participants (id),
  -- What this person would like to be called. Not derived from the
  -- research record's name: nothing here splits a name into parts,
  -- because a name is not reliably two halves in every culture that this
  -- study's population comes from.
  chosen_name     text NOT NULL CHECK (btrim(chosen_name) <> ''),
  -- Optional, and public when present — the drawing shows it beside the
  -- name on a shared memory. Never an address: the field is a city or a
  -- town, and the screen says so.
  city            text CHECK (city IS NULL OR btrim(city) <> ''),
  record_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public_profile.public_profiles IS
  'What other people are shown (Doc 20 §131-133). Separate from participant_profile.participants by hard rule §354; no value is copied between them.';

-- Down Migration
DROP TABLE IF EXISTS public_profile.public_profiles;
DROP SCHEMA IF EXISTS public_profile;
