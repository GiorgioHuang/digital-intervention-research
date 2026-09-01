-- Up Migration
-- "My supporters" — the scope a participant needs and did not have.
--
-- The five existing scopes are Private, Selected People, Connections,
-- Community and Platform Public, and none of them says "the people who
-- help me". Connections is participant-to-participant; a supporter is a
-- family member or friend in an approved relationship, which is a
-- different thing and, for this project, the important one: the purpose
-- is reducing loneliness by keeping somebody connected to their family,
-- and their daughter is a supporter, not a connection.
--
-- Without it a participant could only reach their own family through
-- Selected People, choosing each person again for every memory — or
-- through Community, which shares with strangers as well. Neither is what
-- they mean when they say their daughter should see this.
--
-- Owner's decision, 2026-09-01. Recorded in governance/BACKEND_GAPS.md as
-- B-30 with the two other rulings it came with: a photograph follows its
-- entry's scope rather than carrying one of its own, and an entry's
-- recorded scope takes effect when reading is built.
--
-- Rewriting the constraint rather than dropping it: the set of scopes a
-- memory may carry is enforced here and not only in the application,
-- because this column decides who may read somebody's life, and a
-- constraint is the one check no caller can go around. Internet Public
-- stays absent — the column constraint IS the ADR-020 feature flag.
ALTER TABLE life_story.items
  DROP CONSTRAINT items_visibility_check;

ALTER TABLE life_story.items
  ADD CONSTRAINT items_visibility_check CHECK (visibility IN
    ('Private', 'My Supporters', 'Selected People', 'Connections', 'Community', 'Platform Public'));

-- Down Migration
-- Anything already set to the new scope becomes Private on the way down,
-- rather than failing the constraint or being left readable under a scope
-- this schema no longer understands. Private is the safe direction: a
-- memory nobody can reach is a smaller wrong than one reachable under a
-- rule that no longer exists.
UPDATE life_story.items SET visibility = 'Private' WHERE visibility = 'My Supporters';

ALTER TABLE life_story.items
  DROP CONSTRAINT items_visibility_check;

ALTER TABLE life_story.items
  ADD CONSTRAINT items_visibility_check CHECK (visibility IN
    ('Private', 'Selected People', 'Connections', 'Community', 'Platform Public'));
