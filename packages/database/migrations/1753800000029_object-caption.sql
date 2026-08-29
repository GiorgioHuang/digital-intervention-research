-- Up Migration
-- Words the owner wrote about a file they added.
--
-- The design's Home carries a card headed "FINISH WHAT YOU STARTED": "A
-- photograph with no words … You added a photograph on Tuesday. Nobody
-- knows yet who is in it." A photograph in somebody's life story with
-- nothing said about it is a real and specific unfinished state, and the
-- platform had no way to represent it — a picture could be attached, and
-- there was nowhere to put who was in it or when it was taken.
--
-- Nullable, because null IS the state the card exists to find. An empty
-- string is not the same thing and must not be used for it: somebody who
-- opens the caption screen, thinks about it and saves nothing has still
-- not said who is in the photograph, so the row goes back to null rather
-- than storing emptiness that would read as "answered".
--
-- On stored_objects rather than in life_story, deliberately. The caption
-- describes this file and nothing else, so it lives with it; a table in
-- another schema would need a cross-schema foreign key to say the same
-- thing. Objects are already polymorphic through owning_resource_type, and
-- a caption on a file that is not a photograph is simply null forever.
ALTER TABLE storage_ops.stored_objects
  ADD COLUMN caption text,
  ADD COLUMN caption_written_at timestamptz;

-- Both or neither. A caption with no time is a fact with no provenance,
-- and a time with no caption says something was written when it was not.
ALTER TABLE storage_ops.stored_objects
  ADD CONSTRAINT stored_objects_caption_complete
  CHECK ((caption IS NULL) = (caption_written_at IS NULL));

-- Whitespace is not a caption. The application trims and stores null, and
-- this is the same rule at the level that cannot be bypassed by a caller
-- who reaches the table another way.
ALTER TABLE storage_ops.stored_objects
  ADD CONSTRAINT stored_objects_caption_not_blank
  CHECK (caption IS NULL OR btrim(caption) <> '');

-- Down Migration
ALTER TABLE storage_ops.stored_objects
  DROP CONSTRAINT stored_objects_caption_not_blank,
  DROP CONSTRAINT stored_objects_caption_complete,
  DROP COLUMN caption_written_at,
  DROP COLUMN caption;
